const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

(async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bookingdriving';
    await mongoose.connect(mongoUri, {
      dbName: process.env.MONGO_DB_NAME || 'test',
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const email = 'palkishakula22@gmail.com'.toLowerCase().trim();
    const password = '1234567890';

    const passwordHash = await bcrypt.hash(password, 12);

    const existing = await Admin.findOne({ email });
    if (existing) {
      existing.passwordHash = passwordHash;
      await existing.save();
      console.log('Admin updated:', email);
    } else {
      await Admin.create({ email, passwordHash, role: 'admin' });
      console.log('Admin created:', email);
    }
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
