import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import { LabTestBooking } from '@/lib/models/LabTestBooking';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'mysanjeevani-secret-key-2024';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

function getUserId(req: Request): string | null {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

// GET /api/lab-test-bookings — user's bookings
export async function GET(req: Request) {
  try {
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const bookings = await LabTestBooking.find({ userId }).sort({ createdAt: -1 }).populate('testId', 'testName icon');
    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Lab test bookings GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

// POST /api/lab-test-bookings — book a test
export async function POST(req: Request) {
  try {
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const body = await req.json();
    const {
      testId,
      testName,
      testPrice,
      collectionType,
      collectionDate,
      collectionTime,
      address,
      notes,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = body;

    if (!testId || !testName || !collectionDate) {
      return NextResponse.json({ error: 'testId, testName and collectionDate are required' }, { status: 400 });
    }

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: 'Payment verification fields are required' }, { status: 400 });
    }

    if (!RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: 'Payment gateway is not configured' }, { status: 500 });
    }

    const verificationBody = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(verificationBody)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 });
    }

    const booking = await LabTestBooking.create({
      userId,
      testId,
      testName,
      testPrice,
      collectionType: collectionType || 'home',
      collectionDate: new Date(collectionDate),
      collectionTime,
      address,
      paymentStatus: 'completed',
      paymentMethod: 'razorpay',
      paymentGateway: 'razorpay',
      razorpayOrderId,
      razorpayPaymentId,
      notes,
      status: 'scheduled',
    });

    return NextResponse.json({ message: 'Test booked successfully', booking }, { status: 201 });
  } catch (error) {
    console.error('Lab test booking POST error:', error);
    return NextResponse.json({ error: 'Failed to book test' }, { status: 500 });
  }
}
