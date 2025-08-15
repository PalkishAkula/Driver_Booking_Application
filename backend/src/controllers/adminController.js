const User = require('../models/User');
const Driver = require('../models/Driver');
const Booking = require('../models/Booking');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Dashboard analytics
exports.dashboard = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const totalUsers = await User.countDocuments({ userType: 'customer' });
    const totalDrivers = await Driver.countDocuments();
    const bookingsToday = await Booking.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) }});
    const revenue = await Booking.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$fare' } } }
    ]);
    res.json({
      totalBookings,
      totalUsers,
      totalDrivers,
      bookingsToday,
      revenue: revenue[0] ? revenue[0].total : 0
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch dashboard data', error: err.message });
  }
};

// List all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ userType: 'customer' }).select('-passwordHash');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
};

// List all drivers
exports.getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find().populate('userId', 'name email phone');
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch drivers', error: err.message });
  }
};

// List all bookings
exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'name email')
      .populate({ path: 'driverId', populate: { path: 'userId', select: 'name email' } })
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch bookings', error: err.message });
  }
};

// Driver details with bookings and aggregates
exports.getDriverDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await Driver.findById(id)
      .populate('userId', 'name email phone')
      .populate({ path: 'ratings.userId', select: 'name email' })
      .populate({ path: 'ratings.bookingId', select: 'pickupLocation dropoffLocation bookingTime' });
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    const bookings = await Booking.find({ driverId: id })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    const totalBookings = bookings.length;
    const completedTrips = bookings.filter(b => b.status === 'completed').length;
    const rejectedTrips = bookings.filter(b => b.status === 'rejected').length;
    const cancelledTrips = bookings.filter(b => b.status === 'cancelled' || b.status === 'canceled').length;
    const earnings = bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.fare || 0), 0);

    res.json({
      driver,
      stats: { totalBookings, completedTrips, rejectedTrips, cancelledTrips, earnings },
      bookings,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load driver details', error: err.message });
  }
};

// User details with bookings and aggregates
exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('name email phone userType');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const bookings = await Booking.find({ userId: id })
      .populate({ path: 'driverId', populate: { path: 'userId', select: 'name email phone' } })
      .sort({ createdAt: -1 });

    const completedTrips = await Booking.countDocuments({ userId: id, status: 'completed' });
    const totalBookings = await Booking.countDocuments({ userId: id });
    const spendAgg = await Booking.aggregate([
      { $match: { userId: user._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$fare' } } },
    ]);
    const totalSpend = spendAgg[0]?.total || 0;

    res.json({ user, stats: { totalBookings, completedTrips, totalSpend }, bookings });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user details', error: err.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
};

// Admin login (separate from user login) — email based
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    const admin = await Admin.findOne({ email: String(email).toLowerCase().trim() });
    if (!admin) return res.status(404).json({ message: 'Admin not found.' });
    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials.' });
    const token = jwt.sign({ userId: admin._id, userType: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, admin: { _id: admin._id, email: admin.email, role: 'admin' } });
  } catch (err) {
    res.status(500).json({ message: 'Admin login failed', error: err.message });
  }
};
