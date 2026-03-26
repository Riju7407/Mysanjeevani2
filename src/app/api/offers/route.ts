import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Offer } from '@/lib/models/Offer';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const query: any = { isActive: true };
    const now = new Date();
    query.validFrom = { $lte: now };
    query.validUntil = { $gte: now };

    const offers = await Offer.find(query).sort({ discountValue: -1 });

    return NextResponse.json(
      {
        message: 'Offers fetched successfully',
        offers,
        total: offers.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get offers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      code,
      description,
      discountType,
      discountValue,
      minCartValue,
      validFrom,
      validUntil,
      usageLimit,
    } = body;

    if (!code || !discountType || !discountValue || !validFrom || !validUntil) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const offer = await Offer.create({
      code,
      description,
      discountType,
      discountValue,
      minCartValue,
      validFrom,
      validUntil,
      usageLimit,
      isActive: true,
    });

    return NextResponse.json(
      {
        message: 'Offer created successfully',
        offer,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create offer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const code = request.nextUrl.searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Coupon code is required' },
        { status: 400 }
      );
    }

    const offer = await Offer.findOne({ code });

    if (!offer) {
      return NextResponse.json(
        { error: 'Coupon code not found' },
        { status: 404 }
      );
    }

    if (!offer.isActive) {
      return NextResponse.json(
        { error: 'Coupon code is inactive' },
        { status: 400 }
      );
    }

    const now = new Date();
    if (offer.validFrom > now || offer.validUntil < now) {
      return NextResponse.json(
        { error: 'Coupon code has expired' },
        { status: 400 }
      );
    }

    if (offer.usageLimit && offer.usedCount >= offer.usageLimit) {
      return NextResponse.json(
        { error: 'Coupon usage limit exceeded' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: 'Coupon code is valid',
        offer: {
          code: offer.code,
          discountType: offer.discountType,
          discountValue: offer.discountValue,
          minCartValue: offer.minCartValue,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Validate offer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
