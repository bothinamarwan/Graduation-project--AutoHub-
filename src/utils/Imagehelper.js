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
  const buffer = fs.readFileSync(filePath);
  return buffer.toString('base64');
};

/**
 * Extracts base64 from either a disk-saved file or memory buffer.
 * Handles both multer diskStorage and memoryStorage.
 */
const multerFileToBase64 = (file) => {
  if (!file) throw new Error('No file provided.');
  if (file.buffer) return file.buffer.toString('base64');
  if (file.path)   return fileToBase64(file.path);
  throw new Error('Cannot read file — no path or buffer available.');
};

module.exports = { getFileUrl, getFileUrls, fileToBase64, multerFileToBase64 };