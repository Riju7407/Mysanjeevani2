import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { CategoryNode } from '@/lib/models/CategoryNode';

type Params = {
  params: Promise<{ id: string }>;
};

async function collectDescendantIds(rootId: string): Promise<string[]> {
  const all = await CategoryNode.find({}, { _id: 1, parentId: 1 }).lean();
  const byParent = new Map<string, string[]>();

  for (const node of all) {
    if (!node.parentId) continue;
    const parent = String(node.parentId);
    const children = byParent.get(parent) || [];
    children.push(String(node._id));
    byParent.set(parent, children);
  }

  const stack = [rootId];
  const result = new Set<string>([rootId]);

  while (stack.length > 0) {
    const current = stack.pop() as string;
    const children = byParent.get(current) || [];
    for (const childId of children) {
      if (!result.has(childId)) {
        result.add(childId);
        stack.push(childId);
      }
    }
  }

  return Array.from(result);
}

export async function PUT(request: NextRequest, context: Params) {
  try {
    await connectDB();
    const { id } = await context.params;
    const body = await request.json();

    const updates: Record<string, any> = {};
    if (typeof body?.name === 'string') updates.name = body.name.trim();
    if (typeof body?.sortOrder !== 'undefined') updates.sortOrder = Number(body.sortOrder || 0);
    if (typeof body?.isActive === 'boolean') updates.isActive = body.isActive;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid update fields provided' },
        { status: 400 }
      );
    }

    const updated = await CategoryNode.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, category: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(_: NextRequest, context: Params) {
  try {
    await connectDB();
    const { id } = await context.params;

    const existing = await CategoryNode.findById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    const idsToDelete = await collectDescendantIds(id);
    await CategoryNode.deleteMany({ _id: { $in: idsToDelete } });

    return NextResponse.json({ success: true, deletedCount: idsToDelete.length });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete category' },
      { status: 500 }
    );
  }
}
