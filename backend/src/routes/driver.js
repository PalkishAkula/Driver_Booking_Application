const express = require("express");
const router = express.Router();
const driverController = require("../controllers/driverController");
const authMiddleware = require("../middleware/authMiddleware");

// List available drivers
router.get("/", authMiddleware, driverController.getAvailableDrivers);
// Get current driver details
router.get("/me", authMiddleware, driverController.getMe);
// Update current driver details
router.put("/me", authMiddleware, driverController.updateMe);
// Rate a driver
router.post("/:id/rating", authMiddleware, driverController.rateDriver);
// Set driver availability
router.put("/status", authMiddleware, driverController.setAvailability);
// Get driver bookings
router.get("/bookings", authMiddleware, driverController.getDriverBookings);
// Update booking status (accept/reject/start/complete)
router.put(
  "/bookings/:id/status",
  authMiddleware,
  driverController.updateBookingStatus
);
// Set fare for a booking
router.patch(
  "/bookings/:id/fare",
  authMiddleware,
  driverController.setBookingFare
);
// Get earnings
router.get("/earnings", authMiddleware, driverController.getEarnings);
// Send OTP to start trip
router.post(
  "/bookings/:id/start-otp",
  authMiddleware,
  driverController.sendStartTripOtp
);
// Verify OTP and start trip
router.post(
  "/bookings/:id/start-verify",
  authMiddleware,
  driverController.verifyStartTripOtp
);

module.exports = router;
