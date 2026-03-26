import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

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

async function fetchRazorpayMethods() {
  if (!keyId || !keySecret) return null;

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const response = await fetch('https://api.razorpay.com/v1/methods', {
    method: 'GET',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) return null;
  return response.json();
}

function isMethodEnabled(selectedPaymentMethod: string, methods: any) {
  if (!selectedPaymentMethod || !methods) return true;

  if (selectedPaymentMethod === 'upi') return !!methods.upi;
  if (selectedPaymentMethod === 'card') return !!methods.card;
  if (selectedPaymentMethod === 'netbanking') return !!methods.netbanking;
  if (selectedPaymentMethod === 'wallet') return !!methods.wallet;

  return true;
}

export async function POST(request: NextRequest) {
  try {
    const {
      amount,
      currency = 'INR',
      receipt,
      notes = {},
      selectedPaymentMethod = '',
    } = await request.json();

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    const razorpay = getClient();

    // Pre-check merchant account method availability to avoid generic checkout failure.
    const methods = await fetchRazorpayMethods();
    if (selectedPaymentMethod && methods && !isMethodEnabled(selectedPaymentMethod, methods)) {
      return NextResponse.json(
        {
          error: `The selected payment method (${selectedPaymentMethod}) is disabled on your Razorpay merchant account. Please enable it in Razorpay Dashboard > Payment Methods.`,
          code: 'METHOD_DISABLED',
        },
        { status: 400 }
      );
    }

    // Razorpay expects amount in paise.
    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes,
    });

    return NextResponse.json({
      success: true,
      order,
      keyId,
      methods,
    });
  } catch (error: any) {
    console.error('Razorpay create-order error:', error?.message || error);
    const razorpayDescription = error?.error?.description || error?.description || error?.message;

    return NextResponse.json(
      {
        error: razorpayDescription || 'Failed to create payment order',
      },
      { status: 500 }
    );
  }
}
