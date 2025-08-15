const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/clerk-google', authController.clerkGoogleLogin);
// OTP passwordless login
router.post('/login-otp/request', authController.requestLoginOtp);
router.post('/login-otp/verify', authController.verifyLoginOtp);
// Forgot password via OTP
router.post('/password/otp-request', authController.requestPasswordResetOtp);
router.post('/password/reset', authController.resetPasswordWithOtp);

// User profile routes
router.get('/users/me', authMiddleware, authController.getMe);
router.put('/users/me', authMiddleware, authController.updateMe);

module.exports = router;
