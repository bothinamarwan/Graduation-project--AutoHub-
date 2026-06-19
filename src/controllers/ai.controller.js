const { chat, analyzeCarImage, checkCustomAIHealth, buildCustomAIIndex, compareWithCustomAI, analyzeDamage: analyzeDamageService } = require('../services/ai.service');
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
  const { message, conversationId, buyer_mode, buyer_profile, car_context } = req.body;
  if (!message?.trim()) return res.fail('Message is required.');

  const convo = await findOrCreateConversation(req.user._id, conversationId, message);
  const history = await loadHistory(convo._id);
  await saveUserMessage(convo._id, message.trim());

  let replyData = null;
  try {
    replyData = await chat([...history, { role: 'user', content: message.trim() }], {
      conversationId: convo._id.toString(),
      buyer_mode,
      buyer_profile,
      car_context
    });
    
    if (replyData && replyData.answer) {
      await saveAIMessage(convo._id, replyData.answer);
    }
  } catch (error) {
    console.error('AI chat error:', error);
  }

  res.success({ 
    conversationId: convo._id, 
    reply: replyData?.answer, 
    ...replyData 
  });
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

  const { message, conversationId, buyer_mode, buyer_profile, car_context } = req.body;
  const userMessage  = message?.trim() || 'What car is this? Give me detailed information.';
  const imageBase64  = await multerFileToBase64(req.file);
  const imageUrl     = getFileUrl(req, req.file);

  const convo = await findOrCreateConversation(req.user._id, conversationId, userMessage);
  const history = await loadHistory(convo._id, 10);
  await saveUserMessage(convo._id, userMessage, imageUrl);

  let replyData = null;
  try {
    replyData = await chat(
      [...history, { role: 'user', content: userMessage }], 
      { 
        imageBase64, 
        mimetype: req.file.mimetype, 
        filename: req.file.originalname,
        conversationId: convo._id.toString(),
        buyer_mode,
        buyer_profile,
        car_context
      }
    );
    if (replyData && replyData.answer) {
      await saveAIMessage(convo._id, replyData.answer);
    }
  } catch (error) {
    console.error('AI chatWithImage error:', error);
  }

  res.success({ 
    conversationId: convo._id, 
    reply: replyData?.answer, 
    imageUrl, 
    ...replyData 
  });
});

// POST /api/ai/compare
const compareCars = asyncHandler(async (req, res) => {
  const { cars, history, aspect } = req.body;
  if (!cars || !Array.isArray(cars) || cars.length < 2) {
    return res.fail('At least two cars are required for comparison.');
  }

  const result = await compareWithCustomAI(cars, history || [], aspect || "");
  res.success(result);
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

// POST /api/ai/conversations
const createConversation = asyncHandler(async (req, res) => {
  const { title } = req.body;
  const convo = await Conversation.create({
    user: req.user._id,
    title: (title || 'New conversation').slice(0, 60),
    isActive: true
  });
  res.success({ conversation: convo }, 'Conversation created.');
});

// POST /api/ai/damage
const analyzeDamage = asyncHandler(async (req, res) => {
  const { description, conversationId } = req.body;
  
  let imageBase64 = null;
  let mimetype = null;
  let filename = null;
  let imageUrl = null;

  if (req.file) {
    imageBase64 = await multerFileToBase64(req.file);
    mimetype = req.file.mimetype;
    filename = req.file.originalname;
    imageUrl = getFileUrl(req, req.file);
  }

  if (!imageBase64 && !description?.trim()) {
    return res.fail('Either an image file or a description is required.');
  }

  const result = await analyzeDamageService(imageBase64, description, mimetype, filename);
  
  // Save to database
  const title = (description || 'Damage Analysis').slice(0, 60);
  const convo = await findOrCreateConversation(req.user._id, conversationId, title);

  const userContent = description ? `Analyzed damage: ${description}` : 'Analyzed damage image';
  await saveUserMessage(convo._id, userContent, imageUrl);
  await saveAIMessage(convo._id, result.message || 'Damage assessment complete');

  res.success({ report: result, imageUrl, conversationId: convo._id });
});

module.exports = { 
  getConversations, 
  deleteConversation, 
  getMessages, 
  chatWithBot, 
  analyzeImage, 
  chatWithImage, 
  compareCars, 
  getHealth, 
  triggerBuildIndex,
  createConversation,
  analyzeDamage
};