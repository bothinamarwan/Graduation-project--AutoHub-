const express  = require('express');
const router   = express.Router();
const passport = require('../config/passport');
const {
  registerUser, registerDealer, login, logout, getMe,
  googleCallback,
} = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const authValidation = require('../validations/auth.validation');

// ── Local auth ────────────────────────────────────────────────────────────────



/**
 * @swagger
 * /api/auth/register/user:
 *   post:
 *     summary: Register a new regular user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or User already exists
 */
router.post('/register/user',   validate(authValidation.registerUser), registerUser);

/**
 * @swagger
 * /api/auth/register/dealer:
 *   post:
 *     summary: Register a new dealer
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - confirmPassword
 *               - location
 *               - phone
 *               - whatsapp
 *               - taxNumber
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *               location:
 *                 type: string
 *               phone:
 *                 type: string
 *               whatsapp:
 *                 type: string
 *               taxNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Dealer registered successfully
 *       400:
 *         description: Validation error or Dealer already exists
 */
router.post('/register/dealer', validate(authValidation.registerDealer), registerDealer);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       400:
 *         description: Invalid credentials
 */
router.post('/login',           validate(authValidation.login), login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout a user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User logged out successfully
 */
router.post('/logout',          logout);
/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         description: Unauthorized
 */
router.get('/me',               verifyToken, getMe);



// ── Google OAuth ──────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Auth]
 *     description: >
 *       Redirects to Google consent screen. <br><br>
 *       **⚠️ NOTE:** You cannot test this endpoint using the "Try it out" button because OAuth requires a full-page redirect, which gets blocked by CORS during an AJAX request. <br><br>
 *       **To test it:** <a href="/api/auth/google" target="_blank">Click here to Login with Google</a>
 *     responses:
 *       302:
 *         description: Redirects to Google
 */
// Step 1 — redirect to Google consent screen
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Auth]
 *     description: Called by Google after successful authentication
 *     responses:
 *       302:
 *         description: Redirects to frontend with tokens
 */
// Step 2 — Google redirects back here
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/login?error=google_failed`,
    session: false,
  }),
  googleCallback
);



module.exports = router;