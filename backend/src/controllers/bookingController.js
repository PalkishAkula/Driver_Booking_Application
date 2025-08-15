const Booking = require("../models/Booking");
const Driver = require("../models/Driver");
const axios = require("axios");

// Haversine distance in kilometers
function haversineDistance(coords1, coords2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lon - coords1.lon);
  const lat1 = toRad(coords1.lat);
  const lat2 = toRad(coords2.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const {
      driverId,
      pickupLocation,
      dropLocation,
      bookingTime,
      fare,
      tripType,
    } = req.body;
    // Allow fare = 0; only reject when fare is undefined/null
    if (
      !driverId ||
      !pickupLocation ||
      !dropLocation ||
      !bookingTime ||
      fare === undefined ||
      fare === null ||
      !tripType
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }
    // Optionally, check if driver exists and is available
    const driver = await Driver.findById(driverId);
    if (!driver || !driver.availabilityStatus) {
      return res.status(400).json({ message: "Driver not available." });
    }
    // Geocode pickup and drop using Nominatim
    let pickupCoords = null;
    let dropCoords = null;
    try {
      const [pRes, dRes] = await Promise.all([
        axios.get("https://nominatim.openstreetmap.org/search", {
          params: { q: pickupLocation, format: "json", limit: 1 },
          headers: { "User-Agent": "bookingdriving-app" },
        }),
        axios.get("https://nominatim.openstreetmap.org/search", {
          params: { q: dropLocation, format: "json", limit: 1 },
          headers: { "User-Agent": "bookingdriving-app" },
        }),
      ]);
      if (pRes.data?.length) {
        pickupCoords = {
          lat: parseFloat(pRes.data[0].lat),
          lon: parseFloat(pRes.data[0].lon),
        };
      }
      if (dRes.data?.length) {
        dropCoords = {
          lat: parseFloat(dRes.data[0].lat),
          lon: parseFloat(dRes.data[0].lon),
        };
      }
    } catch (e) {
      // Non-fatal: proceed without coords
    }

    const distanceKm =
      pickupCoords && dropCoords
        ? parseFloat(haversineDistance(pickupCoords, dropCoords).toFixed(3))
        : undefined;

    const booking = new Booking({
      userId: req.user.userId,
      driverId,
      pickupLocation,
      dropLocation,
      pickupCoords,
      dropCoords,
      distanceKm,
      bookingTime,
      fare,
      tripType,
      status: "pending",
    });
    await booking.save();
    // Emit socket event to the driver user
    try {
      const { getIO } = require("../utils/socket");
      const Driver = require("../models/Driver");
      const driverDoc = await Driver.findById(driverId);
      if (driverDoc) {
        getIO()
          .to(`driverUser:${String(driverDoc.userId)}`)
          .emit("booking:created", {
            bookingId: booking._id,
            pickupLocation,
            dropLocation,
            bookingTime,
            fare,
            tripType,
          });
      }
    } catch {}

    res.status(201).json({ message: "Booking created successfully.", booking });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Booking creation failed", error: err.message });
  }
};

// Get all bookings for the authenticated user
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.userId })
      .populate({
        path: "driverId",
        populate: { path: "userId", select: "name phone" },
        select: "userId vehicleDetails rating",
      })
      .sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch bookings", error: err.message });
  }
};

// Cancel a booking
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });
    if (
      booking.status !== "pending" &&
      booking.status !== "accepted" &&
      booking.status !== "confirmed"
    ) {
      return res.status(400).json({ message: "Cannot cancel this booking." });
    }
    booking.status = "cancelled";
    await booking.save();
    // Notify both parties
    try {
      const { getIO } = require("../utils/socket");
      const Driver = require("../models/Driver");
      const driverDoc = await Driver.findById(booking.driverId);
      getIO().to(`user:${booking.userId}`).emit("booking:status", {
        bookingId: booking._id,
        status: "cancelled",
      });
      if (driverDoc) {
        getIO().to(`driverUser:${driverDoc.userId}`).emit("booking:status", {
          bookingId: booking._id,
          status: "cancelled",
        });
      }
    } catch {}
    res.json({ message: "Booking cancelled successfully." });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to cancel booking", error: err.message });
  }
};

// Get details for a single booking (for the authenticated user)
exports.getBookingDetails = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    }).populate({
      path: "driverId",
      populate: { path: "userId", select: "name phone" },
      select: "userId vehicleDetails photo rating",
    });
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });
    res.json({ booking });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch booking details", error: err.message });
  }
};

// User confirms an accepted booking -> becomes confirmed
exports.confirmAcceptedBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });
    if (booking.status !== "accepted") {
      return res
        .status(400)
        .json({ message: "Only accepted bookings can be confirmed." });
    }
    booking.status = "confirmed";
    await booking.save();
    // Notify both parties
    try {
      const { getIO } = require("../utils/socket");
      const Driver = require("../models/Driver");
      const driverDoc = await Driver.findById(booking.driverId);
      getIO().to(`user:${booking.userId}`).emit("booking:status", {
        bookingId: booking._id,
        status: "confirmed",
      });
      if (driverDoc) {
        getIO().to(`driverUser:${driverDoc.userId}`).emit("booking:status", {
          bookingId: booking._id,
          status: "confirmed",
        });
      }
    } catch {}
    res.json({ message: "Booking confirmed." });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to confirm booking", error: err.message });
  }
};
