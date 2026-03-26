import { NextRequest, NextResponse } from 'next/server';
import { isTokenValid } from '@/lib/tokenUtils';

interface AdminRequest extends NextRequest {
  adminEmail?: string;
  isAdminTokenValid?: boolean;
}

/**
 * Middleware to validate admin token expiration
 * Extract expiresAt from request headers and validate
 */
export async function validateAdminToken(request: NextRequest): Promise<{ isValid: boolean; error?: string; expiresAt?: number }> {
  try {
    // Get token and expiresAt from request headers or body
    const authHeader = request.headers.get('authorization');
    const expiresAtHeader = request.headers.get('x-token-expires-at');
    const adminEmailHeader = request.headers.get('x-admin-email');

    if (!authHeader || !expiresAtHeader || !adminEmailHeader) {
      return {
        isValid: false,
        error: 'Missing authentication headers. Please login again.',
      };
    }

    const expiresAt = parseInt(expiresAtHeader, 10);

    if (isNaN(expiresAt)) {
      return {
        isValid: false,
        error: 'Invalid token expiration time',
      };
    }

    const isValid = isTokenValid(expiresAt);

    if (!isValid) {
      return {
        isValid: false,
        error: 'Your session has expired. Please login again.',
        expiresAt,
      };
    }

    return {
      isValid: true,
      expiresAt,
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Token validation failed',
    };
  }
}

/**
 * Higher-order function to protect admin routes with token expiration check
 */
export function withAdminTokenValidation(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const validation = await validateAdminToken(request);

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    return handler(request);
  };
}
