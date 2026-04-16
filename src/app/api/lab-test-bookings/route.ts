import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { connectDB } from '@/lib/db';
import { LabTestBooking } from '@/lib/models/LabTestBooking';
import { User } from '@/lib/models/User';
import { createPartnerOrder, detectProviderFromTestId } from '@/lib/labPartners';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'MySanjeevni-secret-key-2024';
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

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

// GET /api/lab-test-bookings — user's bookings
export async function GET(req: Request) {
  try {
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const bookings = await LabTestBooking.find({ userId }).sort({ createdAt: -1 });
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
      patientPincode,
      patientAge,
      patientGender,
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

    const provider = detectProviderFromTestId(String(testId || ''));

    let providerOrderId = '';
    let providerStatus = '';
    let providerLeadId = '';
    let providerPayload: unknown = null;

    if (provider !== 'local') {
      const user = await User.findById(userId).select('fullName email phone');
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      try {
        const partnerOrder = await createPartnerOrder(provider, {
          testId: String(testId),
          testName: String(testName),
          testPrice: Number(testPrice || 0),
          collectionDate: String(collectionDate),
          collectionTime: collectionTime ? String(collectionTime) : undefined,
          address: address ? String(address) : undefined,
          patientPincode: patientPincode ? String(patientPincode) : undefined,
          patientAge: Number.isFinite(Number(patientAge)) ? Number(patientAge) : undefined,
          patientGender: patientGender || 'MALE',
          notes: notes ? String(notes) : undefined,
          user: {
            id: String(userId),
            fullName: String(user.fullName || ''),
            email: String(user.email || ''),
            phone: String(user.phone || ''),
          },
        });

        providerOrderId = partnerOrder.providerOrderId;
        providerStatus = partnerOrder.providerStatus || '';
        providerLeadId = partnerOrder.providerLeadId || '';
        providerPayload = partnerOrder.raw || null;
      } catch (partnerError) {
        console.error('Partner order creation failed after payment:', partnerError);

        if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET && razorpayPaymentId) {
          try {
            const razorpay = new Razorpay({
              key_id: RAZORPAY_KEY_ID,
              key_secret: RAZORPAY_KEY_SECRET,
            });

            const amountPaise = Math.max(0, Math.round(Number(testPrice || 0) * 100));
            if (amountPaise > 0) {
              await razorpay.payments.refund(String(razorpayPaymentId), {
                amount: amountPaise,
                speed: 'normal',
                notes: {
                  reason: 'partner_order_creation_failed',
                  provider,
                  testId: String(testId || ''),
                },
              });
            }
          } catch (refundError) {
            console.error('Auto-refund failed after partner order failure:', refundError);
          }
        }

        return NextResponse.json(
          {
            error:
              partnerError instanceof Error
                ? partnerError.message
                : 'Partner booking failed after payment. Refund has been initiated where possible.',
          },
          { status: 422 }
        );
      }
    }

    const booking = await LabTestBooking.create({
      userId,
      testId: String(testId),
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
      provider,
      providerOrderId,
      providerStatus,
      providerLeadId,
      providerPayload,
      providerLastSyncedAt: provider !== 'local' ? new Date() : null,
      notes,
      status: 'scheduled',
    });

    return NextResponse.json({ message: 'Test booked successfully', booking }, { status: 201 });
  } catch (error) {
    console.error('Lab test booking POST error:', error);
    return NextResponse.json({ error: 'Failed to book test' }, { status: 500 });
  }
}
