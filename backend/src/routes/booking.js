const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const authMiddleware = require("../middleware/authMiddleware");

// Create booking
router.post("/", authMiddleware, bookingController.createBooking);
// Get user's bookings
router.get("/user", authMiddleware, bookingController.getUserBookings);
// Get booking details
router.get("/:id", authMiddleware, bookingController.getBookingDetails);
// Cancel booking
router.put("/:id/cancel", authMiddleware, bookingController.cancelBooking);
// Confirm accepted booking
router.put(
  "/:id/confirm",
  authMiddleware,
  bookingController.confirmAcceptedBooking
);

module.exports = router;
