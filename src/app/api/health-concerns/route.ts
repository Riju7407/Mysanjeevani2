import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { HealthConcern } from '@/lib/models/HealthConcern';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const search = request.nextUrl.searchParams.get('search');
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

    const query: any = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const concerns = await HealthConcern.find(query)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ name: 1 });

    const total = await HealthConcern.countDocuments(query);

    return NextResponse.json(
      {
        message: 'Health concerns fetched successfully',
        concerns,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get health concerns error:', error);
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
    const { name, description, symptoms, preventionTips } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const concern = await HealthConcern.create({
      name,
      description,
      symptoms,
      preventionTips,
    });

    return NextResponse.json(
      {
        message: 'Health concern created successfully',
        concern,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create health concern error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
