// Placeholder upload service - extend with actual cloud storage (AWS S3, Cloudinary) as needed
const uploadImage = async (file) => {
  // In production, upload to Cloudinary or S3
  // Return the public URL
  return `https://placeholder.eventsphere.ai/uploads/${Date.now()}_${file.originalname}`;
};

module.exports = { uploadImage };
