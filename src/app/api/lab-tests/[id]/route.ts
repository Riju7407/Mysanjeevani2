import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/lib/models/Product';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const test = await Product.findById(id);

    if (!test) {
      return NextResponse.json(
        { error: 'Lab test not found' },
        { status: 404 }
      );
    }

    if (test.productType !== 'Lab Tests' || !test.isActive) {
      return NextResponse.json(
        { error: 'Lab test not available' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'Lab test fetched successfully',
        test,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get lab test error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
