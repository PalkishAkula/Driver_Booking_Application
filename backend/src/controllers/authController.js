const User = require('../models/User');
const Driver = require('../models/Driver');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const LoginOtpToken = require('../models/LoginOtpToken');
const PasswordResetToken = require('../models/PasswordResetToken');
const { sendMail } = require('../utils/mailer');

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, userType, location, licenseNumber, vehicleDetails } = req.body;
    if (!name || !email || !password || !phone || !userType) {
      return res.status(400).json({ message: 'All required fields must be filled.' });
    }
    if (userType === 'driver') {
      if (!licenseNumber || !vehicleDetails) {
        return res.status(400).json({ message: 'License number and vehicle details are required for driver signup.' });
      }
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered.' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, passwordHash, phone, userType, location });
    await user.save();

    // If driver, create corresponding Driver document
    if (userType === 'driver') {
      try {
        const driver = new Driver({
          userId: user._id,
          licenseNumber,
          vehicleDetails,
          // availabilityStatus, rating, completedTrips use defaults from schema
        });
        await driver.save();
        // Link back to user
        user.driverId = driver._id;
        await user.save();
      } catch (e) {
        // Rollback user if driver creation fails to keep data consistent
        await User.deleteOne({ _id: user._id });
        return res.status(500).json({ message: 'Driver profile creation failed', error: e.message });
      }
    }

    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

// Request OTP for password reset
exports.requestPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email.' });

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes for reset

    await PasswordResetToken.findOneAndUpdate(
      { email },
      { email, otpHash, expiresAt },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    let sent = false;
    try {
      await sendMail({
        to: email,
        subject: 'Password Reset Code',
        text: `Your password reset OTP is ${otp}. It expires in 10 minutes.`,
      });
      sent = true;
    } catch (e) {
      sent = false;
    }

    return res.json({
      message: sent ? 'OTP sent to your email.' : 'OTP generated. Email send failed; try resend.',
      sent,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to request password reset OTP', error: err.message });
  }
};

// Confirm password reset with OTP
exports.resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email.' });

    const tokenDoc = await PasswordResetToken.findOne({ email });
    if (!tokenDoc) return res.status(400).json({ message: 'OTP not found. Please request a new one.' });
    if (new Date() > tokenDoc.expiresAt) {
      await PasswordResetToken.deleteOne({ _id: tokenDoc._id });
      return res.status(400).json({ message: 'OTP expired.' });
    }

    const ok = await bcrypt.compare(otp, tokenDoc.otpHash);
    if (!ok) return res.status(400).json({ message: 'Invalid OTP.' });

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    await user.save();
    await PasswordResetToken.deleteOne({ _id: tokenDoc._id });

    return res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to reset password', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const token = jwt.sign({ userId: user._id, userType: user.userType }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, userType: user.userType, driverId: user.driverId } });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// Helper to generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Request OTP for passwordless login
exports.requestLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email.' });

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await LoginOtpToken.findOneAndUpdate(
      { email },
      { email, otpHash, expiresAt },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    let sent = false;
    try {
      await sendMail({
        to: email,
        subject: 'Your Login Verification Code',
        text: `Your OTP code is ${otp}. It expires in 5 minutes.`,
      });
      sent = true;
    } catch (e) {
      sent = false;
    }

    return res.json({
      message: sent ? 'OTP sent to your email.' : 'OTP generated. Email send failed; try resend.',
      sent,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to request OTP', error: err.message });
  }
};

// Verify OTP and issue JWT
exports.verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email.' });

    const tokenDoc = await LoginOtpToken.findOne({ email });
    if (!tokenDoc) return res.status(400).json({ message: 'OTP not found. Please request a new one.' });
    if (new Date() > tokenDoc.expiresAt) {
      await LoginOtpToken.deleteOne({ _id: tokenDoc._id });
      return res.status(400).json({ message: 'OTP expired.' });
    }

    const ok = await bcrypt.compare(otp, tokenDoc.otpHash);
    if (!ok) return res.status(400).json({ message: 'Invalid OTP.' });

    // success -> delete token and issue JWT
    await LoginOtpToken.deleteOne({ _id: tokenDoc._id });
    const token = jwt.sign({ userId: user._id, userType: user.userType }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, userType: user.userType, driverId: user.driverId },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to verify OTP', error: err.message });
  }
};

// ... previous code ...

exports.clerkGoogleLogin = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found for this Google email. Please register first.' });
    }
    // Issue JWT token (no password check needed)
    const token = jwt.sign({ userId: user._id, userType: user.userType }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Google login failed', error: err.message });
  }
};

// Get current user profile
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user info', error: err.message });
  }
};

// Update current user profile
const cloudinary = require('../utils/cloudinary');

exports.updateMe = async (req, res) => {
  try {
    const { name, email, phone, location, profileImage } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (location !== undefined) user.location = location;
    // Profile image upload
    if (profileImage && profileImage.startsWith('data:')) {
      // New image (base64)
      const uploadRes = await cloudinary.uploader.upload(profileImage, {
        folder: 'profiles',
        public_id: `user_${user._id}`,
        overwrite: true,
      });
      user.profileImage = uploadRes.secure_url;
    } else if (profileImage && profileImage.startsWith('http')) {
      // Already a URL
      user.profileImage = profileImage;
    }
    await user.save();
    res.json({ message: 'Profile updated.', user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, location: user.location, userType: user.userType, profileImage: user.profileImage } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
};

// ... rest of code ...
