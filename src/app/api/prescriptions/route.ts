import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Prescription } from '@/lib/models/Prescription';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.nextUrl.searchParams.get('userId');
    const status = request.nextUrl.searchParams.get('status');

    const query: any = {};
    if (userId) query.userId = userId;
    if (status) query.status = status;

    const prescriptions = await Prescription.find(query).sort({
      createdAt: -1,
    });

    return NextResponse.json(
      {
        message: 'Prescriptions fetched successfully',
        prescriptions,
        total: prescriptions.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get prescriptions error:', error);
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
      prescriptionFile,
      doctorName,
      hospitalName,
      issueDate,
      expiryDate,
      medicines,
    } = body;

    if (!userId || !prescriptionFile) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const prescription = await Prescription.create({
      userId,
      prescriptionFile,
      doctorName,
      hospitalName,
      issueDate,
      expiryDate,
      medicines,
      status: 'active',
    });

    return NextResponse.json(
      {
        message: 'Prescription uploaded successfully',
        prescription,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload prescription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
