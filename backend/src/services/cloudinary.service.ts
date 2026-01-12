import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';

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
 * @param resourceType The resource type ('auto', 'image', 'raw', etc.)
 * @returns The secure URL of the uploaded file
 */
export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string = 'carousels',
  resourceType: 'auto' | 'image' | 'video' | 'raw' = 'auto'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: resourceType,
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

/**
 * Downloads a file from a URL and uploads it to Cloudinary
 * @param url The URL of the file to download
 * @param folder The folder in Cloudinary
 * @returns The secure URL of the uploaded file
 */
export const uploadFromUrl = async (url: string, folder: string = 'social-saver'): Promise<string | null> => {
  try {
    if (!url) return null;

    // Download file with browser-like headers to avoid 403s
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.tiktok.com/', // Generic referer helps with some CDNs
        'Accept': 'image/webp,image/apng,image/*,video/*,*/*;q=0.8'
      }
    });

    const buffer = Buffer.from(response.data);
    return await uploadToCloudinary(buffer, folder);
  } catch (error) {
    console.error(`[Cloudinary] Failed to upload from URL: ${url}`, error instanceof Error ? error.message : error);
    // Return original URL if upload fails, so we don't break the flow completely
    // (Though links will eventually expire, it's better than nothing immediately)
    return url;
  }
};

/**
 * Gets account usage information from Cloudinary
 */
export const getCloudinaryUsage = async (): Promise<any> => {
  return new Promise((resolve, reject) => {
    cloudinary.api.usage((error: any, result: any) => {
      if (error) {
        console.error('Cloudinary Usage Error:', error);
        return reject(error);
      }
      resolve(result);
    });
  });
};
