const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// multer-storage-cloudinary v4 requires `params` to be an async function
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'NGO_Portal',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
      transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
    };
  }
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };
