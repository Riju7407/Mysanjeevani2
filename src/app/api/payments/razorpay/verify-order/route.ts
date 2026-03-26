import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const keySecret = process.env.RAZORPAY_KEY_SECRET;

export async function POST(request: NextRequest) {
  try {
    if (!keySecret) {
      return NextResponse.json({ error: 'Razorpay secret is not configured' }, { status: 500 });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment verification fields' }, { status: 400 });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 400 });
    }

    return NextResponse.json({ success: true, verified: true });
  } catch (error: any) {
    console.error('Razorpay verify-order error:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
