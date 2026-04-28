/**
 * imageHelper
 * Centralizes all image URL logic.
 * Previously split between upload.middleware.js and controllers.
 *
 * Usage:
 *   const url  = getFileUrl(req, file)           // single file
 *   const urls = getFileUrls(req, files)          // array of files
 *   const b64  = await fileToBase64(filePath)     // for AI vision
 */
const fs   = require('fs');
const path = require('path');

/**
 * Returns the public URL for an uploaded file.
 * We strictly use Cloudinary as requested.
 */
const getFileUrl = (req, file) => {
  if (!file) return null;
  // Cloudinary storage via multer-storage-cloudinary sets path to the absolute URL
  return file.path;
};

/**
 * Maps an array of multer files to an array of public URLs.
 */
const getFileUrls = (req, files = []) =>
  files.map((file) => getFileUrl(req, file)).filter(Boolean);

/**
 * Reads a local file and returns its base64 string.
 * Used to send images to the AI Vision API.
 */
const fileToBase64 = (filePath) => {
  if (!filePath) throw new Error('No file path provided.');
  
  // If it's a URL (Cloudinary storage), we can't use readFileSync
  if (filePath.startsWith('http')) {
     throw new Error('Use multerFileToBase64 for remote URLs.');
  }

  const buffer = fs.readFileSync(filePath);
  return buffer.toString('base64');
};

/**
 * Extracts base64 from either a disk-saved file, memory buffer, or remote URL.
 * Handles multer diskStorage, memoryStorage, and CloudinaryStorage.
 */
const multerFileToBase64 = async (file) => {
  if (!file) throw new Error('No file provided.');
  
  // 1. From memory buffer
  if (file.buffer) return file.buffer.toString('base64');
  
  // 2. From path (local or remote)
  if (file.path) {
    if (file.path.startsWith('http')) {
      const response = await fetch(file.path);
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer).toString('base64');
    }
    return fileToBase64(file.path);
  }
  
  throw new Error('Cannot read file — no path or buffer available.');
};


module.exports = { getFileUrl, getFileUrls, fileToBase64, multerFileToBase64 };