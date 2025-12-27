require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const connectDB = require('../config/database');

async function createAdmin() {
  try {
    await connectDB();
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Create admin user
    const adminPassword = 'admin123'; // Default password
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    const admin = await User.create({
      fullName: 'System Administrator',
      email: 'admin@supeai.com',
      passwordHash,
      role: 'admin',
      isApproved: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@supeai.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change the password after first login');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();
