import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { connectDB } from '@/lib/db';
import { DoctorConsultation } from '@/lib/models/DoctorConsultation';

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

function getClient() {
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// PUT /api/consultations/[id] - user can cancel their consultation
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    if (body.status === 'cancelled') {
      const consultation = await DoctorConsultation.findById(id);
      if (!consultation) {
        return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
      }

      if (consultation.status === 'cancelled') {
        return NextResponse.json({ error: 'Consultation already cancelled' }, { status: 400 });
      }

      if (consultation.status === 'completed') {
        return NextResponse.json({ error: 'Completed consultation cannot be cancelled' }, { status: 400 });
      }

      let refund: { id: string; status: string } | null = null;
      const isRazorpayPayment =
        String(consultation.paymentGateway || '').toLowerCase() === 'razorpay' ||
        String(consultation.paymentMethod || '').toLowerCase().includes('razorpay');

      if (
        isRazorpayPayment &&
        consultation.paymentStatus === 'completed' &&
        consultation.razorpayPaymentId &&
        Number(consultation.fees || 0) > 0
      ) {
        const client = getClient();
        if (!client) {
          return NextResponse.json({ error: 'Refund service unavailable' }, { status: 500 });
        }

        const refunded = await client.payments.refund(String(consultation.razorpayPaymentId), {
          amount: Math.round(Number(consultation.fees || 0) * 100),
          speed: 'normal',
          notes: {
            reason: 'consultation_cancelled_by_user',
            consultationId: String(consultation._id),
          },
        });

        refund = { id: refunded.id, status: refunded.status };
        consultation.paymentStatus = 'refunded';
        consultation.refundId = refunded.id;
        consultation.refundedAt = new Date();
      }

      consultation.status = 'cancelled';
      consultation.notes = `${consultation.notes || ''}\n[System] Cancelled by user${refund ? ` | Refund: ${refund.id}` : ''}`.trim();
      await consultation.save();

      return NextResponse.json({
        consultation,
        refund,
        message: refund
          ? 'Consultation cancelled and refund initiated to original payment account'
          : 'Consultation cancelled successfully',
      });
    }

    const allowed: Record<string, any> = {};
    if (body.status) allowed.status = body.status;
    if (body.rating !== undefined) allowed.rating = body.rating;
    if (body.feedback !== undefined) allowed.feedback = body.feedback;

    const consultation = await DoctorConsultation.findByIdAndUpdate(
      id,
      { $set: allowed },
      { new: true }
    );

    if (!consultation) {
      return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
    }

    return NextResponse.json({ consultation, message: 'Updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
