import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Doctor } from '@/lib/models/Doctor';
import { DoctorConsultation } from '@/lib/models/DoctorConsultation';

// GET /api/doctor/consultations?email=doctor@example.com
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Failsafe: auto-complete stale in-progress consultations.
    const staleThresholdMs = 2 * 60 * 1000;
    const staleBefore = new Date(Date.now() - staleThresholdMs);
    await DoctorConsultation.updateMany(
      { status: 'in-progress', updatedAt: { $lt: staleBefore } },
      { $set: { status: 'completed' } }
    );

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const doctor = await Doctor.findOne({ email }).lean() as any;

    if (!doctor) {
      return NextResponse.json(
        {
          doctorFound: false,
          consultations: [],
          stats: { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 },
          message: 'Doctor profile not found for this account email',
        },
        { status: 200 }
      );
    }

    const consultations = await DoctorConsultation.find({ doctorId: doctor._id })
      .sort({ appointmentDate: 1, queueNumber: 1 })
      .lean();

    const stats = {
      total: consultations.length,
      pending: consultations.filter((c: any) => c.status === 'pending').length,
      confirmed: consultations.filter((c: any) => c.status === 'confirmed').length,
      completed: consultations.filter((c: any) => c.status === 'completed').length,
      cancelled: consultations.filter((c: any) => c.status === 'cancelled').length,
    };

    return NextResponse.json(
      {
        doctorFound: true,
        doctor: {
          _id: doctor._id,
          name: doctor.name,
          email: doctor.email,
          phone: doctor.phone || '',
          department: doctor.department,
          specialization: doctor.specialization,
          experience: doctor.experience,
          qualification: doctor.qualification || '',
          bio: doctor.bio || '',
          consultationFee: doctor.consultationFee || 0,
          availableDates: doctor.availableDates || [],
          avatar: doctor.avatar || '👨‍⚕️',
          isAvailable: doctor.isAvailable !== false,
        },
        stats,
        consultations,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: any) {
    console.error('Doctor consultations error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
