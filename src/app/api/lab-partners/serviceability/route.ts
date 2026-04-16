import { NextRequest, NextResponse } from 'next/server';
import { detectProviderFromTestId, fetchPartnerPincodeServiceability } from '@/lib/labPartners';

export async function GET(request: NextRequest) {
  try {
    const testId = String(request.nextUrl.searchParams.get('testId') || '').trim();
    const pincode = String(request.nextUrl.searchParams.get('pincode') || '').trim();

    if (!testId || !pincode) {
      return NextResponse.json(
        { error: 'testId and pincode are required' },
        { status: 400 }
      );
    }

    const provider = detectProviderFromTestId(testId);
    if (provider === 'local') {
      return NextResponse.json({
        provider,
        pincode,
        isServiceable: true,
        serviceTypes: ['LOCAL'],
      });
    }

    const result = await fetchPartnerPincodeServiceability(provider, pincode);
    return NextResponse.json({
      provider,
      ...result,
    });
  } catch (error) {
    console.error('Lab partner serviceability check error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to check serviceability',
      },
      { status: 500 }
    );
  }
}
