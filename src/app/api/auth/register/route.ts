import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Vendor } from '@/lib/models/Vendor';

export async function POST(request: NextRequest) {
  try {
    const timeoutId = setTimeout(() => {
      console.error('Register request timeout');
    }, 15000);

    try {
      const body = await request.json();
      const { email, password, fullName, phone, fullAddress, role, businessType, businessAddress } = body;
      const normalizedEmail = email?.toLowerCase().trim();
      const normalizedFullAddress = fullAddress?.trim();

      const requestedRole = role || 'user';
      const allowedRoles = ['user', 'vendor', 'doctor', 'admin'];

      if (!allowedRoles.includes(requestedRole)) {
        clearTimeout(timeoutId);
        return NextResponse.json(
          { error: 'Invalid role selected' },
          { status: 400 }
        );
      }

      // Validation
      if (!normalizedEmail || !password || !fullName || !phone || !normalizedFullAddress) {
        clearTimeout(timeoutId);
        return NextResponse.json(
          { error: 'Missing required fields. Full name, email, phone, full address and password are required.' },
          { status: 400 }
        );
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        clearTimeout(timeoutId);
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }

      // Password validation (minimum 6 characters)
      if (password.length < 6) {
        clearTimeout(timeoutId);
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long' },
          { status: 400 }
        );
      }

      // Connect to DB
      await connectDB();

      if (requestedRole === 'vendor') {
        const existingVendor = await Vendor.findOne({ email: normalizedEmail });
        if (existingVendor) {
          clearTimeout(timeoutId);
          return NextResponse.json(
            { error: 'Vendor already exists with this email' },
            { status: 409 }
          );
        }

        const hashedPassword = crypto
          .createHash('sha256')
          .update(password)
          .digest('hex');

        const newVendor = await Vendor.create({
          vendorName: fullName,
          email: normalizedEmail,
          password: hashedPassword,
          phone,
          businessType: businessType || 'other',
          address: businessAddress || { street: normalizedFullAddress },
          status: 'pending',
        });

        clearTimeout(timeoutId);
        return NextResponse.json(
          {
            message: 'Vendor registered successfully. Awaiting admin approval.',
            pendingApproval: true,
            vendor: {
              id: newVendor._id,
              vendorName: newVendor.vendorName,
              email: newVendor.email,
              phone: newVendor.phone,
              businessType: newVendor.businessType,
              status: newVendor.status,
            },
          },
          { status: 201 }
        );
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        clearTimeout(timeoutId);
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

      // Create user in MongoDB
      const newUser = await User.create({
        fullName,
        email: normalizedEmail,
        phone,
        fullAddress: normalizedFullAddress,
        password: hashedPassword,
        role: requestedRole,
        isVerified: false,
      });

      // Return success response
      const userResponse = {
        id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
        phone: newUser.phone,
        fullAddress: newUser.fullAddress,
        role: newUser.role,
        isVerified: newUser.isVerified,
      };

      clearTimeout(timeoutId);
      return NextResponse.json(
        {
          message: 'User registered successfully',
          user: userResponse,
          token: crypto.randomUUID(),
        },
        { status: 201 }
      );
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error: any) {
    console.error('Register error:', error.message);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
