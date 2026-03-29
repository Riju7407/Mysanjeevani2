import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Inquiry } from '@/lib/models/Inquiry';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { subject, category, message } = body;

    const userId = (request.headers.get('x-user-id') || '').trim();
    const userName = (request.headers.get('x-user-name') || '').trim();
    const userEmail = (request.headers.get('x-user-email') || '').trim().toLowerCase();
    const userRole = (request.headers.get('x-user-role') || '').trim();

    if (!userId || !userName || !userEmail || !userRole) {
      return NextResponse.json(
        { error: 'You must be logged in to submit an inquiry.' },
        { status: 401 }
      );
    }

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required.' },
        { status: 400 }
      );
    }

    const inquiry = await Inquiry.create({
      userId,
      userName,
      userEmail,
      userRole,
      subject: String(subject).trim(),
      category: category || 'general',
      message: String(message).trim(),
    });

    return NextResponse.json(
      {
        message: 'Inquiry submitted successfully.',
        inquiry,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Inquiry submit error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to submit inquiry.' },
      { status: 500 }
    );
  }
}
