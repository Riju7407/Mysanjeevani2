import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Vendor } from '@/lib/models/Vendor';
import { PhoneOtp } from '@/lib/models/PhoneOtp';
import {
  normalizePhone,
  normalizeRole,
  type PhoneLoginRole,
} from '@/lib/phoneAuthUtils';
import { consumeRateLimit, getClientIp } from '@/lib/rateLimit';

function hashOtp(phone: string, otp: string): string {
  return crypto
    .createHash('sha256')
    .update(`${phone}:${otp}:${process.env.OTP_HASH_SECRET || 'mysanjeevani-phone-otp'}`)
    .digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawPhone = String(body?.phone || '').trim();
    const otp = String(body?.otp || '').trim();
    const fullName = String(body?.fullName || '').trim();
    const email = String(body?.email || '').trim();
    const role = normalizeRole(String(body?.role || 'user')) as PhoneLoginRole;

    // Validation
    if (!rawPhone || !otp || !fullName) {
      return NextResponse.json(
        { error: 'Phone, OTP, and full name are required' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(rawPhone);

    if (normalizedPhone.length < 10 || otp.length !== 6) {
      return NextResponse.json(
        { error: 'Valid phone number and 6-digit OTP are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const clientIp = getClientIp(request);

    // Rate limiting
    const ipLimit = await consumeRateLimit('phone-verify-signup-ip', clientIp, 40, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many verification attempts from this IP. Try again in ${ipLimit.retryAfterSeconds}s.`,
          retryAfterSeconds: ipLimit.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const phoneLimit = await consumeRateLimit(
      'phone-verify-signup-phone',
      `${role}:${normalizedPhone}`,
      10,
      10 * 60 * 1000
    );
    if (!phoneLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many verification attempts for this number. Try again in ${phoneLimit.retryAfterSeconds}s.`,
          retryAfterSeconds: phoneLimit.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    // Check if phone already registered
    let existingUser = null;
    if (role === 'vendor') {
      existingUser = await Vendor.findOne({ phone: normalizedPhone });
    } else {
      existingUser = await User.findOne({ phone: normalizedPhone });
    }

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'This phone number is already registered',
          alreadyExists: true,
          suggestedAction: 'login',
        },
        { status: 409 }
      );
    }

    // Verify OTP
    const otpHash = hashOtp(normalizedPhone, otp);
    const otpRecord = await PhoneOtp.findOne({
      phone: normalizedPhone,
      role,
      otpHash,
      consumed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 401 }
      );
    }

    // Mark OTP as consumed
    otpRecord.consumed = true;
    await otpRecord.save();

    // Create new user account
    let newUser = null;

    if (role === 'vendor') {
      newUser = await Vendor.create({
        vendorName: fullName,
        phone: normalizedPhone,
        email: email || undefined,
        status: 'pending', // Needs admin approval
        verifiedPhoneNumber: true,
        verifiedEmail: !!email,
      });
    } else if (role === 'doctor') {
      newUser = await User.create({
        fullName,
        phone: normalizedPhone,
        email: email || undefined,
        role: 'doctor',
        isVerified: true,
        isPhoneVerified: true,
        isApproved: false, // Needs doctor approval
      });
    } else {
      // Regular user
      newUser = await User.create({
        fullName,
        phone: normalizedPhone,
        email: email || undefined,
        role: 'user',
        isVerified: true,
        isPhoneVerified: true,
      });
    }

    // Generate session token
    const sessionToken = crypto.randomUUID();

    // Return success with user info
    if (role === 'vendor') {
      return NextResponse.json(
        {
          message: 'Account created successfully. Awaiting vendor approval.',
          user: {
            id: newUser._id,
            phone: newUser.phone,
            email: newUser.email,
            fullName: newUser.vendorName,
            role: 'vendor',
            status: newUser.status,
            isVerified: false, // Not verified yet (pending approval)
          },
          sessionToken,
          requiresApproval: true,
        },
        { status: 201 }
      );
    }

    if (role === 'doctor') {
      return NextResponse.json(
        {
          message: 'Doctor account created. Awaiting admin approval.',
          user: {
            id: newUser._id,
            phone: newUser.phone,
            email: newUser.email,
            fullName: newUser.fullName,
            role: 'doctor',
            isVerified: false,
            isApproved: false,
          },
          sessionToken,
          requiresApproval: true,
          approvalMessage: 'Your doctor account is pending admin verification. You will be notified once approved.',
        },
        { status: 201 }
      );
    }

    // Regular user - immediate access
    return NextResponse.json(
      {
        message: 'Account created successfully. You can now login.',
        user: {
          id: newUser._id,
          phone: newUser.phone,
          email: newUser.email,
          fullName: newUser.fullName,
          role: 'user',
          isVerified: true,
        },
        sessionToken,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Phone signup verification error:', error);
    return NextResponse.json(
      { error: error?.message || 'Signup verification failed' },
      { status: 500 }
    );
  }
}
