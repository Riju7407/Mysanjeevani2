import { NextRequest, NextResponse } from 'next/server';
import { RtcRole, RtcTokenBuilder } from 'agora-token';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const channelName = String(body?.channelName || '').trim();
    const participantType = String(body?.participantType || '').trim();

    if (!channelName) {
      return NextResponse.json({ error: 'channelName is required' }, { status: 400 });
    }

    if (!['patient', 'doctor'].includes(participantType)) {
      return NextResponse.json({ error: 'participantType must be patient or doctor' }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(channelName)) {
      return NextResponse.json({ error: 'Invalid channel name format' }, { status: 400 });
    }

    const appId = process.env.AGORA_APP_ID || process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      return NextResponse.json(
        { error: 'Agora credentials are not configured on server' },
        { status: 500 }
      );
    }

    const uid = Math.floor(Math.random() * 1000000000) + 1;
    const expirationSeconds = 60 * 60;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiresAt = currentTimestamp + expirationSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiresAt,
      privilegeExpiresAt
    );

    return NextResponse.json(
      {
        appId,
        token,
        uid,
        expiresIn: expirationSeconds,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to generate Agora token' },
      { status: 500 }
    );
  }
}
