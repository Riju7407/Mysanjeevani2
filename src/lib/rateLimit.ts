import { NextRequest } from 'next/server';
import { ApiRateLimit } from '@/lib/models/ApiRateLimit';

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export async function consumeRateLimit(
  action: string,
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  const existing = await ApiRateLimit.findOne({ action, key });

  if (!existing || existing.resetAt <= now) {
    await ApiRateLimit.findOneAndUpdate(
      { action, key },
      {
        action,
        key,
        count: 1,
        resetAt,
      },
      { upsert: true, new: true }
    );

    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((existing.resetAt.getTime() - now.getTime()) / 1000)
    );

    return { allowed: false, retryAfterSeconds };
  }

  existing.count += 1;
  await existing.save();

  return { allowed: true, retryAfterSeconds: 0 };
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  return 'unknown';
}
