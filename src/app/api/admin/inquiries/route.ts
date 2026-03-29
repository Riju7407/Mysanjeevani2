import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Inquiry } from '@/lib/models/Inquiry';

export async function GET(request: NextRequest) {
  try {
    const actorRole = request.headers.get('x-user-role');
    if (actorRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only admin can view inquiries.' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const status = (searchParams.get('status') || '').trim();

    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
      ];
    }

    const inquiries = await Inquiry.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ inquiries, total: inquiries.length });
  } catch (error: any) {
    console.error('Admin inquiries fetch error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inquiries.' },
      { status: 500 }
    );
  }
}
