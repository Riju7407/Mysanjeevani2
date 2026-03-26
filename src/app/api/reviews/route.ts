import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Review } from '@/lib/models/Review';
import { Product } from '@/lib/models/Product';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const productIds = request.nextUrl.searchParams.get('productIds');
    const productId = request.nextUrl.searchParams.get('productId');
    const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(50, Number(request.nextUrl.searchParams.get('limit') || '5')));

    if (productIds) {
      const ids = productIds
        .split(',')
        .map((id) => id.trim())
        .filter((id) => mongoose.Types.ObjectId.isValid(id));

      if (!ids.length) {
        return NextResponse.json({ summaries: {} }, { status: 200 });
      }

      const reviews = await Review.find({ productId: { $in: ids } })
        .sort({ createdAt: -1 })
        .lean();

      const grouped: Record<
        string,
        { total: number; ratingSum: number; latestComment?: string; latestUserName?: string }
      > = {};

      for (const id of ids) {
        grouped[id] = { total: 0, ratingSum: 0 };
      }

      for (const review of reviews) {
        const key = String(review.productId);
        if (!grouped[key]) continue;

        grouped[key].total += 1;
        grouped[key].ratingSum += Number(review.rating || 0);

        if (!grouped[key].latestComment && review.comment) {
          grouped[key].latestComment = review.comment;
          grouped[key].latestUserName = review.userName || 'User';
        }
      }

      const summaries: Record<
        string,
        { averageRating: number; total: number; latestComment?: string; latestUserName?: string }
      > = {};

      Object.entries(grouped).forEach(([key, value]) => {
        summaries[key] = {
          total: value.total,
          averageRating: value.total > 0 ? Number((value.ratingSum / value.total).toFixed(1)) : 0,
          latestComment: value.latestComment,
          latestUserName: value.latestUserName,
        };
      });

      return NextResponse.json({ summaries }, { status: 200 });
    }

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const total = await Review.countDocuments({ productId });
    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const allRatings = await Review.find({ productId }).select('rating').lean();
    const averageRating =
      allRatings.length > 0
        ? Number(
            (
              allRatings.reduce((sum, current) => sum + Number(current.rating || 0), 0) /
              allRatings.length
            ).toFixed(1)
          )
        : 0;

    return NextResponse.json(
      {
        message: 'Reviews fetched successfully',
        reviews,
        total,
        averageRating,
        page,
        limit,
        hasMore: page * limit < total,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { userId, productId, rating, title, comment, userName } = body;

    if (!userId || !productId || !rating || !comment) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const parsedRating = Number(rating);
    if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const token = request.headers.get('authorization')?.split(' ')[1]?.trim();
    if (!token || token === 'undefined' || token === 'null') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await Review.findOne({ userId, productId });

    let review;
    if (existing) {
      existing.rating = parsedRating;
      existing.title = title;
      existing.comment = comment;
      existing.userName = userName;
      review = await existing.save();
    } else {
      review = await Review.create({
        userId,
        productId,
        rating: parsedRating,
        title,
        comment,
        userName,
      });
    }

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

    return NextResponse.json(
      {
        message: 'Review posted successfully',
        review,
        productStats: {
          averageRating,
          total,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Post review error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
