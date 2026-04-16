import { NextRequest, NextResponse } from 'next/server';
import { detectProviderFromTestId, fetchPartnerSlots } from '@/lib/labPartners';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const testId = String(body?.testId || '').trim();
    const testName = String(body?.testName || '').trim();
    const appointmentDate = String(body?.appointmentDate || '').trim();
    const pincode = String(body?.pincode || '').trim();

    if (!testId || !testName || !appointmentDate || !pincode) {
      return NextResponse.json(
        {
          error:
            'testId, testName, appointmentDate and pincode are required',
        },
        { status: 400 }
      );
    }

    const provider = detectProviderFromTestId(testId);
    if (provider === 'local') {
      return NextResponse.json({
        provider,
        timeZone: '+5:30 Asia/Kolkata',
        appointmentDate,
        slots: [],
      });
    }

    const slotData = await fetchPartnerSlots(provider, {
      testId,
      testName,
      appointmentDate,
      pincode,
      patientName: body?.patientName
        ? String(body.patientName)
        : undefined,
      patientAge: Number.isFinite(Number(body?.patientAge))
        ? Number(body.patientAge)
        : undefined,
      patientGender:
        body?.patientGender === 'MALE' ||
        body?.patientGender === 'FEMALE' ||
        body?.patientGender === 'OTHER'
          ? body.patientGender
          : undefined,
    });

    return NextResponse.json({
      provider,
      ...slotData,
    });
  } catch (error) {
    console.error('Lab partner slot search error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch slots',
      },
      { status: 500 }
    );
  }
}
