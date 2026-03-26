import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Notification } from '@/lib/models/Notification';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.nextUrl.searchParams.get('userId');
    const isRead = request.nextUrl.searchParams.get('isRead');

    const query: any = {};
    if (userId) query.userId = userId;
    if (isRead !== null) query.isRead = isRead === 'true';

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    return NextResponse.json(
      {
        message: 'Notifications fetched successfully',
        notifications,
        unreadCount,
        total: notifications.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get notifications error:', error);
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
    const { userId, type, title, message, actionUrl } = body;

    if (!userId || !type || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      actionUrl,
      isRead: false,
    });

    return NextResponse.json(
      {
        message: 'Notification created successfully',
        notification,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    const notificationId = request.nextUrl.searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    await Notification.findByIdAndUpdate(notificationId, { isRead: true });

    return NextResponse.json(
      {
        message: 'Notification marked as read',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
