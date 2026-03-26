import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import { Doctor } from '@/lib/models/Doctor';
import { DoctorConsultation } from '@/lib/models/DoctorConsultation';

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// GET /api/consultations?userId=xxx  - get user's consultations
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const consultations = await DoctorConsultation.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    // For each pending/confirmed consultation, compute patientsAhead live
    const enriched = await Promise.all(
      consultations.map(async (c: any) => {
        if (['pending', 'confirmed'].includes(c.status)) {
          const ahead = await DoctorConsultation.countDocuments({
            doctorId: c.doctorId,
            appointmentDate: {
              $gte: new Date(new Date(c.appointmentDate).setHours(0, 0, 0, 0)),
              $lte: new Date(new Date(c.appointmentDate).setHours(23, 59, 59, 999)),
            },
            queueNumber: { $lt: c.queueNumber },
            status: { $nin: ['cancelled', 'completed'] },
          });
          return { ...c, patientsAhead: ahead };
        }
        return c;
      })
    );

    return NextResponse.json({ consultations: enriched });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/consultations - book a consultation
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      userId,
      doctorId,
      patientName,
      patientPhone,
      patientEmail,
      appointmentDate,
      consultationType,
      symptoms,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = body;

    if (!userId || !doctorId || !patientName || !appointmentDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    const doctor = await Doctor.findById(doctorId).lean() as any;
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Compute queue number for this doctor on this date
    const dateStart = new Date(appointmentDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(appointmentDate);
    dateEnd.setHours(23, 59, 59, 999);

    const existingCount = await DoctorConsultation.countDocuments({
      doctorId,
      appointmentDate: { $gte: dateStart, $lte: dateEnd },
      status: { $nin: ['cancelled'] },
    });

    const queueNumber = existingCount + 1;

    const consultation = await DoctorConsultation.create({
      userId,
      doctorId,
      patientName,
      patientPhone: patientPhone || '',
      patientEmail: patientEmail || '',
      doctorName: doctor.name,
      doctorDepartment: doctor.department,
      doctorSpecialization: doctor.specialization,
      appointmentDate: new Date(appointmentDate),
      preferredTimeSlot: '',
      consultationType: consultationType || 'in-person',
      queueNumber,
      patientsAhead: queueNumber - 1,
      fees: doctor.consultationFee,
      paymentStatus: 'completed',
      paymentMethod: 'razorpay',
      paymentGateway: 'razorpay',
      razorpayOrderId,
      razorpayPaymentId,
      symptoms: symptoms || '',
      status: 'pending',
    });

    return NextResponse.json({ consultation, message: 'Consultation booked successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
