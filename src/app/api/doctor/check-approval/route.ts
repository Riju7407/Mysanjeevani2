import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Doctor } from '@/lib/models/Doctor';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Find user and check approval status
    const userData = await User.findById(userId);

    if (!userData || userData.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Doctor user not found' },
        { status: 404 }
      );
    }

    // Find doctor profile if exists
    const doctor = await Doctor.findOne({ userId });

    return NextResponse.json({
      isApproved: userData.isApproved || false,
      doctor: doctor || null,
    });
  } catch (error: any) {
    console.error('Error checking approval status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check approval status' },
      { status: 500 }
    );
  }
}
