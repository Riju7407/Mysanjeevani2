import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import { Vendor } from '@/lib/models/Vendor';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    let { email, password } = body;

    // Normalize email to lowercase
    email = email.toLowerCase().trim();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Find vendor
    const vendor = await Vendor.findOne({ email }).select('+password');

    if (!vendor) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (vendor.status === 'pending') {
      return NextResponse.json(
        { error: 'Your vendor account is awaiting admin approval. Please check your email for approval status.' },
        { status: 403 }
      );
    }

    if (vendor.status === 'rejected') {
      return NextResponse.json(
        { error: 'Your vendor account was rejected. Contact support.' },
        { status: 403 }
      );
    }

    if (vendor.status === 'suspended') {
      return NextResponse.json(
        { error: 'Your vendor account is suspended' },
        { status: 403 }
      );
    }

    // Verify password
    const hashedPassword = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');

    if (hashedPassword !== vendor.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const vendorResponse = {
      id: vendor._id,
      vendorName: vendor.vendorName,
      email: vendor.email,
      businessType: vendor.businessType,
      status: vendor.status,
      rating: vendor.rating,
      totalOrders: vendor.totalOrders,
    };

    return NextResponse.json(
      {
        message: 'Login successful',
        vendor: vendorResponse,
        token: crypto.randomUUID(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Vendor login error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
