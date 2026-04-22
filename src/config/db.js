const mongoose = require('mongoose');

/**
 * connectDB
 * Standard Mongoose connection logic for MongoDB.
 * Reads MONGO_URI from the .env file.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`\n✅  MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`\n❌  Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
