import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Review } from '@/lib/models/Review';
import { Product } from '@/lib/models/Product';

async function recalculateProductRating(productId: string) {
  const productReviews = await Review.find({ productId }).select('rating').lean();
  const total = productReviews.length;
  const averageRating =
    total > 0
      ? Number(
          (
            productReviews.reduce((sum, current) => sum + Number(current.rating || 0), 0) / total
          ).toFixed(1)
        )
      : 0;

  await Product.findByIdAndUpdate(productId, {
    rating: averageRating,
    reviews: total,
  });

  return { averageRating, total };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid review id' }, { status: 400 });
    }

    const token = request.headers.get('authorization')?.split(' ')[1]?.trim();
    if (!token || token === 'undefined' || token === 'null') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, rating, title, comment } = body;

    if (!userId || !rating || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const parsedRating = Number(rating);
    if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (String(review.userId) !== String(userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    review.rating = parsedRating;
    review.title = title;
    review.comment = comment;
    await review.save();

    const productStats = await recalculateProductRating(String(review.productId));

    return NextResponse.json(
      {
        message: 'Review updated successfully',
        review,
        productStats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Patch review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid review id' }, { status: 400 });
    }

    const token = request.headers.get('authorization')?.split(' ')[1]?.trim();
    if (!token || token === 'undefined' || token === 'null') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'User id is required' }, { status: 400 });
    }

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (String(review.userId) !== String(userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const productId = String(review.productId);
    await Review.findByIdAndDelete(id);
    const productStats = await recalculateProductRating(productId);

    return NextResponse.json(
      {
        message: 'Review deleted successfully',
        productStats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
