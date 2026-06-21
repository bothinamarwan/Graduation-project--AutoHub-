const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * connectDB
 * Standard Mongoose connection logic for MongoDB.
 * Reads MONGO_URI from the .env file.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`\n✅  MongoDB Connected: ${conn.connection.host}`);

    // Seed admin user if it doesn't exist
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminEmail && adminPassword) {
      const adminExists = await User.findOne({ email: adminEmail.toLowerCase() }).select('+password');
      if (!adminExists) {
        await User.create({
          name: 'Admin User',
          email: adminEmail,
          password: adminPassword,
          role: 'admin',
          authProvider: 'local',
          isProfileComplete: true,
        });
        console.log(`✅  Admin user auto-seeded successfully (${adminEmail})`);
      } else {
        let updated = false;
        if (adminExists.role !== 'admin') {
          adminExists.role = 'admin';
          updated = true;
        }
        if (adminExists.authProvider !== 'local') {
          adminExists.authProvider = 'local';
          updated = true;
        }
        if (adminExists.isProfileComplete !== true) {
          adminExists.isProfileComplete = true;
          updated = true;
        }
        const isPasswordCorrect = await adminExists.comparePassword(adminPassword);
        if (!isPasswordCorrect) {
          adminExists.password = adminPassword; // Pre-save hook will hash this
          updated = true;
        }
        if (updated) {
          await adminExists.save();
          console.log(`✅  Admin user credentials/role updated successfully to match environment variables.`);
        } else {
          console.log('ℹ️  Admin user already exists in database with correct credentials and role.');
        }
      }
    } else {
      console.log('⚠️  Admin email or password missing in environment variables. Skipping seed.');
    }
  } catch (error) {
    console.error(`\n❌  Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
