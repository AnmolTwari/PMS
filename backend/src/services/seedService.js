const bcrypt = require('bcrypt');
const User = require('../models/User');
const ParkingSlot = require('../models/ParkingSlot');
const Branch = require('../models/Branch');

async function initializeParkingSlots() {
  const count = await ParkingSlot.countDocuments();
  if (count > 0) return;

  await Branch.updateOne(
    { code: 'MAIN' },
    { $setOnInsert: { name: 'Main Branch', code: 'MAIN', address: 'Primary site', isDefault: true, isActive: true } },
    { upsert: true },
  );

  const slots = [];
  const areaNames = ['Area A', 'Area B', 'Area C', 'Area D'];

  for (let area = 1; area <= 4; area++) {
    for (let slotNumber = 1; slotNumber <= 50; slotNumber++) {
      slots.push({
        branchName: 'Main Branch',
        branchCode: 'MAIN',
        parkingAreaId: area,
        areaName: areaNames[area - 1],
        slotNumber,
        status: 'available',
        occupied: false,
        carNumber: null,
        bookingTime: null,
        isPermanent: false,
        permanentUserId: null,
      });
    }
  }

  await ParkingSlot.insertMany(slots);
  console.log('✅ Parking slots initialized');
}

async function seedAdminUser() {
  const adminUsername = process.env.ADMIN_USERNAME || 'superadmin';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@company.com';
  const adminMobile = process.env.ADMIN_MOBILE || '0000000000';
  const adminEmployeeId = process.env.ADMIN_EMPLOYEE_ID || 'EMP001';
  const adminPassword = process.env.ADMIN_PASSWORD || 'SecurePass123!';

  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) return;

  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  await User.create({
    username: adminUsername,
    name: adminUsername,
    email: adminEmail,
    password: hashedPassword,
    mobile: adminMobile,
    employeeId: adminEmployeeId,
    department: 'Administration',
    branchName: 'Main Branch',
    branchCode: 'MAIN',
    role: 'superAdmin',
    isLoggedIn: false,
  });

  console.log('✅ Initial admin user created');
}

module.exports = {
  initializeParkingSlots,
  seedAdminUser,
};