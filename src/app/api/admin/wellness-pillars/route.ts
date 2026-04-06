import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { WellnessPillar } from '@/lib/models/WellnessPillar';
import { validateAdminToken } from '@/lib/adminAuthMiddleware';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const tokenValidation = await validateAdminToken(req);
  if (!tokenValidation.isValid) {
    return NextResponse.json(
      { success: false, error: tokenValidation.error || 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    await connectDB();
    const pillars = await WellnessPillar.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: pillars }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch wellness pillars' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const tokenValidation = await validateAdminToken(req);
  if (!tokenValidation.isValid) {
    return NextResponse.json(
      { success: false, error: tokenValidation.error || 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    await connectDB();
    const body = await req.json();
    const {
      title,
      desc,
      benefits,
      imageUrl,
      cloudinaryPublicId,
      icon,
      rating,
      reviews,
      price,
      mrp,
      isActive,
    } = body;

    if (!title || !desc || !benefits || price === undefined || price === null) {
      return NextResponse.json(
        { success: false, error: 'Title, description, benefits and price are required' },
        { status: 400 }
      );
    }

    const pillar = await WellnessPillar.create({
      title,
      desc,
      benefits,
      imageUrl,
      cloudinaryPublicId,
      icon: icon || '💚',
      rating: Number(rating ?? 4.5),
      reviews: Number(reviews ?? 0),
      price: Number(price),
      mrp: mrp !== undefined && mrp !== null && mrp !== '' ? Number(mrp) : undefined,
      isActive: Boolean(isActive ?? true),
    });

    return NextResponse.json({ success: true, data: pillar }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create wellness pillar' },
      { status: 500 }
    );
  }
}
