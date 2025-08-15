const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminOnly');

// Public: admin login
router.post('/login', adminController.login);

router.get('/dashboard', authMiddleware, adminOnly, adminController.dashboard);
router.get('/users', authMiddleware, adminOnly, adminController.getUsers);
router.get('/drivers', authMiddleware, adminOnly, adminController.getDrivers);
router.get('/bookings', authMiddleware, adminOnly, adminController.getBookings);
router.delete('/user/:id', authMiddleware, adminOnly, adminController.deleteUser);
// details
router.get('/drivers/:id/details', authMiddleware, adminOnly, adminController.getDriverDetails);
router.get('/users/:id/details', authMiddleware, adminOnly, adminController.getUserDetails);

module.exports = router;
