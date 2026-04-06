import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Vendor } from '@/lib/models/Vendor';
import { PhoneOtp } from '@/lib/models/PhoneOtp';
import { sendOtpViaFast2Sms } from '@/lib/fast2sms';
import { consumeRateLimit, getClientIp } from '@/lib/rateLimit';
import { normalizePhone, normalizeRole, type PhoneLoginRole } from '@/lib/phoneAuthUtils';

const OTP_TTL_MS = Math.max(10, Number(process.env.OTP_TTL_SECONDS || '300')) * 1000;
const RESEND_COOLDOWN_SECONDS = Math.max(30, Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || '60'));

function generateOtp(): string {
  if (process.env.OTP_TEST_MODE === 'true') {
    return '123456';
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashOtp(phone: string, otp: string): string {
  return crypto
    .createHash('sha256')
    .update(`${phone}:${otp}:${process.env.OTP_HASH_SECRET || 'MySanjeevni-phone-otp'}`)
    .digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawPhone = String(body?.phone || '').trim();
    const fullName = String(body?.fullName || '').trim();
    const email = String(body?.email || '').trim();
    const role = normalizeRole(String(body?.role || 'user')) as PhoneLoginRole;

    // Validation
    if (!rawPhone || !fullName) {
      return NextResponse.json(
        { error: 'Phone number and full name are required' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(rawPhone);
    if (normalizedPhone.length < 10) {
      return NextResponse.json(
        { error: 'Valid phone number is required (at least 10 digits)' },
        { status: 400 }
      );
    }

    if (fullName.length < 2 || fullName.length > 100) {
      return NextResponse.json(
        { error: 'Full name must be between 2 and 100 characters' },
        { status: 400 }
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    await connectDB();

    const clientIp = getClientIp(request);

    // Rate limiting
    const ipLimit = await consumeRateLimit('phone-signup-ip', clientIp, 10, 60 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many signup attempts from this IP. Try again in ${ipLimit.retryAfterSeconds}s.`,
          retryAfterSeconds: ipLimit.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const phoneLimit = await consumeRateLimit(
      'phone-signup-phone',
      `${role}:${normalizedPhone}`,
      3,
      24 * 60 * 60 * 1000 // 24 hours
    );
    if (!phoneLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many signup attempts for this number today. Try again in 24 hours.',
          retryAfterSeconds: phoneLimit.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    // Check if phone already exists
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

    // Check if email already exists (if provided)
    if (email && role === 'user') {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return NextResponse.json(
          {
            error: 'This email is already registered. Please use a different email or login.',
            alreadyExists: true,
          },
          { status: 409 }
        );
      }
    }

    // Check resend cooldown
    const lastOtp = await PhoneOtp.findOne({
      phone: normalizedPhone,
      role,
      consumed: false,
    }).sort({ createdAt: -1 });

    if (lastOtp?.createdAt) {
      const elapsedSeconds = Math.floor((Date.now() - lastOtp.createdAt.getTime()) / 1000);
      const remaining = RESEND_COOLDOWN_SECONDS - elapsedSeconds;

      if (remaining > 0) {
        return NextResponse.json(
          {
            error: `Please wait ${remaining} seconds before requesting a new OTP.`,
            retryAfterSeconds: remaining,
            otp_code: process.env.OTP_TEST_MODE === 'true' ? '123456' : undefined,
          },
          { status: 429 }
        );
      }
    }

    // Generate and send OTP
    const otp = generateOtp();
    const otpHash = hashOtp(normalizedPhone, otp);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    // Delete any previous unexpired OTPs
    await PhoneOtp.deleteMany({
      phone: normalizedPhone,
      role,
      consumed: false,
    });

    // Create new OTP record
    await PhoneOtp.create({
      phone: normalizedPhone,
      role,
      otpHash,
      expiresAt,
      consumed: false,
    });

    // Send OTP via Fast2SMS
    try {
      await sendOtpViaFast2Sms(normalizedPhone, otp, 'signup');
    } catch (error) {
      // Log error but don't fail the request in test mode
      console.error('Failed to send OTP:', error);
      
      if (process.env.OTP_TEST_MODE !== 'true') {
        // In production, fail the request
        return NextResponse.json(
          { error: 'Failed to send OTP. Please try again.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        message: 'OTP sent successfully. Please verify to complete signup.',
        phone: normalizedPhone,
        cooldownSeconds: RESEND_COOLDOWN_SECONDS,
        expiresIn: Math.floor(OTP_TTL_MS / 1000),
        // Debug info in test mode
        ...(process.env.OTP_TEST_MODE === 'true' && { otp_code: otp }),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Phone signup error:', error);
    return NextResponse.json(
      { error: error?.message || 'Signup failed' },
      { status: 500 }
    );
  }
}
