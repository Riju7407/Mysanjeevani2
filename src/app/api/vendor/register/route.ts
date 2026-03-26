import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import { Vendor } from '@/lib/models/Vendor';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    let { vendorName, email, password, phone, businessType, businessAddress } = body;

    // Normalize email to lowercase
    email = email.toLowerCase().trim();

    // Validation
    if (!vendorName || !email || !password || !phone || !businessType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if vendor exists
    const existingVendor = await Vendor.findOne({ email });
    if (existingVendor) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');

    // Create vendor
    const newVendor = await Vendor.create({
      vendorName,
      email,
      password: hashedPassword,
      phone,
      businessType,
      address: businessAddress || {},
      status: 'pending',
    });

    const vendorResponse = {
      id: newVendor._id,
      vendorName: newVendor.vendorName,
      email: newVendor.email,
      phone: newVendor.phone,
      businessType: newVendor.businessType,
      status: newVendor.status,
    };

    return NextResponse.json(
      {
        message: 'Vendor registered successfully. Awaiting approval.',
        vendor: vendorResponse,
        token: crypto.randomUUID(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Vendor register error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
