import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Vendor } from '@/lib/models/Vendor';
import { Doctor } from '@/lib/models/Doctor';

const PHONE_VERIFICATION_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;

function validatePhoneVerificationToken(token: string, phone: string, role: string): boolean {
  try {
    if (!token || !token.includes('.')) return false;

    const [encodedPayload, providedSignature] = token.split('.');
    if (!encodedPayload || !providedSignature) return false;

    const secret = process.env.OTP_HASH_SECRET || 'MySanjeevni-phone-otp';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(encodedPayload)
      .digest('hex');

    if (providedSignature !== expectedSignature) return false;

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (!payload?.phone || !payload?.role || !payload?.verifiedAt) return false;

    if (String(payload.phone) !== String(phone)) return false;
    if (String(payload.role) !== String(role)) return false;

    const verifiedAt = Number(payload.verifiedAt);
    if (!Number.isFinite(verifiedAt)) return false;

    const ageMs = Date.now() - verifiedAt;
    if (ageMs < 0 || ageMs > PHONE_VERIFICATION_TOKEN_MAX_AGE_MS) return false;

    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      fullName,
      phone,
      fullAddress,
      role,
      businessType,
      businessAddress,
      registrationNumber,
      identityDocumentUrl,
      identityDocumentType,
      phoneVerificationToken,
    } = body;

    const normalizedEmail = email?.toLowerCase().trim();
    const normalizedPhone = phone?.toString().replace(/\D/g, '').trim();
    const normalizedFullAddress = fullAddress?.trim();
    const requestedRole = role || 'user';
    const allowedRoles = ['user', 'vendor', 'doctor'];

    if (!allowedRoles.includes(requestedRole)) {
      return NextResponse.json({ error: 'Invalid role selected' }, { status: 400 });
    }

    if (!normalizedEmail || !password || !fullName || !normalizedPhone || !normalizedFullAddress) {
      return NextResponse.json(
        { error: 'Missing required fields. Full name, email, phone, full address and password are required.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      return NextResponse.json({ error: 'Invalid phone number. Please enter a valid 10-digit phone number' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    if (!validatePhoneVerificationToken(String(phoneVerificationToken || ''), normalizedPhone, requestedRole)) {
      return NextResponse.json(
        { error: 'Phone verification required. Please verify OTP before signup.' },
        { status: 401 }
      );
    }

    await connectDB();

    if (requestedRole === 'vendor') {
      const existingVendor = await Vendor.findOne({ email: normalizedEmail });
      if (existingVendor) {
        return NextResponse.json({ error: 'Vendor already exists with this email' }, { status: 409 });
      }

      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

      const newVendor = await Vendor.create({
        vendorName: fullName,
        email: normalizedEmail,
        password: hashedPassword,
        phone: normalizedPhone,
        businessType: businessType || 'other',
        address: businessAddress || { street: normalizedFullAddress },
        status: 'pending',
      });

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

    if (requestedRole === 'doctor') {
      if (!registrationNumber || !registrationNumber.trim()) {
        return NextResponse.json(
          { error: 'Registration number is required for doctor registration' },
          { status: 400 }
        );
      }

      if (!identityDocumentUrl || !identityDocumentUrl.trim()) {
        return NextResponse.json(
          { error: 'Identity document is required for doctor registration' },
          { status: 400 }
        );
      }

      const existingDoctorByEmail = await Doctor.findOne({ email: normalizedEmail });
      if (existingDoctorByEmail) {
        return NextResponse.json({ error: 'Doctor already exists with this email' }, { status: 409 });
      }

      const existingDoctorByReg = await Doctor.findOne({ registrationNumber });
      if (existingDoctorByReg) {
        return NextResponse.json({ error: 'This registration number is already registered' }, { status: 409 });
      }

      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return NextResponse.json({ error: 'User already exists with this email' }, { status: 409 });
      }

      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

      const newUser = await User.create({
        fullName,
        email: normalizedEmail,
        phone: normalizedPhone,
        fullAddress: normalizedFullAddress,
        password: hashedPassword,
        role: 'doctor',
        isVerified: false,
        registrationNumber,
        identityDocument: identityDocumentUrl,
        identityDocumentType: identityDocumentType || 'medical-license',
        isApproved: false,
      });

      const newDoctor = await Doctor.create({
        userId: newUser._id,
        name: fullName,
        email: normalizedEmail,
        phone: normalizedPhone,
        registrationNumber,
        identityDocumentUrl,
        identityDocumentType: identityDocumentType || 'medical-license',
        isApproved: false,
        approvalStatus: 'pending',
      });

      return NextResponse.json(
        {
          message: 'Doctor registration submitted successfully. Awaiting admin approval.',
          pendingApproval: true,
          doctor: {
            id: newDoctor._id,
            userId: newUser._id,
            name: newDoctor.name,
            email: newDoctor.email,
            phone: newDoctor.phone,
            registrationNumber: newDoctor.registrationNumber,
            approvalStatus: newDoctor.approvalStatus,
          },
        },
        { status: 201 }
      );
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists with this email' }, { status: 409 });
    }

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    const newUser = await User.create({
      fullName,
      email: normalizedEmail,
      phone: normalizedPhone,
      fullAddress: normalizedFullAddress,
      password: hashedPassword,
      role: requestedRole,
      isVerified: false,
    });

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: newUser._id,
          email: newUser.email,
          fullName: newUser.fullName,
          phone: newUser.phone,
          fullAddress: newUser.fullAddress,
          role: newUser.role,
          isVerified: newUser.isVerified,
        },
        token: crypto.randomUUID(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error.message);

    if (error?.code === 11000) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
