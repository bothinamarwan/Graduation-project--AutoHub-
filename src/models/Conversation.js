const mongoose = require("mongoose");

/**
 * Conversation — one chat session between a user and the AI.
 * A user can have many conversations (chat history tabs).
 */
const conversationSchema = new mongoose.Schema(
  {
    user:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "New conversation" }, // auto-set from first message
    // Last message preview for the sidebar list
    lastMessage:  { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now },
    messageCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

conversationSchema.index({ user: 1, lastMessageAt: -1 }); // fast: user's conversations newest first

module.exports = mongoose.model("Conversation", conversationSchema);