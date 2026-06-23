const cloudinary = require('../config/cloudinary');

/**
 * Upload buffer to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {String} folder - Folder name in Cloudinary
 * @returns {Object} { url, public_id }
 */
const uploadToCloudinary = (fileBuffer, folder = 'cadet-portal') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );
    stream.end(fileBuffer);
  });
};

/**
 * Delete image from Cloudinary
 * @param {String} publicId - Cloudinary public_id
 */
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error.message);
  }
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };
