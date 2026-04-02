import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface JWTPayload {
  userId: string;
  email?: string;
  phone: string;
  role: 'user' | 'vendor' | 'doctor' | 'admin';
  isVerified: boolean;
  iat?: number;
  exp?: number;
}

interface SessionToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

const ACCESS_TOKEN_EXPIRY = '24h'; // 24 hours
const REFRESH_TOKEN_EXPIRY = '30d'; // 30 days

function getJwtSecret(type: 'access' | 'refresh' = 'access'): string {
  const secret = type === 'refresh' ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(`${type.toUpperCase()}_JWT_SECRET is not configured`);
  }

  return secret;
}

/**
 * Create JWT access and refresh tokens for a user
 */
export function createSessionTokens(payload: Omit<JWTPayload, 'iat' | 'exp'>): SessionToken {
  const accessSecret = getJwtSecret('access');
  const refreshSecret = getJwtSecret('refresh');

  const accessToken = jwt.sign(payload, accessSecret, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    algorithm: 'HS256',
  });

  const refreshToken = jwt.sign(
    {
      userId: payload.userId,
      phone: payload.phone,
      role: payload.role,
      type: 'refresh',
    },
    refreshSecret,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      algorithm: 'HS256',
    }
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: 24 * 60 * 60, // 24 hours in seconds
    refreshExpiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
  };
}

/**
 * Verify JWT access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  const secret = getJwtSecret('access');

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    });

    return decoded as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

/**
 * Verify JWT refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
  const secret = getJwtSecret('refresh');

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    });

    return decoded as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Refresh access token using refresh token
 */
export function refreshAccessToken(refreshToken: string): SessionToken {
  const payload = verifyRefreshToken(refreshToken);

  return {
    accessToken: jwt.sign(
      {
        userId: payload.userId,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
        isVerified: payload.isVerified,
      },
      getJwtSecret('access'),
      {
        expiresIn: ACCESS_TOKEN_EXPIRY,
        algorithm: 'HS256',
      }
    ),
    refreshToken,
    expiresIn: 24 * 60 * 60,
    refreshExpiresIn: 30 * 24 * 60 * 60,
  };
}

/**
 * Generate a secure session ID
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Extract token from Authorization header
 */
export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Create authorization header value
 */
export function createAuthorizationHeader(token: string): string {
  return `Bearer ${token}`;
}
