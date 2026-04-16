import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import Razorpay from 'razorpay';
import { connectDB } from '@/lib/db';
import { LabTestBooking } from '@/lib/models/LabTestBooking';
import { cancelPartnerOrder } from '@/lib/labPartners';

const JWT_SECRET = process.env.JWT_SECRET || 'MySanjeevni-secret-key-2024';
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

function getUserId(req: Request): string | null {
  const explicitUserId = req.headers.get('x-user-id')?.trim();
  if (explicitUserId) return explicitUserId;

  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string; id?: string; sub?: string };
    return decoded.userId || decoded.id || decoded.sub || null;
  } catch {
    return null;
  }
}

function getClient() {
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const booking = await LabTestBooking.findOne({ _id: id, userId });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Booking already cancelled' }, { status: 400 });
    }

    if (booking.status === 'completed') {
      return NextResponse.json({ error: 'Completed booking cannot be cancelled' }, { status: 400 });
    }

    let partnerCancellation: { message?: string; raw?: unknown } | null = null;
    if (booking.provider && booking.provider !== 'local' && booking.providerOrderId) {
      try {
        partnerCancellation = await cancelPartnerOrder(booking.provider, booking.providerOrderId, {
          reasonKey: 'OTHER',
          reasonText: 'Cancelled by MySanjeevni user',
        });
        booking.providerStatus = 'CANCELLED';
      } catch (error) {
        console.error('Provider cancellation failed:', error);
      }
    }

    let refund: { id: string; status: string } | null = null;

    if (booking.paymentStatus === 'completed' && booking.razorpayPaymentId) {
      const client = getClient();
      if (!client) {
        return NextResponse.json({ error: 'Refund service unavailable' }, { status: 500 });
      }

      const amountPaise = Math.round(Number(booking.testPrice || 0) * 100);
      if (amountPaise > 0) {
        const refunded = await client.payments.refund(String(booking.razorpayPaymentId), {
          amount: amountPaise,
          speed: 'normal',
          notes: {
            reason: 'lab_booking_cancelled_by_user',
            bookingId: String(booking._id),
          },
        });
        refund = { id: refunded.id, status: refunded.status };
        booking.paymentStatus = 'refunded';
      }
    }

    booking.status = 'cancelled';
    booking.notes = `${booking.notes || ''}\n[System] Cancelled by user${refund ? ` | Refund: ${refund.id}` : ''}`.trim();
    await booking.save();

    return NextResponse.json({
      message: refund
        ? 'Booking cancelled and refund initiated to your original payment account'
        : 'Booking cancelled successfully',
      booking,
      refund,
      providerCancellation: partnerCancellation,
    });
  } catch (error) {
    console.error('Cancel lab booking error:', error);
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
  }
}
