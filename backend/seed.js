/**
 * Seed script — Creates a default admin account
 * Usage: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if admin exists
    const existing = await User.findOne({ role: 'Admin' });
    if (existing) {
      console.log('Admin already exists:', existing.email);
      process.exit(0);
    }

    const admin = await User.create({
      name: 'Admin',
      email: 'admin@ccp.com',
      mobile: '9876543210',
      password: 'admin123',
      role: 'Admin',
    });

    console.log('Default admin created:');
    console.log('  Email: admin@ccp.com');
    console.log('  Mobile: 9876543210');
    console.log('  Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seedAdmin();
