const { chat, analyzeCarImage, checkCustomAIHealth, buildCustomAIIndex } = require('../services/ai.service');
const Conversation               = require('../models/Conversation');
const Message                    = require('../models/Message');
const asyncHandler               = require('../utils/asyncHandler');
const { multerFileToBase64, getFileUrl } = require('../utils/Imagehelper');
const mongoose = require('mongoose');


// GET /api/ai/conversations
const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ user: req.user._id, isActive: true })
    .sort({ lastMessageAt: -1 })
    .limit(50)
    .lean();
  res.success({ conversations });
});

// DELETE /api/ai/conversations/:id
const deleteConversation = asyncHandler(async (req, res) => {
  await Conversation.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isActive: false }
  );
  res.success({}, 'Conversation deleted.');
});

// GET /api/ai/conversations/:id/messages
const getMessages = asyncHandler(async (req, res) => {
  const convo = await Conversation.findOne({ _id: req.params.id, user: req.user._id });
  if (!convo) return res.fail('Conversation not found.', 404);

  const messages = await Message.find({ conversation: convo._id })
    .sort({ createdAt: 1 })
    .lean();

  res.success({ conversation: convo, messages });
});

// ── shared helper: find or create a conversation ──────────────────────────────
const findOrCreateConversation = async (userId, conversationId, title) => {
  if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
    const convo = await Conversation.findOne({ _id: conversationId, user: userId });
    if (convo) return convo;
  }
  return Conversation.create({ user: userId, title: title.slice(0, 60) });
};


// ── shared helper: load last N messages as AI history ─────────────────────────
const loadHistory = async (convoId, limit = 20) => {
  const msgs = await Message.find({ conversation: convoId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return msgs.reverse().map((m) => ({ role: m.role, content: m.content }));
};

// ── shared helper: save user message ──────────────────────────────────────────
const saveUserMessage = async (convoId, content, imageUrl = null) => {
  const msg = await Message.create({ conversation: convoId, role: 'user', content, imageUrl });
  await Conversation.findByIdAndUpdate(convoId, {
    lastMessage: content.slice(0, 120),
    lastMessageAt: new Date(),
    $inc: { messageCount: 1 },
  });
  return msg;
};

// ── shared helper: save AI message ────────────────────────────────────────────
const saveAIMessage = async (convoId, content) => {
  const msg = await Message.create({ conversation: convoId, role: 'assistant', content });
  await Conversation.findByIdAndUpdate(convoId, {
    lastMessage: content.slice(0, 120),
    lastMessageAt: new Date(),
    $inc: { messageCount: 1 },
  });
  return msg;
};

// POST /api/ai/chat
const chatWithBot = asyncHandler(async (req, res) => {
  const { message, conversationId } = req.body;
  if (!message?.trim()) return res.fail('Message is required.');

  const convo = await findOrCreateConversation(req.user._id, conversationId, message);
  await saveUserMessage(convo._id, message.trim());
  const history = await loadHistory(convo._id);

  let reply = null;
  try {
    reply = await chat([...history, { role: 'user', content: message.trim() }]);
    if (reply) {
      await saveAIMessage(convo._id, reply);
    }
  } catch (error) {
    console.error('AI chat error:', error);
  }

  res.success({ conversationId: convo._id, reply });
});

// POST /api/ai/analyze-image
const analyzeImage = asyncHandler(async (req, res) => {
  if (!req.file) return res.fail('An image file is required.');

  const { conversationId } = req.body;
  const imageBase64 = await multerFileToBase64(req.file);
  const result      = await analyzeCarImage(imageBase64, req.file.mimetype, req.file.originalname);
  const imageUrl    = getFileUrl(req, req.file);

  // Save to database
  const title = result.prediction || 'Car Analysis';
  const convo = await findOrCreateConversation(req.user._id, conversationId, title);
  
  await saveUserMessage(convo._id, 'Analyzed an image', imageUrl);
  await saveAIMessage(convo._id, result.description || `Identified as ${result.prediction}`);

  res.success({ analysis: result, imageUrl, conversationId: convo._id });
});


// POST /api/ai/chat-with-image
const chatWithImage = asyncHandler(async (req, res) => {
  if (!req.file) return res.fail('An image file is required.');

  const { message, conversationId } = req.body;
  const userMessage  = message?.trim() || 'What car is this? Give me detailed information.';
  const imageBase64  = await multerFileToBase64(req.file);
  const imageUrl     = getFileUrl(req, req.file);

  const convo = await findOrCreateConversation(req.user._id, conversationId, userMessage);
  await saveUserMessage(convo._id, userMessage, imageUrl);
  const history = await loadHistory(convo._id, 10);

  let reply = null;
  try {
    reply = await chat(
      [...history, { role: 'user', content: userMessage }], 
      imageBase64, 
      req.file.mimetype, 
      req.file.originalname
    );
    if (reply) {
      await saveAIMessage(convo._id, reply);
    }
  } catch (error) {
    console.error('AI chatWithImage error:', error);
  }

  res.success({ conversationId: convo._id, reply, imageUrl });
});

// GET /api/ai/health
const getHealth = asyncHandler(async (req, res) => {
  const result = await checkCustomAIHealth();
  res.success({ health: result });
});

// POST /api/ai/build-index
const triggerBuildIndex = asyncHandler(async (req, res) => {
  const result = await buildCustomAIIndex();
  res.success({ indexStatus: result });
});

module.exports = { getConversations, deleteConversation, getMessages, chatWithBot, analyzeImage, chatWithImage, getHealth, triggerBuildIndex };