const mongoose = require("mongoose");

/**
 * Dealer profile — extends the User account with dealership-specific info.
 * One-to-one with User (role: "dealer").
 */
const dealerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    businessName:    { type: String, required: true, trim: true },
    description:     { type: String, trim: true },
    logo:            { type: String, default: "" },
    coverImage:      { type: String, default: "" },
    location: {
      city:          { type: String, trim: true },
      address:       { type: String, trim: true },
      googleMapsUrl: { type: String },
    },
    phone:           { type: String, trim: true },
    whatsapp:        { type: String, trim: true },
    socialLinks: {
      facebook:      { type: String },
      instagram:     { type: String },
      website:       { type: String },
    },
    isVerified:      { type: Boolean, default: false },
    totalPosts:      { type: Number, default: 0 },
    totalLikes:      { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dealer", dealerSchema);