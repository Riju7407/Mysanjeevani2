import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FeaturedProduct } from '@/lib/models/FeaturedProduct';
import { validateAdminToken } from '@/lib/adminAuthMiddleware';
import { v2 as cloudinary } from 'cloudinary';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    await connectDB();
    const product = await FeaturedProduct.findById(params.id).lean();
    if (!product) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: product }, { status: 200 });
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const tokenValidation = await validateAdminToken(req);
    if (!tokenValidation.isValid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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
    } = body;

    if (!brandName || !category || !subcategory || !imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Brand name, category, subcategory and image URL are required' },
        { status: 400 }
      );
    }

    const product = await FeaturedProduct.findById(params.id);
    if (!product) {
      console.error('Product not found:', params.id);
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    product.brandName = brandName;
    product.category = category;
    product.subcategory = subcategory;
    product.imageUrl = imageUrl;
    if (cloudinaryPublicId) product.cloudinaryPublicId = cloudinaryPublicId;
    if (cardBgColor) product.cardBgColor = cardBgColor;
    await product.save();
    return NextResponse.json({ success: true, data: product }, { status: 200 });
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const tokenValidation = await validateAdminToken(req);
    if (!tokenValidation.isValid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const product = await FeaturedProduct.findById(params.id);
    if (!product) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    if (product.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(product.cloudinaryPublicId);
      } catch (err) {
        console.warn('Image deletion warning:', err);
      }
    }
    await FeaturedProduct.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true, message: 'Deleted' }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
