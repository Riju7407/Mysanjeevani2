import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { DoctorConsultation } from '@/lib/models/DoctorConsultation';

// PUT /api/admin/consultations/[id]  - admin updates status/notes only
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    if (body.allottedTime !== undefined) {
      return NextResponse.json(
        { error: 'Only doctor can set exact consultation time' },
        { status: 403 }
      );
    }

    // Allowed fields admin can update
    const allowed: Record<string, any> = {};
    const updatable = ['status', 'notes', 'prescription', 'appointmentDate', 'queueNumber'];
    for (const key of updatable) {
      if (body[key] !== undefined) allowed[key] = body[key];
    }

    // If confirming, recalculate patientsAhead
    const consultation = await DoctorConsultation.findByIdAndUpdate(
      id,
      { $set: allowed },
      { new: true }
    );

    if (!consultation) {
      return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
    }

    // Recompute patientsAhead after possible queue change
    if (allowed.queueNumber !== undefined || allowed.status !== undefined) {
      const ahead = await DoctorConsultation.countDocuments({
        doctorId: consultation.doctorId,
        appointmentDate: {
          $gte: new Date(new Date(consultation.appointmentDate).setHours(0, 0, 0, 0)),
          $lte: new Date(new Date(consultation.appointmentDate).setHours(23, 59, 59, 999)),
        },
        queueNumber: { $lt: consultation.queueNumber },
        status: { $nin: ['cancelled', 'completed'] },
      });
      consultation.patientsAhead = ahead;
      await consultation.save();
    }

    return NextResponse.json({ consultation, message: 'Updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/consultations/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const c = await DoctorConsultation.findByIdAndDelete(id);
    if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
