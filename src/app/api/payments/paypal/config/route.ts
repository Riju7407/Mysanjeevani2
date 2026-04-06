import { NextResponse } from 'next/server';
import { getPaypalConfig } from '@/lib/paypal';

export async function GET() {
  const cfg = getPaypalConfig();

  return NextResponse.json({
    configured: cfg.configured,
    clientId: cfg.clientId || '',
    currency: cfg.currency,
    mode: cfg.mode,
  });
}
