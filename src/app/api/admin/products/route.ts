import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/lib/models/Product';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const vendorId = searchParams.get('vendorId');
    const search = searchParams.get('search');
    const productType = searchParams.get('productType');
    const approvalStatus = searchParams.get('approvalStatus');
    const limit = parseInt(searchParams.get('limit') || '200');

    await connectDB();

    const query: any = {};

    if (category) query.category = category;
    if (vendorId) query.vendorId = vendorId;
    if (productType) query.productType = productType;
    if (approvalStatus) query.approvalStatus = approvalStatus;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { vendorName: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json({ products, total: products.length });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const normalizedPotency =
      typeof body.potency === 'string' ? (body.potency.trim() || undefined) : body.potency;
    const normalizedQuantityUnit =
      typeof body.quantityUnit === 'string'
        ? (body.quantityUnit.trim() || 'None')
        : (body.quantityUnit || 'None');
    const normalizedProductType =
      typeof body.productType === 'string' ? (body.productType.trim() || undefined) : body.productType;
    const normalizedApprovalStatus =
      typeof body.approvalStatus === 'string'
        ? (body.approvalStatus.trim().toLowerCase() || undefined)
        : body.approvalStatus;
    
    if (!body.name || !body.category || body.price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newProduct = await Product.create({
      ...body,
      potency: normalizedPotency,
      quantityUnit: normalizedQuantityUnit,
      productType: normalizedProductType,
      approvalStatus: normalizedApprovalStatus || body.approvalStatus || 'approved',
      safetyInformation: body.safetyInformation || undefined,
      specifications: body.specifications || undefined,
      isActive: body.isActive !== undefined ? body.isActive : true,
      isPopular: body.isPopular !== undefined ? body.isPopular : false,
    });

    return NextResponse.json({ product: newProduct, message: 'Product created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    if (!body._id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const { _id, ...update } = body;
    const normalizedPotency =
      typeof update.potency === 'string' ? (update.potency.trim() || undefined) : update.potency;
    const normalizedQuantityUnit =
      typeof update.quantityUnit === 'string'
        ? (update.quantityUnit.trim() || 'None')
        : (update.quantityUnit || 'None');
    const normalizedProductType =
      typeof update.productType === 'string' ? (update.productType.trim() || undefined) : update.productType;
    const normalizedApprovalStatus =
      typeof update.approvalStatus === 'string'
        ? (update.approvalStatus.trim().toLowerCase() || undefined)
        : update.approvalStatus;
    const updated = await Product.findByIdAndUpdate(
      _id,
      {
        ...update,
        potency: normalizedPotency,
        quantityUnit: normalizedQuantityUnit,
        productType: normalizedProductType,
        approvalStatus: normalizedApprovalStatus,
      },
      { new: true }
    );
    if (!updated) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Product updated successfully', product: updated });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    await Product.findByIdAndDelete(productId);

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
