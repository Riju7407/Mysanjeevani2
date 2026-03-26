import { NextRequest, NextResponse } from 'next/server';
import { deleteImageFromCloudinary } from '@/lib/cloudinaryUtils';

/**
 * Delete Medicine Image from Cloudinary
 * DELETE /api/medicines/delete-image
 * 
 * Accepts publicId from Cloudinary
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { publicId } = body;

    if (!publicId) {
      return NextResponse.json(
        { error: 'Public ID is required' },
        { status: 400 }
      );
    }

    const result = await deleteImageFromCloudinary(publicId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete image' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Image deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Image deletion error:', error);
    return NextResponse.json(
      { error: error.message || 'Image deletion failed' },
      { status: 500 }
    );
  }
}
