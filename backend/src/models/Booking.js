const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    required: true,
  },
  pickupLocation: { type: String, required: true },
  dropLocation: { type: String, required: true },
  // Store geocoded coordinates
  pickupCoords: {
    lat: { type: Number },
    lon: { type: Number },
  },
  dropCoords: {
    lat: { type: Number },
    lon: { type: Number },
  },
  // Straight-line distance in kilometers (Haversine)
  distanceKm: { type: Number },
  bookingTime: { type: Date, required: true },
  tripType: {
    type: String,
    enum: ["one-way", "round-trip", "hourly", "daily"],
    required: true,
  },
  status: {
    type: String,
    enum: [
      "pending",
      "accepted",
      "confirmed",
      "started",
      "rejected",
      "completed",
      "cancelled",
    ],
    default: "pending",
  },
  fare: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Booking", bookingSchema);
