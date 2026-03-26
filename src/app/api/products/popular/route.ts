import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/lib/models/Product';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();

    // Fetch products marked popular by admin first.
    let popularProducts = await Product.find({
      isPopular: true,
      isActive: true,
      $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }],
    })
      .limit(8)
      .sort({ updatedAt: -1 });

    // Fallback: if none marked as popular, return latest active products.
    if (popularProducts.length === 0) {
      popularProducts = await Product.find({
        isActive: true,
        $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }],
      })
        .limit(8)
        .sort({ createdAt: -1 });
    }

    return NextResponse.json(
      {
        message: 'Popular products fetched successfully',
        products: popularProducts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get popular products error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
