const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  userType: { type: String, enum: ['customer', 'driver'], required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  location: { type: String },
  isVerified: { type: Boolean, default: false },
  profileImage: { type: String }, // Cloudinary URL
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
