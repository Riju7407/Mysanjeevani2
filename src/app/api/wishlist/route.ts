import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Wishlist } from '@/lib/models/Wishlist';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const wishlistItems = await Wishlist.find({ userId }).sort({
      createdAt: -1,
    });

    return NextResponse.json(
      {
        message: 'Wishlist fetched successfully',
        items: wishlistItems,
        total: wishlistItems.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get wishlist error:', error);
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
    const { userId, productId, productName, price, image } = body;

    if (!userId || !productId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if already in wishlist
    const existing = await Wishlist.findOne({ userId, productId });
    if (existing) {
      return NextResponse.json(
        { error: 'Product already in wishlist' },
        { status: 400 }
      );
    }

    const wishlistItem = await Wishlist.create({
      userId,
      productId,
      productName,
      price,
      image,
    });

    return NextResponse.json(
      {
        message: 'Added to wishlist',
        item: wishlistItem,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add to wishlist error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.nextUrl.searchParams.get('userId');
    const productId = request.nextUrl.searchParams.get('productId');

    if (!userId || !productId) {
      return NextResponse.json(
        { error: 'User ID and Product ID are required' },
        { status: 400 }
      );
    }

    await Wishlist.deleteOne({ userId, productId });

    return NextResponse.json(
      {
        message: 'Removed from wishlist',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
