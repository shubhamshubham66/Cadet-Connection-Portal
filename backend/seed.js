// ─── DATABASE SEED SCRIPT ───
// Run: node seed.js
// Creates default Main Admin and sample battalions

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');
const Battalion = require('./models/Battalion');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create Main Admin (if not exists)
    const existingAdmin = await Admin.findOne({ role: 'MainAdmin' });
    if (!existingAdmin) {
      const hashedPwd = await bcrypt.hash('Admin@123', 12);
      await Admin.create({
        name: 'CCP Main Admin',
        email: 'admin@ccp.com',
        mobile: '9876543210',
        password: hashedPwd,
        role: 'MainAdmin',
        status: 'active'
      });
      console.log('Main Admin created: admin@ccp.com / Admin@123');
    } else {
      console.log('Main Admin already exists.');
    }

    // Create sample BN Admin
    const existingBnAdmin = await Admin.findOne({ role: 'BnAdmin' });
    if (!existingBnAdmin) {
      const hashedPwd = await bcrypt.hash('Bn@admin1', 12);
      await Admin.create({
        name: 'BN Admin - 13 Tripura',
        email: 'bnadmin@ccp.com',
        mobile: '9876543211',
        password: hashedPwd,
        role: 'BnAdmin',
        assignedBattalion: '13 Tripura BN NCC',
        status: 'active'
      });
      console.log('BN Admin created: bnadmin@ccp.com / Bn@admin1 (13 Tripura BN NCC)');
    }

    // Create sample College Admin
    const existingCollegeAdmin = await Admin.findOne({ role: 'CollegeAdmin' });
    if (!existingCollegeAdmin) {
      const hashedPwd = await bcrypt.hash('College@1', 12);
      await Admin.create({
        name: 'College Admin - Tripura University',
        email: 'collegeadmin@ccp.com',
        mobile: '9876543212',
        password: hashedPwd,
        role: 'CollegeAdmin',
        assignedBattalion: '13 Tripura BN NCC',
        assignedInstitute: 'Tripura University',
        status: 'active'
      });
      console.log('College Admin created: collegeadmin@ccp.com / College@1 (Tripura University)');
    }

    // Seed Battalions
    const bnCount = await Battalion.countDocuments();
    if (bnCount === 0) {
      const battalions = [
        { name: '1 Assam BN NCC', state: 'Assam', city: 'Guwahati', wing: 'Army' },
        { name: '2 Assam BN NCC', state: 'Assam', city: 'Dibrugarh', wing: 'Army' },
        { name: '3 Assam BN NCC', state: 'Assam', city: 'Silchar', wing: 'Army' },
        { name: '13 Tripura BN NCC', state: 'Tripura', city: 'Agartala', wing: 'Army' },
        { name: '15 Tripura BN NCC', state: 'Tripura', city: 'Agartala', wing: 'Army' },
        { name: '14 Manipur BN NCC', state: 'Manipur', city: 'Imphal', wing: 'Army' },
        { name: '2 Meghalaya BN NCC', state: 'Meghalaya', city: 'Shillong', wing: 'Army' },
        { name: '20 Mizo BN NCC', state: 'Mizoram', city: 'Aizawl', wing: 'Army' },
        { name: '1 Nagaland BN NCC', state: 'Nagaland', city: 'Kohima', wing: 'Army' },
        { name: '22 Arunachal Pradesh BN NCC', state: 'Arunachal Pradesh', city: 'Pasighat', wing: 'Army' },
        { name: '1 Nagaland Air Squadron NCC', state: 'Nagaland', city: 'Dimapur', wing: 'Air Force' }
      ];
      await Battalion.insertMany(battalions);
      console.log(`${battalions.length} battalions seeded.`);
    } else {
      console.log('Battalions already exist.');
    }

    console.log('\nSeed complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seed Error:', error);
    process.exit(1);
  }
}

seed();
