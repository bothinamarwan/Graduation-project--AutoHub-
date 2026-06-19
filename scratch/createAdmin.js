require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function createOrUpdateAdmin() {
  const email = 'bosinamarwan58@gmail.com';
  const password = 'Bothina@58';
  const name = 'Bothina Marwan';
  const role = 'admin';

  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log(`User ${email} already exists. Updating role to 'admin'...`);
      existingUser.role = role;
      
      // Update password if they are a local provider
      if (existingUser.authProvider === 'local') {
        existingUser.password = password;
      }
      
      await existingUser.save();
      console.log('User updated successfully:', existingUser);
    } else {
      console.log(`User ${email} does not exist. Creating new admin user...`);
      const newUser = await User.create({
        name,
        email,
        password,
        role,
        authProvider: 'local',
        isProfileComplete: true
      });
      console.log('Admin user created successfully:', newUser);
    }
  } catch (err) {
    console.error('Error in script:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

createOrUpdateAdmin();
