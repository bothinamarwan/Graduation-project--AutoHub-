const express = require('express');
const router  = express.Router();
const {
  getConversations, deleteConversation, getMessages,
  chatWithBot, analyzeImage, chatWithImage, getHealth, triggerBuildIndex
} = require('../controllers/ai.controller');
const { verifyToken }  = require('../middleware/auth.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');

router.use(verifyToken); // all AI routes require login

// Conversation management
/**
 * @swagger
 * /api/ai/conversations:
 *   get:
 *     summary: Get all AI conversations for the current user
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 */
router.get('/conversations',              getConversations);

/**
 * @swagger
 * /api/ai/conversations/{id}:
 *   delete:
 *     summary: Delete a specific AI conversation
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation deleted
 */
router.delete('/conversations/:id',       deleteConversation);

/**
 * @swagger
 * /api/ai/conversations/{id}/messages:
 *   get:
 *     summary: Get messages for a specific AI conversation
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of messages
 */
router.get('/conversations/:id/messages', getMessages);

// AI features
/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Send a text message to the AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *               conversationId:
 *                 type: string
 *                 description: Optional ID to continue a conversation
 *     responses:
 *       200:
 *         description: AI response
 */
router.post('/chat',            chatWithBot);

/**
 * @swagger
 * /api/ai/analyze-image:
 *   post:
 *     summary: Analyze an uploaded image using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: AI image analysis
 */
router.post('/analyze-image',   uploadSingle, analyzeImage);

/**
 * @swagger
 * /api/ai/chat-with-image:
 *   post:
 *     summary: Chat with AI while providing an image
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               conversationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI response
 */
router.post('/chat-with-image', uploadSingle, chatWithImage);

/**
 * @swagger
 * /api/ai/health:
 *   get:
 *     summary: Get AI model health status
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI health status
 */
router.get('/health', getHealth);

/**
 * @swagger
 * /api/ai/build-index:
 *   post:
 *     summary: Trigger building the index for the AI model
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Index build status
 */
router.post('/build-index', triggerBuildIndex);

module.exports = router;