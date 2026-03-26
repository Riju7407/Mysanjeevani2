import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with type assertion
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

if (cloudinaryConfig.cloud_name && cloudinaryConfig.api_key && cloudinaryConfig.api_secret) {
  cloudinary.config(cloudinaryConfig);
}

/**
 * Upload image to Cloudinary
 * @param base64Image - Base64 encoded image data
 * @param folder - Cloudinary folder path (optional)
 * @returns Upload response with secure_url
 */
export async function uploadImageToCloudinary(
  base64Image: string,
  folder: string = 'medicines'
) {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      throw new Error('Cloudinary credentials not configured');
    }

    const result = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${base64Image}`,
      {
        folder,
        resource_type: 'auto',
        quality: 'auto',
        format: 'webp',
      }
    );

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message || 'Image upload failed',
    };
  }
}

/**
 * Upload image from file buffer to Cloudinary
 * @param buffer - File buffer
 * @param folder - Cloudinary folder path
 * @returns Upload response with secure_url
 */
export async function uploadImageBufferToCloudinary(
  buffer: Buffer,
  folder: string = 'medicines'
): Promise<{ success: boolean; url?: string; publicId?: string; error?: string }> {
  return new Promise((resolve, reject) => {
    try {
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
        throw new Error('Cloudinary credentials not configured');
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          quality: 'auto',
          format: 'webp',
        },
        (error: any, result: any) => {
          if (error) {
            reject({
              success: false,
              error: error.message || 'Image upload failed',
            });
          } else {
            resolve({
              success: true,
              url: result?.secure_url,
              publicId: result?.public_id,
            });
          }
        }
      );

      uploadStream.end(buffer);
    } catch (error: any) {
      reject({
        success: false,
        error: error.message || 'Image upload failed',
      });
    }
  });
}

/**
 * Delete image from Cloudinary
 * @param publicId - Cloudinary public ID of the image
 */
export async function deleteImageFromCloudinary(publicId: string) {
  try {
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error: any) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message || 'Image deletion failed',
    };
  }
}
