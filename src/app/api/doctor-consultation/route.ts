import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { DoctorConsultation } from '@/lib/models/DoctorConsultation';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.nextUrl.searchParams.get('userId');
    const status = request.nextUrl.searchParams.get('status');

    const query: any = {};
    if (userId) query.userId = userId;
    if (status) query.status = status;

    const consultations = await DoctorConsultation.find(query).sort({
      createdAt: -1,
    });

    return NextResponse.json(
      {
        message: 'Consultations fetched successfully',
        consultations,
        total: consultations.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get consultations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      userId,
      doctorName,
      specialization,
      consultationType,
      startTime,
      duration,
      fees,
    } = body;

    if (!userId || !doctorName || !startTime || !fees) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const consultation = await DoctorConsultation.create({
      userId,
      doctorName,
      specialization,
      consultationType,
      startTime,
      duration,
      fees,
      status: 'scheduled',
    });

    return NextResponse.json(
      {
        message: 'Consultation scheduled successfully',
        consultation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Schedule consultation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
