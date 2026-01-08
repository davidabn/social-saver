import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file buffer to Cloudinary
 * @param fileBuffer The file buffer
 * @param folder The folder in Cloudinary (default: 'carousels')
 * @returns The secure URL of the uploaded image
 */
export const uploadToCloudinary = async (fileBuffer: Buffer, folder: string = 'carousels'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto', // Detects if it's image, video, etc.
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary Upload Error:', error);
          return reject(error);
        }
        if (result) {
          return resolve(result.secure_url);
        }
        return reject(new Error('Unknown error in Cloudinary upload'));
      }
    );
    uploadStream.end(fileBuffer);
  });
};
