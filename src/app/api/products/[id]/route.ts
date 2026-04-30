import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Product } from '@/lib/models/Product';
import { detectUserCountry, convertPrice } from '@/lib/currencyUtils';
import { getCountryFromCookieHeader, isIndiaCountry } from '@/lib/countryPreference';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
    }

    const product = await Product.findOne({
      _id: id,
      isActive: true,
      $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }],
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const ip = _request.headers.get('x-forwarded-for') || _request.headers.get('x-real-ip') || '127.0.0.1';
    const acceptLanguage = _request.headers.get('accept-language') || '';
    const preferredCountry = _request.cookies.get('preferredCountry')?.value || getCountryFromCookieHeader(_request.headers.get('cookie'));
    const userLocation = await detectUserCountry(ip as string, acceptLanguage, preferredCountry);
    const inIndia = userLocation.isIndia || isIndiaCountry(preferredCountry);
    const productObj = product.toObject();
    const usdPrice = typeof productObj.usdPrice === 'number' ? productObj.usdPrice : undefined;
    const conversion = inIndia
      ? { convertedPrice: productObj.price, currency: 'INR' as const, symbol: '₹' as const, exchangeRate: 1 }
      : usdPrice !== undefined
        ? { convertedPrice: usdPrice, currency: 'USD' as const, symbol: '$' as const, exchangeRate: 1 }
        : await convertPrice(productObj.price, userLocation);

    return NextResponse.json({
      product: {
        ...productObj,
        displayPrice: conversion.convertedPrice,
        displayCurrency: conversion.currency,
        currency: conversion.currency,
        currencySymbol: conversion.symbol,
        displayMrp: inIndia || productObj.mrp === undefined || productObj.mrp === null
          ? productObj.mrp
          : Math.round(productObj.mrp * conversion.exchangeRate * 100) / 100,
        originalPrice: productObj.price,
        exchangeRate: conversion.exchangeRate,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Get product by id error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
