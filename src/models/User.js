
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
    
    // ── Email Confirmation (Defaults to true, flow removed) ───────────────────
    isEmailConfirmed: { type: Boolean, default: true },

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