import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { WellnessPillar } from '@/lib/models/WellnessPillar';
import { validateAdminToken } from '@/lib/adminAuthMiddleware';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const tokenValidation = await validateAdminToken(req);
  if (!tokenValidation.isValid) {
    return NextResponse.json(
      { success: false, error: tokenValidation.error || 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    await connectDB();
    const { id } = await context.params;
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

    const updated = await WellnessPillar.findByIdAndUpdate(
      id,
      {
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
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update wellness pillar' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const tokenValidation = await validateAdminToken(req);
  if (!tokenValidation.isValid) {
    return NextResponse.json(
      { success: false, error: tokenValidation.error || 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    await connectDB();
    const { id } = await context.params;
    const deleted = await WellnessPillar.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Deleted' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete wellness pillar' },
      { status: 500 }
    );
  }
}
