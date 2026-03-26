import crypto from 'crypto';

interface TokenPayload {
  token: string;
  email: string;
  expiresAt: number;
  createdAt: number;
}

const FIVE_DAYS_IN_MS = 5 * 24 * 60 * 60 * 1000; // 5 days in milliseconds

/**
 * Generate a new admin token with 5-day expiration
 */
export function generateAdminToken(email: string): TokenPayload {
  const token = crypto.randomUUID();
  const createdAt = Date.now();
  const expiresAt = createdAt + FIVE_DAYS_IN_MS;

  return {
    token,
    email,
    expiresAt,
    createdAt,
  };
}

/**
 * Validate if admin token is still valid (not expired)
 */
export function isTokenValid(expiresAt: number): boolean {
  return Date.now() < expiresAt;
}

/**
 * Get token expiration date
 */
export function getTokenExpirationDate(expiresAt: number): Date {
  return new Date(expiresAt);
}

/**
 * Get remaining time until token expires (in milliseconds)
 */
export function getTokenRemainingTime(expiresAt: number): number {
  const remaining = expiresAt - Date.now();
  return remaining > 0 ? remaining : 0;
}

/**
 * Get remaining time in human-readable format
 */
export function getTokenRemainingTimeReadable(expiresAt: number): string {
  const remaining = getTokenRemainingTime(expiresAt);
  
  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}, ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
}
