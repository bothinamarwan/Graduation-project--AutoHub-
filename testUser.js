require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  try {
    const user = await User.create({
      name: 'Test Google User',
      email: 'testgoogle@example.com',
      avatar: 'http://example.com/avatar.jpg',
      googleId: '123456789',
      authProvider: 'google',
      isProfileComplete: true,
      role: 'user',
    });
    console.log('User created successfully:', user);
  } catch (err) {
    console.error('Error creating user:', err);
  }
  process.exit();
}

test();
