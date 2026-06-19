const express = require('express');
const router  = express.Router();
const { getStats, getModerationPosts, updatePostStatus, updateUserRole } = require('../controllers/admin.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const adminValidation = require('../validations/admin.validation');

// Protect all admin routes with authentication and Admin role check
router.use(verifyToken, isAdmin);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get dashboard statistics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not an admin)
 */
router.get('/stats', getStats);

/**
 * @swagger
 * /api/admin/posts:
 *   get:
 *     summary: Retrieve posts for moderation (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter posts by moderation status
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Moderation posts retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/posts', getModerationPosts);

/**
 * @swagger
 * /api/admin/posts/{id}/status:
 *   patch:
 *     summary: Update post moderation status (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *     responses:
 *       200:
 *         description: Post status updated successfully
 *       400:
 *         description: Invalid input status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Post not found
 */
router.patch('/posts/:id/status', updatePostStatus);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   patch:
 *     summary: Update any user's role (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, dealer, admin]
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       400:
 *         description: Invalid input or self-demotion attempt
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.patch('/users/:id/role', validate(adminValidation.updateUserRole), updateUserRole);

module.exports = router;
