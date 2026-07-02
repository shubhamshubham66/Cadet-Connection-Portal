// ─── SEED 22 BN ADMIN ACCOUNTS ───
// Run: node seed-bn-admins.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

const bnAdmins = [
  { name: 'BN Admin - 1 Assam', email: 'bn1assam@ccp.com', mobile: '9000000001', battalion: '1 Assam BN NCC', password: 'BnAssam1@2025' },
  { name: 'BN Admin - 2 Assam', email: 'bn2assam@ccp.com', mobile: '9000000002', battalion: '2 Assam BN NCC', password: 'BnAssam2@2025' },
  { name: 'BN Admin - 3 Assam', email: 'bn3assam@ccp.com', mobile: '9000000003', battalion: '3 Assam BN NCC', password: 'BnAssam3@2025' },
  { name: 'BN Admin - 4 Assam', email: 'bn4assam@ccp.com', mobile: '9000000004', battalion: '4 Assam BN NCC', password: 'BnAssam4@2025' },
  { name: 'BN Admin - 5 Assam', email: 'bn5assam@ccp.com', mobile: '9000000005', battalion: '5 Assam BN NCC', password: 'BnAssam5@2025' },
  { name: 'BN Admin - 6 Assam', email: 'bn6assam@ccp.com', mobile: '9000000006', battalion: '6 Assam BN NCC', password: 'BnAssam6@2025' },
  { name: 'BN Admin - 7 Assam', email: 'bn7assam@ccp.com', mobile: '9000000007', battalion: '7 Assam BN NCC', password: 'BnAssam7@2025' },
  { name: 'BN Admin - 8 Assam', email: 'bn8assam@ccp.com', mobile: '9000000008', battalion: '8 Assam BN NCC', password: 'BnAssam8@2025' },
  { name: 'BN Admin - 12 Assam', email: 'bn12assam@ccp.com', mobile: '9000000009', battalion: '12 Assam (I) Coy NCC', password: 'BnAssam12@2025' },
  { name: 'BN Admin - 30 Assam', email: 'bn30assam@ccp.com', mobile: '9000000010', battalion: '30 Assam BN NCC', password: 'BnAssam30@2025' },
  { name: 'BN Admin - 60 Assam Girls', email: 'bn60assamgirls@ccp.com', mobile: '9000000011', battalion: '60 Assam Girls BN NCC', password: 'BnAssam60@2025' },
  { name: 'BN Admin - 22 Arunachal', email: 'bn22arunachal@ccp.com', mobile: '9000000012', battalion: '22 Arunachal Pradesh BN NCC', password: 'BnArunachal22@2025' },
  { name: 'BN Admin - 14 Manipur', email: 'bn14manipur@ccp.com', mobile: '9000000013', battalion: '14 Manipur BN NCC', password: 'BnManipur14@2025' },
  { name: 'BN Admin - 65 Manipur Girls', email: 'bn65manipurgirls@ccp.com', mobile: '9000000014', battalion: '65 Manipur Girls BN NCC', password: 'BnManipur65@2025' },
  { name: 'BN Admin - 2 Meghalaya', email: 'bn2meghalaya@ccp.com', mobile: '9000000015', battalion: '2 Meghalaya BN NCC', password: 'BnMeghalaya2@2025' },
  { name: 'BN Admin - 61 Meghalaya Girls', email: 'bn61meghalayagirls@ccp.com', mobile: '9000000016', battalion: '61 Meghalaya Girls BN NCC', password: 'BnMeghalaya61@2025' },
  { name: 'BN Admin - 20 Mizo', email: 'bn20mizo@ccp.com', mobile: '9000000017', battalion: '20 Mizo BN NCC', password: 'BnMizo20@2025' },
  { name: 'BN Admin - 1 Nagaland', email: 'bn1nagaland@ccp.com', mobile: '9000000018', battalion: '1 Nagaland BN NCC', password: 'BnNagaland1@2025' },
  { name: 'BN Admin - 1 Nagaland Girls', email: 'bn1nagalandgirls@ccp.com', mobile: '9000000019', battalion: '1 Nagaland Girls BN NCC', password: 'BnNagaland1G@2025' },
  { name: 'BN Admin - 1 Nagaland Air', email: 'bn1nagalandair@ccp.com', mobile: '9000000020', battalion: '1 Nagaland Air Squadron NCC', password: 'BnNagalandAir@2025' },
  { name: 'BN Admin - 13 Tripura', email: 'bn13tripura@ccp.com', mobile: '9000000021', battalion: '13 Tripura BN NCC', password: 'BnTripura13@2025' },
  { name: 'BN Admin - 15 Tripura', email: 'bn15tripura@ccp.com', mobile: '9000000022', battalion: '15 Tripura BN NCC', password: 'BnTripura15@2025' }
];

async function seedBnAdmins() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Remove old BN Admins (except the one created by seed.js)
    await Admin.deleteMany({ role: 'BnAdmin' });
    console.log('Old BN Admins removed.\n');

    console.log('Creating 22 BN Admin accounts...\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  #  | Email                        | Password           | Battalion');
    console.log('═══════════════════════════════════════════════════════════════');

    for (let i = 0; i < bnAdmins.length; i++) {
      const admin = bnAdmins[i];
      const hashedPwd = await bcrypt.hash(admin.password, 12);

      await Admin.create({
        name: admin.name,
        email: admin.email,
        mobile: admin.mobile,
        password: hashedPwd,
        role: 'BnAdmin',
        assignedBattalion: admin.battalion,
        status: 'active'
      });

      console.log(`  ${(i+1).toString().padStart(2)}  | ${admin.email.padEnd(28)} | ${admin.password.padEnd(18)} | ${admin.battalion}`);
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`\n✅ All 22 BN Admin accounts created successfully!`);
    console.log('\nLogin URL: https://cadet-connection-portal.vercel.app/bn-admin-login.html');
    console.log('\nEach BN Admin can ONLY see cadets from their assigned battalion.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

seedBnAdmins();
