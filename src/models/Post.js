const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    bodyType: { type: String },
    year: { type: Number },
    mileage: { type: Number },         // in km
    price: { type: Number, required: true },
    currency: { type: String, default: "EGP" },
    condition: { type: String, enum: ["New", "Used", "Certified Pre-Owned"], default: "Used" },
    color: { type: String },
    transmission: { type: String },
    fuelType: { type: String },
    contactPhone: { type: String, required: true },
    paymentOptions: [{ type: String }],
    images: [{ type: String }],        // array of image URLs
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likesCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    // Link to the Vehicle knowledge base (optional but useful)
    vehicleRef: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
  },
  { timestamps: true }
);

postSchema.index({ brand: "text", model: "text", title: "text" });
postSchema.index({ dealer: 1, isActive: 1 });

module.exports = mongoose.model("Post", postSchema);