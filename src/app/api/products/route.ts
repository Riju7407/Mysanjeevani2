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
    const subcategory = request.nextUrl.searchParams.get('subcategory');
    const brand = request.nextUrl.searchParams.get('brand');
    const diseaseCategory = request.nextUrl.searchParams.get('diseaseCategory');
    const diseaseSubcategory = request.nextUrl.searchParams.get('diseaseSubcategory');
    const quantity = request.nextUrl.searchParams.get('quantity');
    const name = request.nextUrl.searchParams.get('name');
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

    const query: any = {
      isActive: true,
      $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }],
    };

    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (brand) query.brand = { $regex: brand, $options: 'i' };
    if (productType) query.productType = productType;
    if (potency) query.potency = potency;
    if (quantityUnit) query.quantityUnit = quantityUnit;
    if (quantity) {
      const parsedQuantity = Number(quantity);
      if (!Number.isNaN(parsedQuantity)) query.quantity = parsedQuantity;
    }
    if (diseaseCategory) query.diseaseCategory = diseaseCategory;
    if (diseaseSubcategory) query.diseaseSubcategory = diseaseSubcategory;
    if (name) query.name = name;
    if (search) {
      const parsedSearchQuantity = Number(search);
      const searchOr: any[] = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { subcategory: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { potency: { $regex: search, $options: 'i' } },
        { quantityUnit: { $regex: search, $options: 'i' } },
        { diseaseCategory: { $regex: search, $options: 'i' } },
        { diseaseSubcategory: { $regex: search, $options: 'i' } },
      ];
      if (!Number.isNaN(parsedSearchQuantity)) {
        searchOr.push({ quantity: parsedSearchQuantity });
      }
      query.$or = [
        ...searchOr,
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
      safetyInformation,
      specifications,
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
      safetyInformation,
      specifications,
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
