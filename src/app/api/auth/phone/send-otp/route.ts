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
import { sendOtpViaFast2Sms } from '@/lib/fast2sms';
import { consumeRateLimit, getClientIp } from '@/lib/rateLimit';

const OTP_TTL_MS = Math.max(10, Number(process.env.OTP_TTL_SECONDS || '300')) * 1000;
const RESEND_COOLDOWN_SECONDS = Math.max(30, Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || '60'));

function hashOtp(phone: string, otp: string): string {
  return crypto
    .createHash('sha256')
    .update(`${phone}:${otp}:${process.env.OTP_HASH_SECRET || 'MySanjeevni-phone-otp'}`)
    .digest('hex');
}

function generateOtp(): string {
  if (process.env.OTP_TEST_MODE === 'true') {
    return '123456';
  }

  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawPhone = String(body?.phone || '').trim();
    const role = normalizeRole(String(body?.role || 'user')) as PhoneLoginRole;

    const normalizedPhone = normalizePhone(rawPhone);

    if (normalizedPhone.length < 10) {
      return NextResponse.json({ error: 'Valid phone number is required' }, { status: 400 });
    }

    await connectDB();

    const clientIp = getClientIp(request);

    const ipLimit = await consumeRateLimit('phone-send-otp-ip', clientIp, 20, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many OTP requests from this IP. Try again in ${ipLimit.retryAfterSeconds}s.`,
          retryAfterSeconds: ipLimit.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const phoneLimit = await consumeRateLimit(
      'phone-send-otp-phone',
      `${role}:${normalizedPhone}`,
      5,
      15 * 60 * 1000
    );
    if (!phoneLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many OTP requests for this number. Try again in ${phoneLimit.retryAfterSeconds}s.`,
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

    const lastOtp = await PhoneOtp.findOne({ phone: normalizedPhone, role }).sort({ createdAt: -1 });
    if (lastOtp?.createdAt) {
      const elapsedSeconds = Math.floor((Date.now() - lastOtp.createdAt.getTime()) / 1000);
      const remaining = RESEND_COOLDOWN_SECONDS - elapsedSeconds;

      if (remaining > 0) {
        return NextResponse.json(
          {
            error: `Please wait ${remaining} seconds before requesting a new OTP.`,
            retryAfterSeconds: remaining,
          },
          { status: 429 }
        );
      }
    }

    const otp = generateOtp();
    const otpHash = hashOtp(normalizedPhone, otp);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await PhoneOtp.deleteMany({ phone: normalizedPhone, role, consumed: false });
    await PhoneOtp.create({
      phone: normalizedPhone,
      role,
      otpHash,
      expiresAt,
      consumed: false,
    });

    await sendOtpViaFast2Sms(normalizedPhone, otp, 'login');

    return NextResponse.json(
      {
        message: 'OTP sent successfully',
        phone: normalizedPhone,
        cooldownSeconds: RESEND_COOLDOWN_SECONDS,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
