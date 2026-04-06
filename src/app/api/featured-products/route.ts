import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FeaturedProduct } from '@/lib/models/FeaturedProduct';
import { validateAdminToken } from '@/lib/adminAuthMiddleware';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get only active featured products, ordered by newest first
    const featuredProducts = await FeaturedProduct.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      { success: true, data: featuredProducts },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const tokenValidation = await validateAdminToken(req);
    if (!tokenValidation.isValid) {
      return NextResponse.json(
        { success: false, error: tokenValidation.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await req.json();
    const {
      brandName,
      category,
      subcategory,
      imageUrl,
      cloudinaryPublicId,
      cardBgColor,
      createdBy,
    } = body;

    if (!brandName || !category || !subcategory || !imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Brand name, category, subcategory and image URL are required' },
        { status: 400 }
      );
    }

    const newProduct = new FeaturedProduct({
      brandName,
      category,
      subcategory,
      imageUrl,
      cloudinaryPublicId,
      cardBgColor: cardBgColor || '#ffffff',
      createdBy,
      isActive: true,
    });

    await newProduct.save();

    return NextResponse.json(
      { success: true, data: newProduct },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating featured product:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
