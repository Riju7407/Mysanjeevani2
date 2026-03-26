import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Doctor } from '@/lib/models/Doctor';

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
    const doctor = await Doctor.findByIdAndDelete(id);
    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

    return NextResponse.json({ message: 'Doctor deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
