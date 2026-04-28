import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import { connectDB } from '@/lib/db';
import { Order } from '@/lib/models/Order';
import { User } from '@/lib/models/User';
import { Product } from '@/lib/models/Product';

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

    // Ensure User model is registered
    const { User: UserModel } = await import('@/lib/models/User');

    const userId = request.nextUrl.searchParams.get('userId');
    const vendorId = request.nextUrl.searchParams.get('vendorId');
    const admin = request.nextUrl.searchParams.get('admin') === 'true';

    if (!userId && !vendorId && !admin) {
      return NextResponse.json(
        { error: 'User ID, Vendor ID, or admin flag is required' },
        { status: 400 }
      );
    }

    let orders;

    if (admin) {
      // Admin can see all orders
      orders = await Order.find({}).sort({ createdAt: -1 }).populate('userId', 'fullName email phone');
    } else if (vendorId) {
      // Vendor can see orders containing their products
      const { Product } = await import('@/lib/models/Product');
      const vendorProducts = await Product.find({ vendorId }).select('_id');
      const productIds = vendorProducts.map(p => p._id.toString());
      
      orders = await Order.find({
        'items.productId': { $in: productIds }
      }).sort({ createdAt: -1 }).populate('userId', 'fullName email phone');
    } else {
      // Regular user sees their own orders
      orders = await Order.find({ userId }).sort({ createdAt: -1 });
    }

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

/**
 * PUT /api/orders
 * Updates order status
 * Request body: {
 *   orderId: string,
 *   status: string (pending|confirmed|shipped|delivered|cancelled),
 *   userType: 'admin' | 'vendor',
 *   vendorId?: string (required if userType is 'vendor')
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { orderId, status, userType, vendorId } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
        { status: 400 }
      );
    }

    // Find the order safely.
    let order;
    try {
      if (mongoose.isValidObjectId(orderId)) {
        order = await Order.findById(orderId);
      } else {
        order = await Order.findOne({ orderId });
      }
    } catch (findError: any) {
      console.error('Order lookup error:', findError?.message || findError);
      return NextResponse.json(
        { error: 'Invalid order ID or malformed request' },
        { status: 400 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (userType === 'vendor') {
      if (!vendorId) {
        return NextResponse.json(
          { error: 'Vendor ID is required for vendor updates' },
          { status: 400 }
        );
      }

      // Check if vendor owns any products in this order
      const { Product } = await import('@/lib/models/Product');
      const vendorProducts = await Product.find({ vendorId }).select('_id');
      const productIds = vendorProducts.map(p => p._id.toString());
      const hasVendorProducts = order.items.some((item: any) => 
        productIds.includes(item.productId)
      );

      if (!hasVendorProducts) {
        return NextResponse.json(
          { error: 'Vendor does not have permission to update this order' },
          { status: 403 }
        );
      }
    }
    // Admin has full access (no additional checks needed)

    // Update order status
    order.status = status;
    await order.save();

    return NextResponse.json(
      {
        message: 'Order status updated successfully',
        order,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update order error:', error?.message || error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
