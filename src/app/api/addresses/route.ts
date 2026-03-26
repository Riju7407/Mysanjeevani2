import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Address } from '@/lib/models/Address';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Fetch all addresses for user
    const addresses = await Address.find({ userId }).sort({ createdAt: -1 });

    return NextResponse.json(
      {
        message: 'Addresses fetched successfully',
        addresses,
        total: addresses.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get addresses error:', error);
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
    const { userId, type, fullName, phone, addressLine1, addressLine2, city, state, pincode, isDefault } =
      body;

    if (!userId || !fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If this is default, unset other defaults
    if (isDefault) {
      await Address.updateMany({ userId, isDefault: true }, { isDefault: false });
    }

    // Create new address
    const address = await Address.create({
      userId,
      type,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      isDefault,
    });

    return NextResponse.json(
      {
        message: 'Address created successfully',
        address,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create address error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
