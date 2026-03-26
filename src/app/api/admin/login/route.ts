import { NextRequest, NextResponse } from 'next/server';
import { generateAdminToken } from '@/lib/tokenUtils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Check if environment variables are set
    if (!adminEmail || !adminPassword) {
      console.error('Admin credentials not configured in environment variables');
      return NextResponse.json(
        { error: 'Admin login is not configured' },
        { status: 500 }
      );
    }

    // Validate admin credentials
    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate admin token with 5-day expiration
    const tokenPayload = generateAdminToken(adminEmail);

    // Return success response
    return NextResponse.json(
      {
        message: 'Admin login successful',
        user: {
          email: adminEmail,
          role: 'admin',
          isAdmin: true,
        },
        token: tokenPayload.token,
        expiresAt: tokenPayload.expiresAt,
        expiresIn: '5 days',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Admin login error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
