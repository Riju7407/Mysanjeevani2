import { NextRequest, NextResponse } from 'next/server';
import { detectUserCountry, convertPrice } from '@/lib/currencyUtils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const price = searchParams.get('price');
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               '127.0.0.1';

    if (!price || isNaN(Number(price))) {
      return NextResponse.json(
        { error: 'Valid price parameter is required' },
        { status: 400 }
      );
    }

    const inrPrice = parseFloat(price);
    if (inrPrice < 0) {
      return NextResponse.json(
        { error: 'Price cannot be negative' },
        { status: 400 }
      );
    }

    // Detect user location
    const userLocation = await detectUserCountry(ip as string);

    // Convert price
    const conversion = await convertPrice(inrPrice, userLocation);

    return NextResponse.json({
      success: true,
      data: {
        ...conversion,
        userLocation
      }
    });

  } catch (error) {
    console.error('Currency conversion error:', error);
    return NextResponse.json(
      {
        error: 'Failed to convert currency',
        fallback: {
          originalPrice: parseFloat(request.nextUrl.searchParams.get('price') || '0'),
          convertedPrice: parseFloat(request.nextUrl.searchParams.get('price') || '0'),
          currency: 'INR',
          exchangeRate: 1,
          symbol: '₹'
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prices, ip } = body;

    if (!Array.isArray(prices)) {
      return NextResponse.json(
        { error: 'Prices must be an array' },
        { status: 400 }
      );
    }

    // Detect user location
    const userLocation = await detectUserCountry(ip);

    // Convert all prices
    const conversions = await Promise.all(
      prices.map(async (price: number) => {
        if (typeof price !== 'number' || price < 0) {
          throw new Error('Invalid price in array');
        }
        return await convertPrice(price, userLocation);
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        conversions,
        userLocation
      }
    });

  } catch (error) {
    console.error('Bulk currency conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert currencies' },
      { status: 500 }
    );
  }
}