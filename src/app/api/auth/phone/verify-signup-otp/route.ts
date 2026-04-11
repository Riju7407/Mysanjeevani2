import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { PhoneOtp } from '@/lib/models/PhoneOtp';
import { consumeRateLimit, getClientIp } from '@/lib/rateLimit';
import { normalizePhone, normalizeRole, type PhoneLoginRole } from '@/lib/phoneAuthUtils';

function hashOtp(phone: string, otp: string): string {
  return crypto
    .createHash('sha256')
    .update(`${phone}:${otp}:${process.env.OTP_HASH_SECRET || 'MySanjeevni-phone-otp'}`)
    .digest('hex');
}

function createPhoneVerificationToken(phone: string, role: PhoneLoginRole): string {
  const payload = {
    phone,
    role,
    verifiedAt: Date.now(),
  };

  const secret = process.env.OTP_HASH_SECRET || 'MySanjeevni-phone-otp';
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('hex');

  return `${encodedPayload}.${signature}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawPhone = String(body?.phone || '').trim();
    const otp = String(body?.otp || '').trim();
    const role = normalizeRole(String(body?.role || 'user')) as PhoneLoginRole;

    const normalizedPhone = normalizePhone(rawPhone);

    if (normalizedPhone.length < 10 || otp.length !== 6) {
      return NextResponse.json(
        { error: 'Valid phone number and 6-digit OTP are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const clientIp = getClientIp(request);
    const ipLimit = await consumeRateLimit('phone-verify-signup-only-ip', clientIp, 30, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many OTP verification attempts from this IP. Try again in ${ipLimit.retryAfterSeconds}s.`,
          retryAfterSeconds: ipLimit.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const phoneLimit = await consumeRateLimit(
      'phone-verify-signup-only-phone',
      `${role}:${normalizedPhone}`,
      10,
      10 * 60 * 1000
    );
    if (!phoneLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many OTP verification attempts for this number. Try again in ${phoneLimit.retryAfterSeconds}s.`,
          retryAfterSeconds: phoneLimit.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const otpHash = hashOtp(normalizedPhone, otp);
    const otpRecord = await PhoneOtp.findOne({
      phone: normalizedPhone,
      role,
      otpHash,
      consumed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
    }

    otpRecord.consumed = true;
    await otpRecord.save();

    const phoneVerificationToken = createPhoneVerificationToken(normalizedPhone, role);

    return NextResponse.json(
      {
        message: 'OTP verified successfully',
        phoneVerificationToken,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'OTP verification failed' },
      { status: 500 }
    );
  }
}
