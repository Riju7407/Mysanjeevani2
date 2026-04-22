import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { CategoryNode } from '@/lib/models/CategoryNode';
import { getCategoryConfig, getCategoryTree } from '@/lib/categoryConfig';
import {
  FALLBACK_DISEASE_SUBCATEGORY_MAP,
  FALLBACK_SUBCATEGORY_MAP_BY_TYPE,
  FALLBACK_VENDOR_CATEGORY_MAP,
} from '@/lib/categoryDefaults';

async function ensureDefaultCategoryTree() {
  const count = await CategoryNode.countDocuments({});
  if (count > 0) return;

  const productRoot = await CategoryNode.create({
    name: 'Product Types',
    parentId: null,
    sortOrder: 0,
    isActive: true,
  });

  const diseaseRoot = await CategoryNode.create({
    name: 'Disease Categories',
    parentId: null,
    sortOrder: 1,
    isActive: true,
  });

  for (const [typeName, categories] of Object.entries(FALLBACK_VENDOR_CATEGORY_MAP)) {
    const typeNode = await CategoryNode.create({
      name: typeName,
      parentId: productRoot._id,
      sortOrder: 0,
      isActive: true,
    });

    for (const categoryName of categories) {
      const categoryNode = await CategoryNode.create({
        name: categoryName,
        parentId: typeNode._id,
        sortOrder: 0,
        isActive: true,
      });

      const subMap = FALLBACK_SUBCATEGORY_MAP_BY_TYPE[typeName as keyof typeof FALLBACK_SUBCATEGORY_MAP_BY_TYPE];
      const subcategories = subMap?.[categoryName as keyof typeof subMap] as string[] | undefined;
      if (!subcategories || subcategories.length === 0) continue;

      await CategoryNode.insertMany(
        subcategories.map((name) => ({
          name,
          parentId: categoryNode._id,
          sortOrder: 0,
          isActive: true,
        }))
      );
    }
  }

  for (const [diseaseCategory, diseaseSubcategories] of Object.entries(FALLBACK_DISEASE_SUBCATEGORY_MAP)) {
    const diseaseCategoryNode = await CategoryNode.create({
      name: diseaseCategory,
      parentId: diseaseRoot._id,
      sortOrder: 0,
      isActive: true,
    });

    await CategoryNode.insertMany(
      diseaseSubcategories.map((name) => ({
        name,
        parentId: diseaseCategoryNode._id,
        sortOrder: 0,
        isActive: true,
      }))
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await ensureDefaultCategoryTree();

    const mode = request.nextUrl.searchParams.get('mode');
    if (mode === 'config') {
      const config = await getCategoryConfig();
      return NextResponse.json({ success: true, config });
    }

    const tree = await getCategoryTree();
    return NextResponse.json({ success: true, tree });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const name = String(body?.name || '').trim();
    const parentId = body?.parentId ? String(body.parentId) : null;
    const sortOrder = Number(body?.sortOrder || 0);

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    if (parentId) {
      const parent = await CategoryNode.findById(parentId);
      if (!parent) {
        return NextResponse.json(
          { success: false, error: 'Parent category not found' },
          { status: 404 }
        );
      }
    }

    const created = await CategoryNode.create({ name, parentId, sortOrder, isActive: true });

    return NextResponse.json({ success: true, category: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create category' },
      { status: 500 }
    );
  }
}
