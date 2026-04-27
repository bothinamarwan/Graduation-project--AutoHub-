const express = require('express');
const router  = express.Router();
const {
  getAllPosts, getPostById, createPost,
  updatePost, deletePost, likePost, getMyPosts,
} = require('../controllers/post.controller');
const { verifyToken, isDealer } = require('../middleware/auth.middleware');
const { uploadMultiple }        = require('../middleware/upload.middleware');
const validate = require('../middleware/validate.middleware');
const postValidation = require('../validations/post.validation');

// ⚠️  IMPORTANT: specific routes must come BEFORE /:id
// otherwise Express matches "dealer" as an :id param

// Dealer — my posts (must be before /:id)
/**
 * @swagger
 * /api/posts/dealer/my-posts:
 *   get:
 *     summary: Get all posts created by the logged-in dealer
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of dealer's posts
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/dealer/my-posts', verifyToken, isDealer, getMyPosts);

// Public
/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: List of all posts
 */
router.get('/',    getAllPosts);

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Get a specific post by ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post details
 *       404:
 *         description: Post not found
 */
router.get('/:id', validate(postValidation.getPost), getPostById);

// Dealer — CRUD
/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post (Dealer only)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - brand
 *               - model
 *               - bodyType
 *               - year
 *               - mileage
 *               - price
 *               - condition
 *               - color
 *               - fuelType
 *               - contactPhone
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               bodyType:
 *                 type: string
 *               year:
 *                 type: integer
 *               mileage:
 *                 type: number
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *               condition:
 *                 type: string
 *                 enum: [New, Used, Certified Pre-Owned]
 *               color:
 *                 type: string
 *               transmission:
 *                 type: string
 *               fuelType:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *               paymentOptions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of payment options, e.g. Cash, Installments
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Upload multiple images for the post
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not a dealer)
 */
router.post('/',    verifyToken, isDealer, uploadMultiple, validate(postValidation.createPost), createPost);
/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Update a post (Dealer only)
 *     tags: [Posts]
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
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               price:
 *                 type: number
 *               contactPhone:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       404:
 *         description: Post not found
 */
router.put('/:id',  verifyToken, isDealer, uploadMultiple, validate(postValidation.updatePost), updatePost);

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Delete a post (Dealer only)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       404:
 *         description: Post not found
 */
router.delete('/:id', verifyToken, isDealer, validate(postValidation.getPost), deletePost);

// Any logged-in user — like toggle
/**
 * @swagger
 * /api/posts/{id}/like:
 *   post:
 *     summary: Toggle like on a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post liked/unliked successfully
 *       404:
 *         description: Post not found
 */
router.post('/:id/like', verifyToken, validate(postValidation.getPost), likePost);

module.exports = router;