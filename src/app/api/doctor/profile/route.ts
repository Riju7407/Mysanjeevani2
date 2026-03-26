import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Doctor } from '@/lib/models/Doctor';

// PUT /api/doctor/profile
// Body: { email, name, phone, department, specialization, experience, qualification, bio, consultationFee, avatar, isAvailable }
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const actorRole = request.headers.get('x-user-role');
    if (actorRole !== 'doctor' && actorRole !== 'admin') {
      return NextResponse.json({ error: 'Only doctor or admin can edit profile' }, { status: 403 });
    }

    const body = await request.json();
    const {
      email,
      name,
      phone,
      department,
      specialization,
      experience,
      qualification,
      bio,
      consultationFee,
      avatar,
      isAvailable,
    } = body;

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (department !== undefined) updates.department = department;
    if (specialization !== undefined) updates.specialization = specialization;
    if (experience !== undefined) updates.experience = Number(experience) || 0;
    if (qualification !== undefined) updates.qualification = qualification;
    if (bio !== undefined) updates.bio = bio;
    if (consultationFee !== undefined) updates.consultationFee = Number(consultationFee) || 0;
    if (avatar !== undefined) updates.avatar = avatar;
    if (isAvailable !== undefined) updates.isAvailable = !!isAvailable;

    const doctor = await Doctor.findOneAndUpdate(
      { email },
      { $set: updates },
      { new: true }
    ).lean();

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found for this email' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Profile updated successfully', doctor });
  } catch (error: any) {
    console.error('Doctor profile update error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
