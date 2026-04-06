import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { WellnessPillar } from '@/lib/models/WellnessPillar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await connectDB();
    const pillars = await WellnessPillar.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: pillars }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch wellness pillars' },
      { status: 500 }
    );
  }
}
