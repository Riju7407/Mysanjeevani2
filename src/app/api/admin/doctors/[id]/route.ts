import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Doctor } from '@/lib/models/Doctor';
import { User } from '@/lib/models/User';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/admin/doctors/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const doctor = await Doctor.findById(id).lean();
    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    return NextResponse.json({ doctor });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/doctors/[id] - update doctor
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const doctor = await Doctor.findByIdAndUpdate(id, { $set: body }, { new: true });
    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

    return NextResponse.json({ doctor, message: 'Doctor updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/doctors/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const doctor = await Doctor.findByIdAndDelete(id).lean();
    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

    const userId = (doctor as any).userId;
    const doctorEmail = String((doctor as any).email || '').trim().toLowerCase();
    const doctorPhone = String((doctor as any).phone || '').trim();

    const userDeleteOrConditions: any[] = [];
    if (userId) {
      userDeleteOrConditions.push({ _id: userId });
    }
    if (doctorEmail) {
      userDeleteOrConditions.push({ email: { $regex: `^${escapeRegex(doctorEmail)}$`, $options: 'i' } });
    }
    if (doctorPhone) {
      userDeleteOrConditions.push({ phone: doctorPhone });
    }

    if (userDeleteOrConditions.length > 0) {
      await User.deleteMany({
        role: 'doctor',
        $or: userDeleteOrConditions,
      });
    }

    return NextResponse.json({ message: 'Doctor and linked user deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
