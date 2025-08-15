const cloudinary = require('cloudinary').v2;

// Prefer env variables if present. Fallback to provided values.
// NOTE: In Cloudinary, api_key is usually numeric, api_secret is an alphanumeric string.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dw2xkm3mg',
  api_key: process.env.CLOUDINARY_API_KEY || '137133829349422',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Kc8cIz8zud86u8HNbZxyeZ0MvYs',
});

module.exports = cloudinary;
