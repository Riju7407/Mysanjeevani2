import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { DoctorConsultation } from '@/lib/models/DoctorConsultation';

// GET /api/admin/consultations - list all consultations with filters
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const doctorId = searchParams.get('doctorId') || '';
    const date = searchParams.get('date') || '';
    const search = searchParams.get('search') || '';

    const query: any = {};
    if (status) query.status = status;
    if (doctorId) query.doctorId = doctorId;
    if (date) {
      const d = new Date(date);
      query.appointmentDate = {
        $gte: new Date(d.setHours(0, 0, 0, 0)),
        $lte: new Date(d.setHours(23, 59, 59, 999)),
      };
    }
    if (search) {
      query.$or = [
        { patientName: { $regex: search, $options: 'i' } },
        { patientEmail: { $regex: search, $options: 'i' } },
        { doctorName: { $regex: search, $options: 'i' } },
      ];
    }

    const consultations = await DoctorConsultation.find(query)
      .sort({ appointmentDate: 1, queueNumber: 1 })
      .lean();

    return NextResponse.json({ consultations, total: consultations.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
