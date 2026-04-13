import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Doctor } from '@/lib/models/Doctor';

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
  maxPatients: number;
  isActive: boolean;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      userId,
      department,
      specialization,
      experience,
      qualification,
      bio,
      consultationFee,
      availableDates,
      timeSlots,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify user is a doctor and approved
    const user = await User.findById(userId);

    if (!user || user.role !== 'doctor') {
      return NextResponse.json(
        { error: 'User is not a doctor' },
        { status: 403 }
      );
    }

    if (!user.isApproved) {
      return NextResponse.json(
        { error: 'Doctor account is not approved yet' },
        { status: 403 }
      );
    }

    // Find or create doctor profile
    let doctor = await Doctor.findOne({ userId });

    if (!doctor) {
      doctor = new Doctor({
        userId,
        name: user.fullName,
        email: user.email,
        phone: user.phone,
        registrationNumber: user.registrationNumber,
        identityDocumentUrl: user.identityDocument,
        isApproved: true,
        approvalStatus: 'approved',
      });
    }

    // Update profile details
    if (department) doctor.department = department;
    if (specialization) doctor.specialization = specialization;
    if (experience !== undefined) doctor.experience = experience;
    if (qualification) doctor.qualification = qualification;
    if (bio) doctor.bio = bio;
    if (consultationFee !== undefined) doctor.consultationFee = Number(consultationFee) || 0;
    if (Array.isArray(availableDates)) {
      doctor.availableDates = Array.from(
        new Set(
          availableDates
            .map((date) => String(date || '').trim())
            .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
        )
      ).sort();
    }
    if (timeSlots && Array.isArray(timeSlots)) {
      doctor.timeSlots = timeSlots as TimeSlot[];
    }

    await doctor.save();

    return NextResponse.json(
      {
        message: 'Profile setup completed successfully',
        doctor: {
          id: doctor._id,
          name: doctor.name,
          email: doctor.email,
          department: doctor.department,
          specialization: doctor.specialization,
          experience: doctor.experience,
          consultationFee: doctor.consultationFee,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error setting up doctor profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set up profile' },
      { status: 500 }
    );
  }
}
