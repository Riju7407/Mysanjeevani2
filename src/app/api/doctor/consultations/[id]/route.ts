import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Doctor } from '@/lib/models/Doctor';
import { DoctorConsultation } from '@/lib/models/DoctorConsultation';

// PUT /api/doctor/consultations/[id] - doctor sets exact consultation time
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const doctorEmail = request.headers.get('x-doctor-email') || body.doctorEmail;

    if (!doctorEmail) {
      return NextResponse.json({ error: 'Doctor email is required' }, { status: 400 });
    }

    const doctor = await Doctor.findOne({ email: doctorEmail }).lean() as any;
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    const updates: Record<string, any> = {};

    if (body.allottedTime !== undefined) {
      updates.allottedTime = String(body.allottedTime).trim();
    }

    if (body.status !== undefined) {
      updates.status = body.status;
    }

    if (body.notes !== undefined) {
      updates.notes = body.notes;
    }

    // If doctor sets an exact time and does not explicitly provide status, auto-confirm.
    if (updates.allottedTime && updates.status === undefined) {
      updates.status = 'confirmed';
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
    }

    const consultation = await DoctorConsultation.findOneAndUpdate(
      { _id: id, doctorId: doctor._id },
      { $set: updates },
      { new: true }
    );

    if (!consultation) {
      return NextResponse.json({ error: 'Consultation not found for this doctor' }, { status: 404 });
    }

    return NextResponse.json({ consultation, message: 'Consultation updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
