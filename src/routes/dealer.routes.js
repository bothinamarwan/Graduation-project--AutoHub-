const express = require('express');
const router  = express.Router();
const {
  getProfile, getPublicProfile,
  updateProfile, getMyPosts, getStats,
} = require('../controllers/dealer.controller');
const { verifyToken, isDealer } = require('../middleware/auth.middleware');
const { uploadFields }          = require('../middleware/upload.middleware');

// ⚠️  IMPORTANT: /me/* routes must come BEFORE /:dealerId
// otherwise Express matches "me" as a dealerId param

// Protected — dealer only (me/*)
/**
 * @swagger
 * /api/dealers/me/profile:
 *   get:
 *     summary: Get current dealer profile
 *     tags: [Dealers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dealer profile
 */
router.get('/me/profile', verifyToken, isDealer, getProfile);

/**
 * @swagger
 * /api/dealers/me/profile:
 *   put:
 *     summary: Update dealer profile
 *     tags: [Dealers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               dealershipName:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *               bio:
 *                 type: string
 *               website:
 *                 type: string
 *               location:
 *                 type: string
 *               logo:
 *                 type: string
 *                 format: binary
 *               coverImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/me/profile', verifyToken, isDealer, uploadFields, updateProfile);

/**
 * @swagger
 * /api/dealers/me/posts:
 *   get:
 *     summary: Get all posts for the current dealer
 *     tags: [Dealers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dealer posts
 */
router.get('/me/posts',   verifyToken, isDealer, getMyPosts);

/**
 * @swagger
 * /api/dealers/me/stats:
 *   get:
 *     summary: Get dealer statistics
 *     tags: [Dealers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dealer statistics
 */
router.get('/me/stats',   verifyToken, isDealer, getStats);

// Public — must be last so it doesn't swallow /me/*
/**
 * @swagger
 * /api/dealers/{dealerId}:
 *   get:
 *     summary: Get public dealer profile by ID
 *     tags: [Dealers]
 *     parameters:
 *       - in: path
 *         name: dealerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Public dealer profile
 */
router.get('/:dealerId', getPublicProfile);

module.exports = router;