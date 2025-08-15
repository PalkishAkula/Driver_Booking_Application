const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  licenseNumber: { type: String, required: true },
  vehicleDetails: { type: String, required: true },
  availabilityStatus: { type: Boolean, default: true },
  // Average rating computed from detailed ratings below
  rating: { type: Number, default: 0 },
  // Detailed ratings per user/booking
  ratings: [
    new mongoose.Schema(
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        rating: { type: Number, min: 1, max: 5, required: true },
        comment: { type: String, default: "" },
        bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
      },
      { _id: false, timestamps: { createdAt: true, updatedAt: false } }
    ),
  ],
  completedTrips: { type: Number, default: 0 },
  profileImage: { type: String, default: "" },
  earnings: { type: Number, default: 0 },
});

module.exports = mongoose.model("Driver", driverSchema);
