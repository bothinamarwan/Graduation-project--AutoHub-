const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

// ── File filter — images only ──────────────────────────────────────────────────
const imageFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const valid   = allowed.test(path.extname(file.originalname).toLowerCase())
               && allowed.test(file.mimetype);
  valid ? cb(null, true) : cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed.'));
};

// ── Storage engine ─────────────────────────────────────────────────────────────
const cloudinary              = require('../config/cloudinary');
const { CloudinaryStorage }   = require('multer-storage-cloudinary');

// Enforce Cloudinary as requested: "saved in cloudenary direct not local"
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'automotive-app',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ width: 1200, height: 900, crop: 'limit', quality: 'auto' }],
  },
});

const limits = { fileSize: 5 * 1024 * 1024 }; // 5 MB

// ── Export upload instances ───────────────────────────────────────────────────
const uploadSingle   = multer({ storage, fileFilter: imageFilter, limits }).single('image');
const uploadMultiple = multer({ storage, fileFilter: imageFilter, limits }).array('images', 8);
const uploadFields   = multer({ storage, fileFilter: imageFilter, limits }).fields([
  { name: 'logo',       maxCount: 1 },
  { name: 'coverImage', maxCount: 1 },
]);

module.exports = { uploadSingle, uploadMultiple, uploadFields };