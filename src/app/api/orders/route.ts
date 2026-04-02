import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { connectDB } from '@/lib/db';
import { Order } from '@/lib/models/Order';

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

function getClient() {
  if (!keyId || !keySecret) {
    throw new Error('Razorpay keys are not configured on server');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

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

    // Fetch all orders for user
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    return NextResponse.json(
      {
        message: 'Orders fetched successfully',
        orders,
        total: orders.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 * Creates a new order with Razorpay payment integration
 * Request body: {
 *   userId: string,
 *   items: Array<{productId, productName, quantity, price, total}>,
 *   totalPrice: number,
 *   deliveryAddress: string,
 *   currency: string (optional, default: 'INR'),
 *   notes: object (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      userId,
      items,
      totalPrice,
      deliveryAddress,
      currency = 'INR',
      notes = {},
    } = body;

    if (!userId || !items || !totalPrice) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, items, totalPrice' },
        { status: 400 }
      );
    }

    // Create new order in database
    const order = await Order.create({
      userId,
      items,
      totalPrice,
      deliveryAddress,
      status: 'pending',
      paymentStatus: 'pending',
    });

    // Create Razorpay order if keys are configured
    let razorpayOrder = null;
    if (keyId && keySecret) {
      try {
        const razorpay = getClient();
        razorpayOrder = await razorpay.orders.create({
          amount: Math.round(Number(totalPrice) * 100), // Amount in paise
          currency,
          receipt: `order_${order._id}`,
          notes: {
            orderId: order._id.toString(),
            userId,
            ...notes,
          },
        });

        // Update order with Razorpay details
        order.razorpayOrderId = razorpayOrder.id;
        await order.save();
      } catch (razorpayError: any) {
        console.error('Razorpay order creation error:', razorpayError?.message);
        // Continue without Razorpay if there's an error
      }
    }

    return NextResponse.json(
      {
        message: 'Order created successfully',
        order: {
          _id: order._id,
          userId,
          items,
          totalPrice,
          deliveryAddress,
          status: order.status,
          paymentStatus: order.paymentStatus,
          razorpayOrderId: order.razorpayOrderId,
        },
        ...(razorpayOrder && { keyId }),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create order error:', error?.message || error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
