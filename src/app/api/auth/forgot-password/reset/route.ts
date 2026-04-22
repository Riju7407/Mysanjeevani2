import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { PhoneOtp } from '@/lib/models/PhoneOtp';
import {
  findRegisteredByPhone,
  normalizePhone,
  normalizeRole,
  type PhoneLoginRole,
} from '@/lib/phoneAuthUtils';
import { consumeRateLimit, getClientIp } from '@/lib/rateLimit';

function hashOtp(phone: string, otp: string): string {
  return crypto
    .createHash('sha256')
    .update(`${phone}:${otp}:${process.env.OTP_HASH_SECRET || 'MySanjeevni-phone-otp'}`)
    .digest('hex');
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawPhone = String(body?.phone || '').trim();
    const otp = String(body?.otp || '').trim();
    const newPassword = String(body?.newPassword || '').trim();
    const role = normalizeRole(String(body?.role || 'user')) as PhoneLoginRole;

    const normalizedPhone = normalizePhone(rawPhone);

    if (normalizedPhone.length < 10 || otp.length !== 6) {
      return NextResponse.json(
        { error: 'Valid phone number and 6-digit OTP are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    await connectDB();

    const clientIp = getClientIp(request);

    const ipLimit = await consumeRateLimit('forgot-password-reset-ip', clientIp, 40, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many password reset attempts from this IP. Try again in ${ipLimit.retryAfterSeconds}s.`,
          retryAfterSeconds: ipLimit.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const phoneLimit = await consumeRateLimit(
      'forgot-password-reset-phone',
      `${role}:${normalizedPhone}`,
      10,
      10 * 60 * 1000
    );
    if (!phoneLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many attempts for this number. Try again in ${phoneLimit.retryAfterSeconds}s.`,
          retryAfterSeconds: phoneLimit.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const lookup = await findRegisteredByPhone(rawPhone, role);
    if (!lookup) {
      return NextResponse.json({ error: 'Number Not registered' }, { status: 404 });
    }

    if (role === 'vendor') {
      if (lookup.account.status === 'rejected') {
        return NextResponse.json(
          { error: 'Your vendor account was rejected. Contact support.' },
          { status: 403 }
        );
      }

      if (lookup.account.status === 'suspended') {
        return NextResponse.json({ error: 'Your vendor account is suspended' }, { status: 403 });
      }
    }

    if (role === 'doctor' && !lookup.account.isApproved) {
      return NextResponse.json(
        {
          error: 'Your doctor account is pending admin approval. Please wait for approval before logging in.',
          pendingApproval: true,
        },
        { status: 403 }
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

    lookup.account.password = hashPassword(newPassword);
    await lookup.account.save();

    await PhoneOtp.deleteMany({ phone: normalizedPhone, role, consumed: false });

    return NextResponse.json(
      { message: 'Password reset successful. Please login with your new password.' },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to reset password';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
