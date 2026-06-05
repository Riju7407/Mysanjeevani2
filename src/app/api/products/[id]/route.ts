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
    const normalizedId = (id || '').trim();
    const isNumericId = /^\d+$/.test(normalizedId);
    const numericId = isNumericId ? Number(normalizedId) : NaN;
    const isObjectId = mongoose.Types.ObjectId.isValid(normalizedId);

    if (!isNumericId && !isObjectId) {
      console.warn(`[API] Invalid product id format: ${normalizedId}`);
      return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
    }

    try {
      console.log(`[API] Fetching product with id: ${normalizedId}, isNumeric: ${isNumericId}, isObjectId: ${isObjectId}`);
      
      const query: any = {
        isActive: true,
        $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }],
      };
      
      // Use numeric ID if available, otherwise use string ID
      if (isNumericId) {
        query._id = numericId;
      } else if (isObjectId) {
        query._id = normalizedId;
      } else {
        // Fallback: try both numeric and string
        query.$or.push({ _id: numericId }, { _id: normalizedId });
      }

      console.log(`[API] Query filter:`, JSON.stringify(query));

      // Fetch product without populate to avoid schema registration issues
      const product = await Product.findOne(query).lean();

      if (!product) {
        console.warn(`[API] Product not found for id: ${normalizedId}`);
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      // Don't populate vendor - just check if vendorId exists and is valid
      // Vendor population can cause schema registration errors in API routes
      console.log(`[API] Product found: ${product._id}, vendorId: ${product.vendorId}`);

      const ip = _request.headers.get('x-forwarded-for') || _request.headers.get('x-real-ip') || '127.0.0.1';
      const acceptLanguage = _request.headers.get('accept-language') || '';
      const preferredCountry = _request.cookies.get('preferredCountry')?.value || getCountryFromCookieHeader(_request.headers.get('cookie'));
      
      console.log(`[API] Location detection - IP: ${ip}, preferredCountry: ${preferredCountry}`);
      
      let userLocation: any = { isIndia: isIndiaCountry(preferredCountry) };
      try {
        userLocation = await detectUserCountry(ip as string, acceptLanguage, preferredCountry);
        console.log(`[API] User location detected:`, userLocation);
      } catch (locationError) {
        console.warn('[API] Failed to detect user country:', locationError);
        userLocation = { isIndia: isIndiaCountry(preferredCountry) };
      }

      const inIndia = userLocation.isIndia || isIndiaCountry(preferredCountry);
      const productObj = product;
      const usdPrice = typeof productObj.usdPrice === 'number' ? productObj.usdPrice : undefined;
      
      console.log(`[API] Product pricing - INR: ${productObj.price}, USD: ${usdPrice}, inIndia: ${inIndia}`);
      
      let conversion = { convertedPrice: productObj.price || 0, currency: 'INR' as const, symbol: '₹' as const, exchangeRate: 1 };
      
      try {
        conversion = inIndia
          ? { convertedPrice: productObj.price || 0, currency: 'INR' as const, symbol: '₹' as const, exchangeRate: 1 }
          : usdPrice !== undefined
            ? { convertedPrice: usdPrice, currency: 'USD' as const, symbol: '$' as const, exchangeRate: 1 }
            : await convertPrice(productObj.price || 0, userLocation);
        console.log(`[API] Conversion result:`, conversion);
      } catch (conversionError) {
        console.warn('[API] Failed to convert price:', conversionError);
        conversion = { convertedPrice: productObj.price || 0, currency: 'INR' as const, symbol: '₹' as const, exchangeRate: 1 };
      }

      const responseProduct = {
        ...productObj,
        displayPrice: conversion.convertedPrice,
        displayCurrency: conversion.currency,
        currency: conversion.currency,
        currencySymbol: conversion.symbol,
        displayMrp: inIndia || productObj.mrp === undefined || productObj.mrp === null
          ? productObj.mrp
          : Math.round((productObj.mrp || 0) * conversion.exchangeRate * 100) / 100,
        originalPrice: productObj.price || 0,
        exchangeRate: conversion.exchangeRate,
      };

      console.log(`[API] Success - returning product ${normalizedId}`);
      return NextResponse.json({ product: responseProduct }, { status: 200 });
    } catch (dbError) {
      console.error('[API] Database error in get product by id:', dbError);
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error';
      return NextResponse.json({ error: `Failed to fetch product: ${errorMessage}` }, { status: 500 });
    }
  } catch (error) {
    console.error('[API] Get product by id error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Internal server error: ${errorMessage}` }, { status: 500 });
  }
}
