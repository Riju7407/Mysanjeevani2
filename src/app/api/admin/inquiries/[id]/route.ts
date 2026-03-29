import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Inquiry } from '@/lib/models/Inquiry';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actorRole = request.headers.get('x-user-role');
    if (actorRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only admin can update inquiries.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'Inquiry ID is required.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, adminNote } = body;

    await connectDB();

    const updates: any = {};
    if (status) {
      updates.status = status;
      if (status === 'resolved' || status === 'closed') {
        updates.resolvedAt = new Date();
      }
    }

    if (typeof adminNote === 'string') {
      updates.adminNote = adminNote.trim();
    }

    const inquiry = await Inquiry.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!inquiry) {
      return NextResponse.json(
        { error: 'Inquiry not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Inquiry updated successfully.', inquiry });
  } catch (error: any) {
    console.error('Admin inquiry update error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to update inquiry.' },
      { status: 500 }
    );
  }
}
