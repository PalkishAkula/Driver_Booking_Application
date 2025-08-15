const Driver = require("../models/Driver");
const Booking = require("../models/Booking");
const User = require("../models/User");
const OtpToken = require("../models/OtpToken");
const bcrypt = require("bcryptjs");
const { sendMail } = require("../utils/mailer");

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// List available drivers with filtering
exports.getAvailableDrivers = async (req, res) => {
  try {
    const { pickup, drop, date, time, tripType } = req.query;
    // Find all available drivers
    let drivers = await Driver.find({ availabilityStatus: true })
      .populate("userId", "name phone email")
      .select("-licenseNumber");

    // If filtering params are provided, filter out drivers with conflicting bookings
    if (date && time) {
      const bookingTime = new Date(`${date}T${time}`);
      // Find drivers who have a booking at this time (pending/confirmed)
      const conflictingBookings = await Booking.find({
        bookingTime: bookingTime,
        status: { $in: ["pending", "confirmed"] },
      });
      const busyDriverIds = conflictingBookings.map((b) => String(b.driverId));
      drivers = drivers.filter(
        (driver) => !busyDriverIds.includes(String(driver._id))
      );
    }
    // Optionally, filter by vehicleDetails for tripType (if relevant)
    // Optionally, filter by pickup/drop if you want to match location (not implemented here)
    res.json({ drivers });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch drivers", error: err.message });
  }
};

// Rate a driver — stores detailed entry and recomputes average
exports.rateDriver = async (req, res) => {
  try {
    const { rating, comment = "", bookingId } = req.body;
    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5." });
    }
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: "Driver not found." });

    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Upsert by user+booking to avoid duplicates
    const r = Number(rating);
    const existingIdx = driver.ratings?.findIndex(
      (x) => String(x.userId) === String(userId) && (bookingId ? String(x.bookingId) === String(bookingId) : true)
    );
    if (existingIdx != null && existingIdx >= 0) {
      driver.ratings[existingIdx].rating = r;
      driver.ratings[existingIdx].comment = comment;
      if (bookingId) driver.ratings[existingIdx].bookingId = bookingId;
    } else {
      driver.ratings = driver.ratings || [];
      driver.ratings.push({ userId, rating: r, comment, bookingId });
    }

    // Recompute average
    const sum = (driver.ratings || []).reduce((acc, x) => acc + (Number(x.rating) || 0), 0);
    const count = (driver.ratings || []).length || 1;
    driver.rating = Number((sum / count).toFixed(2));

    await driver.save();
    res.json({ message: "Rating submitted.", rating: driver.rating });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to submit rating", error: err.message });
  }
};

// Set driver availability
exports.setAvailability = async (req, res) => {
  try {
    const { available } = req.body;
    const driver = await Driver.findOneAndUpdate(
      { userId: req.user.userId },
      { availabilityStatus: available },
      { new: true }
    );
    if (!driver) return res.status(404).json({ message: "Driver not found." });
    // Emit availability change for potential realtime updates
    try {
      const { getIO } = require("../utils/socket");
      getIO().to(`driverUser:${driver.userId}`).emit("driver:status", {
        availabilityStatus: driver.availabilityStatus,
      });
    } catch {}
    res.json({
      message: "Availability updated.",
      availabilityStatus: driver.availabilityStatus,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update availability", error: err.message });
  }
};

// Get all bookings for this driver (optionally filtered by status)
exports.getDriverBookings = async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.userId });
    if (!driver) return res.status(404).json({ message: "Driver not found." });
    const { status } = req.query; // e.g. pending, confirmed, started, completed, rejected
    const filter = { driverId: driver._id };
    if (status) filter.status = status;
    const bookings = await Booking.find(filter)
      .populate("userId", "name phone")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch bookings", error: err.message });
  }
};

// Accept or reject a booking
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' | 'rejected' | 'started' | 'completed' | 'confirmed'
    if (
      !["accepted", "rejected", "started", "completed", "confirmed"].includes(
        status
      )
    ) {
      return res.status(400).json({ message: "Invalid status update." });
    }
    const driver = await Driver.findOne({ userId: req.user.userId });
    if (!driver) return res.status(404).json({ message: "Driver not found." });
    const booking = await Booking.findOne({
      _id: req.params.id,
      driverId: driver._id,
    });
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });
    if (status === "accepted") {
      if (typeof booking.fare !== "number" || booking.fare <= 0) {
        return res
          .status(400)
          .json({ message: "Set fare before confirming the booking." });
      }
    }
    booking.status = status;
    if (status === "completed") {
      driver.completedTrips += 1;
      await driver.save();
    }
    await booking.save();
    // Emit events to both user and driver for realtime updates
    try {
      const { getIO } = require("../utils/socket");
      // notify requesting user
      getIO()
        .to(`user:${String(booking.userId)}`)
        .emit("booking:status", {
          bookingId: booking._id,
          status,
        });
      // notify driver user (self) as well
      getIO()
        .to(`driverUser:${String(driver.userId)}`)
        .emit("booking:status", {
          bookingId: booking._id,
          status,
        });
    } catch {}

    res.json({ message: `Booking status updated to ${status}.` });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update booking status", error: err.message });
  }
};

// Set fare for a booking (driver only)
exports.setBookingFare = async (req, res) => {
  try {
    const { fare } = req.body;
    if (typeof fare !== "number" || fare <= 0) {
      return res
        .status(400)
        .json({ message: "Fare must be a positive number." });
    }
    const driver = await Driver.findOne({ userId: req.user.userId });
    if (!driver) return res.status(404).json({ message: "Driver not found." });
    const booking = await Booking.findOne({
      _id: req.params.id,
      driverId: driver._id,
    });
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });
    booking.fare = fare;
    await booking.save();
    res.json({ message: "Fare updated.", booking });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update fare", error: err.message });
  }
};

// Driver earnings summary
exports.getEarnings = async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.userId });
    if (!driver) return res.status(404).json({ message: "Driver not found." });
    const completedBookings = await Booking.find({
      driverId: driver._id,
      status: "completed",
    });
    const totalEarnings = completedBookings.reduce((sum, b) => sum + b.fare, 0);
    res.json({ completedTrips: driver.completedTrips, totalEarnings });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch earnings", error: err.message });
  }
};

// Get current driver details (driver + linked user minimal fields)
exports.getMe = async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.userId }).populate(
      "userId",
      "name email phone profileImage"
    );
    if (!driver) return res.status(404).json({ message: "Driver not found." });
    res.json({ driver });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch driver details", error: err.message });
  }
};

// Update driver details: availability (optional is via /status), vehicle details, license
exports.updateMe = async (req, res) => {
  try {
    const { vehicleDetails, licenseNumber, profileImage } = req.body;
    const driver = await Driver.findOne({ userId: req.user.userId });
    if (!driver) return res.status(404).json({ message: "Driver not found." });
    if (vehicleDetails !== undefined) driver.vehicleDetails = vehicleDetails;
    if (licenseNumber !== undefined) driver.licenseNumber = licenseNumber;
    if (profileImage !== undefined) driver.profileImage = profileImage;
    await driver.save();
    res.json({ message: "Driver profile updated.", driver });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update driver profile", error: err.message });
  }
};

// Send OTP to user's email for starting a trip
exports.sendStartTripOtp = async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.userId });
    if (!driver) return res.status(404).json({ message: "Driver not found." });
    const booking = await Booking.findOne({
      _id: req.params.id,
      driverId: driver._id,
    }).populate({ path: "userId", select: "email name" });
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });
    if (booking.status !== "confirmed")
      return res
        .status(400)
        .json({ message: "Trip must be confirmed before starting." });
    const userEmail = booking.userId?.email;
    if (!userEmail)
      return res.status(400).json({ message: "User email not available." });

    // create token
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // upsert token for this booking
    await OtpToken.findOneAndUpdate(
      { bookingId: booking._id },
      { bookingId: booking._id, email: userEmail, otpHash, expiresAt },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    let sent = false;
    try {
      await sendMail({
        to: userEmail,
        subject: "Trip Start Verification Code",
        text: `Your OTP code is ${otp}. It expires in 5 minutes.`,
      });
      sent = true;
    } catch (mailErr) {
      // swallow email errors; OTP is created and can be re-sent
      sent = false;
    }

    res.json({
      message: sent
        ? "OTP sent to user's email."
        : "OTP generated. Email send failed; try resend.",
      sent,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to send OTP", error: err.message });
  }
};

// Verify OTP and start trip
exports.verifyStartTripOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ message: "OTP is required." });

    const driver = await Driver.findOne({ userId: req.user.userId });
    if (!driver) return res.status(404).json({ message: "Driver not found." });

    const booking = await Booking.findOne({
      _id: req.params.id,
      driverId: driver._id,
    });
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });

    const tokenDoc = await OtpToken.findOne({ bookingId: booking._id });
    if (!tokenDoc)
      return res
        .status(400)
        .json({ message: "OTP not found. Please request a new one." });
    if (new Date() > tokenDoc.expiresAt) {
      await OtpToken.deleteOne({ _id: tokenDoc._id });
      return res.status(400).json({ message: "OTP expired." });
    }

    const ok = await bcrypt.compare(otp, tokenDoc.otpHash);
    if (!ok) return res.status(400).json({ message: "Invalid OTP." });

    booking.status = "started";
    await booking.save();
    await OtpToken.deleteOne({ _id: tokenDoc._id });

    // Notify user and driver
    try {
      const { getIO } = require("../utils/socket");
      getIO()
        .to(`user:${String(booking.userId)}`)
        .emit("booking:status", { bookingId: booking._id, status: "started" });
      getIO()
        .to(`driverUser:${String(driver.userId)}`)
        .emit("booking:status", { bookingId: booking._id, status: "started" });
    } catch {}

    res.json({ message: "Trip started." });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to verify OTP", error: err.message });
  }
};
