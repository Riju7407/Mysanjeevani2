import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToCloudinary } from '@/lib/cloudinaryUtils';

/**
 * Generic Upload Image to Cloudinary
 * POST /api/upload
 * 
 * Accepts JSON with base64 image data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, folder = 'uploads' } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'No image data provided' },
        { status: 400 }
      );
    }

    // Remove data URL prefix if present
    const base64Data = image.startsWith('data:') 
      ? image.split(',')[1] 
      : image;

    const result = await uploadImageToCloudinary(base64Data, folder);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        url: result.url,
        publicId: result.publicId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
