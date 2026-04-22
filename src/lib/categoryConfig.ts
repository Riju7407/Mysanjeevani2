import { CategoryNode } from '@/lib/models/CategoryNode';
import {
  FALLBACK_DISEASE_SUBCATEGORY_MAP,
  FALLBACK_LAB_CATEGORIES,
  FALLBACK_SUBCATEGORY_MAP_BY_TYPE,
  FALLBACK_VENDOR_CATEGORY_MAP,
} from '@/lib/categoryDefaults';

type NodeDoc = {
  _id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type CategoryConfig = {
  vendorCategoryMap: Record<string, string[]>;
  subcategoryMapByType: Record<string, Record<string, string[]>>;
  diseaseSubcategoryMap: Record<string, string[]>;
  labCategories: string[];
};

function normalizeDocs(raw: any[]): NodeDoc[] {
  return raw.map((item) => ({
    _id: String(item._id),
    name: String(item.name || '').trim(),
    parentId: item.parentId ? String(item.parentId) : null,
    sortOrder: Number(item.sortOrder || 0),
    isActive: item.isActive !== false,
  }));
}

function sortByOrderThenName(a: NodeDoc, b: NodeDoc): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return a.name.localeCompare(b.name);
}

function findFirstByName(nodes: NodeDoc[], name: string): NodeDoc | undefined {
  const target = name.toLowerCase();
  return nodes.find((node) => node.name.toLowerCase() === target);
}

function getChildren(nodes: NodeDoc[], parentId: string | null): NodeDoc[] {
  return nodes.filter((node) => node.parentId === parentId && node.isActive).sort(sortByOrderThenName);
}

function toChildNameList(nodes: NodeDoc[], parentId: string | null): string[] {
  return getChildren(nodes, parentId)
    .map((node) => node.name)
    .filter(Boolean);
}

function buildFromNodes(nodes: NodeDoc[]): CategoryConfig {
  const vendorCategoryMap: Record<string, string[]> = {};
  const subcategoryMapByType: Record<string, Record<string, string[]>> = {};

  const productRoot = findFirstByName(nodes, 'Product Types');
  const diseaseRoot = findFirstByName(nodes, 'Disease Categories');

  // Get root-level nodes (those with parentId === null)
  const rootLevelNodes = getChildren(nodes, null);

  // If "Product Types" root exists, use its children as product types
  if (productRoot) {
    const productTypeNodes = getChildren(nodes, productRoot._id);
    for (const productType of productTypeNodes) {
      const categories = toChildNameList(nodes, productType._id);
      vendorCategoryMap[productType.name] = categories;

      const subMap: Record<string, string[]> = {};
      for (const categoryNode of getChildren(nodes, productType._id)) {
        const subcategories = toChildNameList(nodes, categoryNode._id);
        if (subcategories.length > 0) {
          subMap[categoryNode.name] = subcategories;
        }
      }
      if (Object.keys(subMap).length > 0) {
        subcategoryMapByType[productType.name] = subMap;
      }
    }
  } else {
    // If no "Product Types" root, treat other root-level categories as product types
    for (const rootNode of rootLevelNodes) {
      if (rootNode.name === 'Disease Categories') continue; // Skip disease root

      const children = getChildren(nodes, rootNode._id);
      if (children.length > 0) {
        // This root node is a product type with categories as children
        vendorCategoryMap[rootNode.name] = children.map((c) => c.name);

        const subMap: Record<string, string[]> = {};
        for (const categoryNode of children) {
          const subcategories = toChildNameList(nodes, categoryNode._id);
          if (subcategories.length > 0) {
            subMap[categoryNode.name] = subcategories;
          }
        }
        if (Object.keys(subMap).length > 0) {
          subcategoryMapByType[rootNode.name] = subMap;
        }
      }
    }
  }

  const diseaseMap: Record<string, string[]> = {};
  if (diseaseRoot) {
    for (const diseaseCategoryNode of getChildren(nodes, diseaseRoot._id)) {
      diseaseMap[diseaseCategoryNode.name] = toChildNameList(nodes, diseaseCategoryNode._id);
    }
  } else {
    // If no "Disease Categories" root, check if any root-level node is for diseases
    // (Skip this for now - only use if explicitly marked as Disease Categories)
  }

  const labCategories = vendorCategoryMap['Lab Tests'] || [];

  return {
    vendorCategoryMap,
    subcategoryMapByType,
    diseaseSubcategoryMap: diseaseMap,
    labCategories,
  };
}

export async function getCategoryConfig(): Promise<CategoryConfig> {
  const raw = await CategoryNode.find({}).lean();
  const docs = normalizeDocs(raw);
  const dynamic = buildFromNodes(docs);

  const hasDynamic = Object.keys(dynamic.vendorCategoryMap).length > 0;
  if (!hasDynamic) {
    return {
      vendorCategoryMap: { ...FALLBACK_VENDOR_CATEGORY_MAP } as unknown as Record<string, string[]>,
      subcategoryMapByType: { ...FALLBACK_SUBCATEGORY_MAP_BY_TYPE } as unknown as Record<string, Record<string, string[]>>,
      diseaseSubcategoryMap: { ...FALLBACK_DISEASE_SUBCATEGORY_MAP } as unknown as Record<string, string[]>,
      labCategories: [...FALLBACK_LAB_CATEGORIES] as unknown as string[],
    };
  }

  return {
    vendorCategoryMap: {
      ...FALLBACK_VENDOR_CATEGORY_MAP,
      ...dynamic.vendorCategoryMap,
    } as unknown as Record<string, string[]>,
    subcategoryMapByType: {
      ...FALLBACK_SUBCATEGORY_MAP_BY_TYPE,
      ...dynamic.subcategoryMapByType,
    } as unknown as Record<string, Record<string, string[]>>,
    diseaseSubcategoryMap:
      Object.keys(dynamic.diseaseSubcategoryMap).length > 0
        ? dynamic.diseaseSubcategoryMap
        : ({ ...FALLBACK_DISEASE_SUBCATEGORY_MAP } as unknown as Record<string, string[]>),
    labCategories:
      dynamic.labCategories.length > 0
        ? dynamic.labCategories
        : ([...FALLBACK_LAB_CATEGORIES] as unknown as string[]),
  };
}

export async function getCategoryTree() {
  const raw = await CategoryNode.find({}).sort({ sortOrder: 1, name: 1 }).lean();
  const docs = normalizeDocs(raw);

  const childrenByParent = new Map<string | null, NodeDoc[]>();
  for (const doc of docs) {
    const bucket = childrenByParent.get(doc.parentId) || [];
    bucket.push(doc);
    childrenByParent.set(doc.parentId, bucket);
  }

  for (const bucket of childrenByParent.values()) {
    bucket.sort(sortByOrderThenName);
  }

  const build = (parentId: string | null): any[] => {
    const children = childrenByParent.get(parentId) || [];
    return children.map((child) => ({
      _id: child._id,
      name: child.name,
      parentId: child.parentId,
      sortOrder: child.sortOrder,
      isActive: child.isActive,
      children: build(child._id),
    }));
  };

  return build(null);
}
