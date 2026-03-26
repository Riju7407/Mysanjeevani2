import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { DoctorConsultation } from '@/lib/models/DoctorConsultation';

// PUT /api/consultations/[id] - user can cancel their consultation
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

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
