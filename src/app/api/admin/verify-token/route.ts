import { NextRequest, NextResponse } from 'next/server';
import { isTokenValid, getTokenRemainingTimeReadable } from '@/lib/tokenUtils';

/**
 * Verify Admin Token Endpoint
 * POST /api/admin/verify-token
 * 
 * Validates if the admin token is still active and returns remaining time
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { expiresAt } = body;

    if (!expiresAt) {
      return NextResponse.json(
        { error: 'Token expiration time is required' },
        { status: 400 }
      );
    }

    const isValid = isTokenValid(expiresAt);

    if (!isValid) {
      return NextResponse.json(
        {
          valid: false,
          message: 'Your session has expired. Please login again.',
          expired: true,
        },
        { status: 401 }
      );
    }

    const remainingTime = getTokenRemainingTimeReadable(expiresAt);

    return NextResponse.json(
      {
        valid: true,
        message: 'Your session is still active',
        expiresAt,
        remainingTime,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Token verification error:', error.message);
    return NextResponse.json(
      { error: 'Token verification failed' },
      { status: 500 }
    );
  }
}
