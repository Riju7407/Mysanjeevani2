import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/lib/models/Product';
import { Vendor } from '@/lib/models/Vendor';

const VENDOR_CATEGORY_MAP = {
  'Generic Medicine': [
    'Antibiotics',
    'Pain Relief',
    'Acidity',
    'Diabetes',
    'Allergy',
    'Heart Care',
    'Vitamins',
    'Cardiac',
    'Supplements',
    'Gastric',
  ],
  'Ayurveda Medicine': [
    'Immunity',
    'Digestion',
    'Stress Relief',
    'Energy',
    'Skin & Hair',
    'Weight Management',
    'Joint & Bone',
    "Women's Health",
    "Men's Health",
  ],
  Homeopathy: [
    'Cold & Flu',
    'Skin',
    'Digestive',
    'Mental Wellness',
    'Joint & Pain',
    "Women's Health",
    'Immunity',
    'Children',
  ],
  'Lab Tests': [
    'General',
    'Diabetes',
    'Cardiac',
    'Thyroid',
    'Liver',
    'Kidney',
    'Vitamins',
    'Infection',
    'Women',
  ],
} as const;

type VendorProductType = keyof typeof VENDOR_CATEGORY_MAP;

function isCloudinaryImageUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return /^https?:\/\/res\.cloudinary\.com\//i.test(url.trim());
}

function inferProductTypeFromCategory(category?: string): VendorProductType | null {
  if (!category) return null;
  const normalized = category.trim().toLowerCase();
  if (normalized === 'generic' || normalized === 'branded') return 'Generic Medicine';
  if (normalized === 'ayurvedic' || normalized === 'ayurveda') return 'Ayurveda Medicine';
  if (normalized === 'homeopathy') return 'Homeopathy';
  if (normalized === 'lab tests' || normalized === 'lab-tests' || normalized === 'labtest') return 'Lab Tests';

  for (const [type, categories] of Object.entries(VENDOR_CATEGORY_MAP)) {
    if ((categories as readonly string[]).includes(category)) {
      return type as VendorProductType;
    }
  }
  return null;
}

function isCategoryValidForType(productType: VendorProductType, category: string): boolean {
  return (VENDOR_CATEGORY_MAP[productType] as readonly string[]).includes(category);
}

function normalizeCategoryForType(productType: VendorProductType, category?: string): string {
  const raw = (category || '').trim();
  const normalized = raw.toLowerCase();

  if (productType === 'Generic Medicine' && (normalized === 'generic' || normalized === 'branded')) {
    return VENDOR_CATEGORY_MAP[productType][0];
  }

  if (productType === 'Ayurveda Medicine' && (normalized === 'ayurvedic' || normalized === 'ayurveda')) {
    return VENDOR_CATEGORY_MAP[productType][0];
  }

  if (productType === 'Homeopathy' && normalized === 'homeopathy') {
    return VENDOR_CATEGORY_MAP[productType][0];
  }

  if (productType === 'Lab Tests' && (normalized === 'lab tests' || normalized === 'lab-tests' || normalized === 'labtest')) {
    return VENDOR_CATEGORY_MAP[productType][0];
  }

  const exactMatch = VENDOR_CATEGORY_MAP[productType].find((c) => c.toLowerCase() === normalized);
  return exactMatch || raw;
}

// GET vendor products
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const vendorId = request.nextUrl.searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID required' },
        { status: 400 }
      );
    }

    const products = await Product.find({ vendorId }).populate('vendorId', 'vendorName rating');

    return NextResponse.json(
      {
        message: 'Products retrieved',
        products,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching products:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST - Add product
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { vendorId, name, description, price, productType, category, stock, image, ...otherFields } = body;

    if (!vendorId || !name || !price || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!isCloudinaryImageUrl(image)) {
      return NextResponse.json(
        { error: 'Please upload image to Cloudinary first' },
        { status: 400 }
      );
    }

    const resolvedType: VendorProductType | null = productType || inferProductTypeFromCategory(category);
    const normalizedCategory = resolvedType ? normalizeCategoryForType(resolvedType, category) : category;
    if (!resolvedType || !isCategoryValidForType(resolvedType, normalizedCategory)) {
      return NextResponse.json(
        {
          error:
            'Invalid product type/category selection. Please select a valid category for the selected product type.',
        },
        { status: 400 }
      );
    }

    // Verify vendor exists and is verified
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    if (vendor.status !== 'verified') {
      return NextResponse.json(
        { error: 'Your vendor account is not verified' },
        { status: 403 }
      );
    }

    // Create product
    const newProduct = await Product.create({
      name,
      description,
      price,
      productType: resolvedType,
      category: normalizedCategory,
      stock,
      image,
      vendorId,
      vendorName: vendor.vendorName,
      vendorRating: vendor.rating,
      approvalStatus: 'pending',
      isActive: false,
      isPopular: false,
      ...otherFields,
    });

    return NextResponse.json(
      {
        message: 'Product submitted for admin approval',
        product: newProduct,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error adding product:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to add product' },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { productId, vendorId, ...updateData } = body;

    if (!productId || !vendorId) {
      return NextResponse.json(
        { error: 'Product ID and Vendor ID required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const product = await Product.findById(productId);
    if (!product || product.vendorId.toString() !== vendorId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const nextCategoryRaw = updateData.category || product.category;
    const nextType: VendorProductType | null =
      updateData.productType ||
      product.productType ||
      inferProductTypeFromCategory(nextCategoryRaw);

    const nextCategory = nextType ? normalizeCategoryForType(nextType, nextCategoryRaw) : nextCategoryRaw;

    if (!nextType || !isCategoryValidForType(nextType, nextCategory)) {
      return NextResponse.json(
        { error: 'Invalid product type/category selection for update' },
        { status: 400 }
      );
    }

    if (Object.prototype.hasOwnProperty.call(updateData, 'image') && updateData.image) {
      if (!isCloudinaryImageUrl(updateData.image)) {
        return NextResponse.json(
          { error: 'Please upload image to Cloudinary first' },
          { status: 400 }
        );
      }
    }

    // Any vendor edit should return item to pending review.
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        ...updateData,
        productType: nextType,
        category: nextCategory,
        approvalStatus: 'pending',
        isActive: false,
        isPopular: false,
        updatedAt: new Date(),
      },
      { new: true }
    );

    return NextResponse.json(
      {
        message: 'Product updated and submitted for admin approval',
        product: updatedProduct,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating product:', error.message);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE - Remove product
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const vendorId = searchParams.get('vendorId');

    if (!productId || !vendorId) {
      return NextResponse.json(
        { error: 'Product ID and Vendor ID required' },
        { status: 400 }
      );
    }

    const product = await Product.findById(productId);
    if (!product || product.vendorId.toString() !== vendorId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await Product.findByIdAndDelete(productId);

    return NextResponse.json(
      { message: 'Product deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting product:', error.message);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
