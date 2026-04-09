import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/lib/models/Product';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const category = request.nextUrl.searchParams.get('category');
    const search = request.nextUrl.searchParams.get('search');
    const healthConcern = request.nextUrl.searchParams.get('healthConcern');
    const productType = request.nextUrl.searchParams.get('productType');
    const potency = request.nextUrl.searchParams.get('potency');
    const quantityUnit = request.nextUrl.searchParams.get('quantityUnit');
    const name = request.nextUrl.searchParams.get('name');
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

    const query: any = {
      isActive: true,
      $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }],
    };

    if (category) query.category = category;
    if (productType) query.productType = productType;
    if (potency) query.potency = potency;
    if (quantityUnit) query.quantityUnit = quantityUnit;
    if (name) query.name = name;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (healthConcern) {
      query.healthConcerns = { $in: [healthConcern] };
    }

    const products = await Product.find(query)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    return NextResponse.json(
      {
        message: 'Products fetched successfully',
        products,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get products error:', error);
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
      name,
      description,
      price,
      discount,
      category,
      brand,
      manufacturer,
      stock,
      healthConcerns,
      dosage,
      packaging,
      requiresPrescription,
      image,
      icon,
      mrp,
      benefit,
      isActive,
      isPopular,
      productType,
      potency,
      quantity,
      quantityUnit,
    } = body;

    if (!name || !price || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const product = await Product.create({
      name,
      description,
      price,
      discount,
      category,
      brand,
      manufacturer,
      stock,
      healthConcerns,
      dosage,
      packaging,
      requiresPrescription,
      image,
      icon,
      mrp,
      benefit,
      isActive: isActive !== undefined ? isActive : true,
      isPopular: isPopular !== undefined ? isPopular : false,
      productType: productType || 'Generic Medicine',
      potency,
      quantity,
      quantityUnit,
    });

    return NextResponse.json(
      {
        message: 'Product created successfully',
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
