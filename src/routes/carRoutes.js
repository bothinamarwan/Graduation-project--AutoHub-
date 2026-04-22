const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const { createCarPost, getCars } = require('../controllers/carController');

// Dealer posts a car (protected + upload single image)
router.post('/', protect, upload.single('image'), createCarPost);

// Get all cars (public)
router.get('/', getCars);

module.exports = router;