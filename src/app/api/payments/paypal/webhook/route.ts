import { NextRequest, NextResponse } from 'next/server';
import { getPaypalAccessToken, getPaypalBaseUrl, getPaypalConfig } from '@/lib/paypal';

export async function POST(request: NextRequest) {
  try {
    const cfg = getPaypalConfig();

    if (!cfg.configured || !cfg.webhookId) {
      return NextResponse.json(
        { error: 'PayPal webhook is not configured' },
        { status: 500 }
      );
    }

    const rawBody = await request.text();
    const eventBody = JSON.parse(rawBody || '{}');

    const headers = request.headers;
    const transmissionId = headers.get('paypal-transmission-id');
    const transmissionTime = headers.get('paypal-transmission-time');
    const certUrl = headers.get('paypal-cert-url');
    const authAlgo = headers.get('paypal-auth-algo');
    const transmissionSig = headers.get('paypal-transmission-sig');

    if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
      return NextResponse.json({ error: 'Missing PayPal webhook headers' }, { status: 400 });
    }

    const accessToken = await getPaypalAccessToken();
    const verifyResponse = await fetch(`${getPaypalBaseUrl()}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: cfg.webhookId,
        webhook_event: eventBody,
      }),
      cache: 'no-store',
    });

    const verifyData = await verifyResponse.json();

    if (verifyData?.verification_status !== 'SUCCESS') {
      return NextResponse.json({ error: 'Invalid PayPal webhook signature' }, { status: 400 });
    }

    return NextResponse.json({ success: true, eventType: eventBody?.event_type || 'unknown' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'PayPal webhook processing failed' },
      { status: 500 }
    );
  }
}
