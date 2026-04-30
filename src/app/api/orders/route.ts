import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import { connectDB } from '@/lib/db';
import { Order } from '@/lib/models/Order';
import { User } from '@/lib/models/User';
import { Product } from '@/lib/models/Product';
import { Address } from '@/lib/models/Address';
import { Vendor } from '@/lib/models/Vendor';
import { createShiprocketOrder, generateAWB } from '@/lib/shiprocket';

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
      orders = await Order.find({}).sort({ createdAt: -1 }).populate('userId', 'fullName email phone').populate('deliveryAddress');
    } else if (vendorId) {
      // Vendor can see orders containing their products
      const { Product } = await import('@/lib/models/Product');
      const vendorProducts = await Product.find({ vendorId }).select('_id');
      const productIds = vendorProducts.map(p => p._id.toString());
      
      orders = await Order.find({
        'items.productId': { $in: productIds }
      }).sort({ createdAt: -1 }).populate('userId', 'fullName email phone').populate('deliveryAddress');
    } else {
      // Regular user sees their own orders
      orders = await Order.find({ userId }).sort({ createdAt: -1 }).populate('deliveryAddress');
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
 *   deliveryAddressId: string,
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
      deliveryAddressId,
      currency = 'INR',
      notes = {},
    } = body;

    if (!userId || !items || !totalPrice || !deliveryAddressId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, items, totalPrice, deliveryAddressId' },
        { status: 400 }
      );
    }

    // Create new order in database
    const order = await Order.create({
      userId,
      items,
      totalPrice,
      deliveryAddress: deliveryAddressId,
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
          deliveryAddress: deliveryAddressId,
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

    // If status changed to 'shipped', create Shiprocket shipment
    if (status === 'shipped') {
      try {
        await createShiprocketShipment(order);
      } catch (shippingError: any) {
        console.error('Shipping creation error:', shippingError?.message || shippingError);
        // Don't fail the request, just log the error
      }
    }

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

async function createShiprocketShipment(order: any) {
  try {
    // Populate order with delivery address and user
    await order.populate('deliveryAddress');
    await order.populate('userId');

    // Get vendor from first product (assuming single vendor for simplicity)
    const firstProductId = order.items[0].productId;
    const product = await Product.findById(firstProductId).populate('vendorId');
    if (!product || !product.vendorId) {
      throw new Error('Vendor not found for product');
    }
    const vendor = product.vendorId;

    // Prepare order data for Shiprocket
    const orderData = {
      order_id: order._id.toString(),
      order_date: order.createdAt.toISOString().split('T')[0],
      pickup_location: 'Main Warehouse', // Default pickup location name
      channel_id: process.env.SHIPROCKET_CHANNEL_ID || '',
      comment: order.orderNotes || '',
      billing_customer_name: order.userId.fullName.split(' ')[0],
      billing_last_name: order.userId.fullName.split(' ').slice(1).join(' ') || '',
      billing_address: order.deliveryAddress.addressLine1,
      billing_address_2: order.deliveryAddress.addressLine2 || '',
      billing_city: order.deliveryAddress.city,
      billing_pincode: order.deliveryAddress.pincode,
      billing_state: order.deliveryAddress.state,
      billing_country: order.deliveryAddress.country,
      billing_email: order.userId.email,
      billing_phone: order.userId.phone,
      shipping_is_billing: true,
      shipping_customer_name: order.deliveryAddress.fullName.split(' ')[0],
      shipping_last_name: order.deliveryAddress.fullName.split(' ').slice(1).join(' ') || '',
      shipping_address: order.deliveryAddress.addressLine1,
      shipping_address_2: order.deliveryAddress.addressLine2 || '',
      shipping_city: order.deliveryAddress.city,
      shipping_pincode: order.deliveryAddress.pincode,
      shipping_state: order.deliveryAddress.state,
      shipping_country: order.deliveryAddress.country,
      shipping_email: order.userId.email,
      shipping_phone: order.deliveryAddress.phone,
      order_items: order.items.map((item: any) => ({
        name: item.productName,
        sku: item.productId,
        units: item.quantity,
        selling_price: item.price,
        discount: 0,
        tax: 0,
        hsn: '', // Need to add HSN to product model if required
      })),
      payment_method: 'Prepaid', // Since payment is already done
      shipping_charges: 0, // Calculate if needed
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: order.totalPrice,
      length: 10, // Default dimensions, should be from product
      breadth: 10,
      height: 10,
      weight: 0.5, // Default weight
    };

    // Create Shiprocket order
    const shiprocketResponse = await createShiprocketOrder(orderData);

    // Update order with Shiprocket details
    order.shiprocketOrderId = shiprocketResponse.order_id;
    order.shiprocketShipmentId = shiprocketResponse.shipment_id;
    await order.save();

    // Generate AWB
    if (order.shiprocketShipmentId) {
      const awbResponse = await generateAWB(order.shiprocketShipmentId);
      order.awbNumber = awbResponse.awb_code || awbResponse.awb_assign_response?.awb_code;
      await order.save();
    }

    console.log('Shiprocket shipment created successfully for order:', order._id);
  } catch (error: any) {
    console.error('Error creating Shiprocket shipment:', error?.message || error);
    throw error;
  }
}
