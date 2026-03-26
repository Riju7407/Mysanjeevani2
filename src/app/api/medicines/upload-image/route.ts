import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToCloudinary, uploadImageBufferToCloudinary } from '@/lib/cloudinaryUtils';

/**
 * Upload Medicine Image to Cloudinary
 * POST /api/medicines/upload-image
 * 
 * Accepts either:
 * 1. JSON with base64 image data
 * 2. FormData with image file
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');

    // Handle FormData/multipart upload
    if (contentType && contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('image') as File;

      if (!file) {
        return NextResponse.json(
          { error: 'No image file provided' },
          { status: 400 }
        );
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'File must be an image' },
          { status: 400 }
        );
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Image size must be less than 5MB' },
          { status: 400 }
        );
      }

      const buffer = await file.arrayBuffer();
      const result: any = await uploadImageBufferToCloudinary(
        Buffer.from(buffer),
        'medicines'
      );

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Upload failed' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Image uploaded successfully',
          imageUrl: result.url,
          publicId: result.publicId,
        },
        { status: 200 }
      );
    }

    // Handle JSON with base64 image
    const body = await request.json();
    const { imageBase64 } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400 }
      );
    }

    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const result = await uploadImageToCloudinary(base64Data, 'medicines');

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Image uploaded successfully',
        imageUrl: result.url,
        publicId: result.publicId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Image upload failed' },
      { status: 500 }
    );
  }
}
