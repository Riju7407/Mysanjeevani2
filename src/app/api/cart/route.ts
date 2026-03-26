import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Cart } from '@/lib/models/Cart';

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

    // Fetch cart for user
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      return NextResponse.json(
        {
          message: 'Cart is empty',
          cart: { items: [], totalPrice: 0, totalItems: 0 },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: 'Cart fetched successfully',
        cart,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get cart error:', error);
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
    const { userId, items, totalPrice, totalItems } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Create or update cart
    let cart = await Cart.findOne({ userId });

    if (cart) {
      cart.items = items;
      cart.totalPrice = totalPrice;
      cart.totalItems = totalItems;
      await cart.save();
    } else {
      cart = await Cart.create({
        userId,
        items,
        totalPrice,
        totalItems,
      });
    }

    return NextResponse.json(
      {
        message: 'Cart updated successfully',
        cart,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update cart error:', error);
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

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Clear cart
    await Cart.deleteOne({ userId });

    return NextResponse.json(
      {
        message: 'Cart cleared successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Clear cart error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
