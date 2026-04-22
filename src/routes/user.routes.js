// const express = require('express')
// const router = express.Router() //mini-router to make group of routers can connect with main server

// const {
//     registerUser,
//     loginUser,
//     getuserprofile,
//     updateuserprofile,
//     deleteuserprofile
// } = require('../controllers/user.controller')

// const { protect } = require('../middleware/authMiddleware')

// // Public Routes 

// // Register
// router.post('/signup', registerUser)

// // Login
// router.post('/login', loginUser)


// //  Protected Routes 

// // Get Profile
// router.get('/profile', protect, getuserprofile)

// // Update Profile
// router.put('/profile', protect, updateuserprofile)

// // Delete Profile
// router.delete('/profile', protect, deleteuserprofile)

// // Logout (client just removes token)
// router.post('/logout', protect, (req, res) => {
//     res.json({ message: 'User logged out successfully' })
// })

// module.exports = router
const express = require('express');
const router  = express.Router();
const {
  getProfile, updateProfile, changePassword,
  getSavedPosts, savePost, getLikedPosts,
} = require('../controllers/user.controller');
const { verifyToken }  = require('../middleware/auth.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');

router.use(verifyToken); // all user routes require login

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 */
router.get('/profile',            getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/profile',            uploadSingle, updateProfile);

/**
 * @swagger
 * /api/users/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Incorrect old password
 */
router.put('/change-password',    changePassword);

/**
 * @swagger
 * /api/users/saved-posts:
 *   get:
 *     summary: Get saved posts for the user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of saved posts
 */
router.get('/saved-posts',        getSavedPosts);

/**
 * @swagger
 * /api/users/save-post/{postId}:
 *   post:
 *     summary: Toggle save/unsave a post
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post saved/unsaved successfully
 */
router.post('/save-post/:postId', savePost);

/**
 * @swagger
 * /api/users/liked-posts:
 *   get:
 *     summary: Get liked posts for the user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of liked posts
 */
router.get('/liked-posts',        getLikedPosts);

module.exports = router;