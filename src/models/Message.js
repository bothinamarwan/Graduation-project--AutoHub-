const mongoose = require("mongoose");

/**
 * Message — one AI chat turn (user prompt or assistant reply).
 * Belongs to a Conversation.
 */
const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    role:    { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },

    // If the message included an image upload
    imageUrl: { type: String, default: null },

    // Token usage — useful for analytics / billing tracking
    tokensUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Fast: "load all messages in this conversation, oldest first"
messageSchema.index({ conversation: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);