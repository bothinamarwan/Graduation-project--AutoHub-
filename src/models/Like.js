const mongoose = require("mongoose");

/**
 * Like — one document per user-post pair.
 * Replaces the likes[] array on Post for proper querying and uniqueness.
 * Unique index at DB level prevents double-liking even under race conditions.
 */
const likeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  },
  { timestamps: true }
);

// One like per user per post — enforced at DB level
likeSchema.index({ user: 1, post: 1 }, { unique: true });
likeSchema.index({ post: 1 });  // fast lookup: "how many likes does this post have?"
likeSchema.index({ user: 1 });  // fast lookup: "what has this user liked?"

module.exports = mongoose.model("Like", likeSchema);