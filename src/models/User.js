// const mongoose = require('mongoose'); // Import mongoose library for MongoDB interactions
// const bcrypt = require('bcrypt'); // Import bcrypt for password hashing

// /////////////////////Schema Definition/////////////////////
// const userSchema = new mongoose.Schema({
//     username: {
//         type: String,
//         required: true,
//         trim: true
//     },
//     email: {
//         type: String,
//         required: true,
//         unique: true,
//         lowercase: true,
//     },
//     password: {
//         type: String,
//         required: true,
//     },
//     role: {
//         type: String,
//         enum: ['user', 'dealer'],
//         default: 'user'
//     }
// }, { timestamps: true }); // Automatically manage createdAt and updatedAt fields

// ///////////////////////Password Hashing Middleware/////////////////////
// // Using async pre-save hook without next() for Mongoose 9+
// userSchema.pre("save", async function () {
//     // Skip hashing if password not modified
//     if (!this.isModified("password")) return;

//     // Generate salt & hash password
//     const salt = await bcrypt.genSalt(10); // Generate a salt for hashing
//     this.password = await bcrypt.hash(this.password, salt); // Hash the password
// });

// /////////////////////Password Comparison Method/////////////////////
// userSchema.methods.matchPassword = async function (Password) { // For login process
//     return await bcrypt.compare(Password, this.password); // Compare provided password with hashed password
// };

// module.exports = mongoose.model('User', userSchema); // Export User model for use in controllers/routes
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, minlength: 6, select: false }, // optional — Google users have no password
    phone:    { type: String, trim: true },
    avatar:   { type: String, default: "" },
    role:     { type: String, enum: ["user", "dealer"], default: "user" },

    // ── Google OAuth fields ──────────────────────────────────────────────────
    googleId:       { type: String, unique: true, sparse: true }, // sparse = allows multiple nulls
    authProvider:   { type: String, enum: ["local", "google"], default: "local" },
    isProfileComplete: { type: Boolean, default: false }, // false until role is chosen after Google login

    // ── Relations ────────────────────────────────────────────────────────────
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    likedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
  },
  { timestamps: true }
);

// Hash password before saving (only for local auth users)
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false; // Google users have no password
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);