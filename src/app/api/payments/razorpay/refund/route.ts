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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const paymentId = String(body.paymentId || '').trim();
    const reason = String(body.reason || 'requested_by_customer').trim();
    const amountRupees = Number(body.amount || 0);

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId is required' }, { status: 400 });
    }

    if (!Number.isFinite(amountRupees) || amountRupees <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    const client = getClient();
    const amountPaise = Math.round(amountRupees * 100);

    const refund = await client.payments.refund(paymentId, {
      amount: amountPaise,
      speed: 'normal',
      notes: {
        reason,
      },
    });

    return NextResponse.json(
      {
        success: true,
        refund: {
          id: refund.id,
          status: refund.status,
          amount: Number(refund.amount || 0) / 100,
          payment_id: refund.payment_id,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Razorpay refund error:', error?.message || error);
    return NextResponse.json(
      { error: error?.error?.description || error?.message || 'Failed to initiate refund' },
      { status: 500 }
    );
  }
}
