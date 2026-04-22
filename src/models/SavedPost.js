const mongoose = require("mongoose");

/**
 * SavedPost — one document per user-post pair.
 * Replaces savedPosts[] array on User for proper querying.
 */
const savedPostSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  },
  { timestamps: true }
);

// One save per user per post
savedPostSchema.index({ user: 1, post: 1 }, { unique: true });
savedPostSchema.index({ user: 1, createdAt: -1 }); // fast: "show my saved posts, newest first"
savedPostSchema.index({ post: 1 });                 // fast: "how many saves does this post have?"

module.exports = mongoose.model("SavedPost", savedPostSchema);