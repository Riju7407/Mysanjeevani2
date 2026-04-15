import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/lib/models/Product';
import { fetchPartnerCatalog } from '@/lib/labPartners';

function normalizePartnerId(value: string) {
  const text = String(value || '').trim();
  if (!text) return '';
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (id.startsWith('thyrocare_') || id.startsWith('healthians_')) {
      const partnerTests = await fetchPartnerCatalog({ limit: 1000 });
      const normalizedIncomingId = normalizePartnerId(id);
      const partnerTest = partnerTests.find((test) => {
        const normalizedCatalogId = normalizePartnerId(test._id);
        return (
          test._id === id ||
          normalizedCatalogId === normalizedIncomingId
        );
      });

      if (!partnerTest) {
        return NextResponse.json(
          { error: 'Lab test not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          message: 'Lab test fetched successfully',
          test: partnerTest,
        },
        { status: 200 }
      );
    }

    const test = await Product.findById(id);

    if (!test) {
      return NextResponse.json(
        { error: 'Lab test not found' },
        { status: 404 }
      );
    }

    if (test.productType !== 'Lab Tests' || !test.isActive) {
      return NextResponse.json(
        { error: 'Lab test not available' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'Lab test fetched successfully',
        test,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get lab test error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
