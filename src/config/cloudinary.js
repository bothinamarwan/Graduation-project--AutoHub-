const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Quick connectivity test on startup (only in development)
if (process.env.NODE_ENV === 'development' && process.env.STORAGE === 'cloudinary') {
  cloudinary.api.ping()
    .then(() => console.log('☁️   Cloudinary connected'))
    .catch(() => console.warn('⚠️   Cloudinary ping failed — check your credentials'));
}

module.exports = cloudinary;