import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/lib/models/Product';
import { detectUserCountry, convertPrice } from '@/lib/currencyUtils';
import { getCountryFromCookieHeader, isIndiaCountry } from '@/lib/countryPreference';

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

    // Add category filtering
    if (category) {
      query.$or.push({ category: category });
      query.$or.push({ categories: { $in: [category] } });
    }
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

    // Get user location for currency conversion
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               '127.0.0.1';
    const acceptLanguage = request.headers.get('accept-language') || '';
    const preferredCountry = request.cookies.get('preferredCountry')?.value || getCountryFromCookieHeader(request.headers.get('cookie'));
    const userLocation = await detectUserCountry(ip as string, acceptLanguage, preferredCountry);

    // Convert prices for all products
    const productsWithConvertedPrices = await Promise.all(
      products.map(async (product) => {
        const productObj = product.toObject();
        const inIndia = userLocation.isIndia || isIndiaCountry(preferredCountry);
        const usdPrice = typeof productObj.usdPrice === 'number' ? productObj.usdPrice : undefined;
        const conversion = inIndia
          ? {
              convertedPrice: productObj.price,
              currency: 'INR' as const,
              symbol: '₹' as const,
              exchangeRate: 1,
            }
          : usdPrice !== undefined
            ? {
                convertedPrice: usdPrice,
                currency: 'USD' as const,
                symbol: '$' as const,
                exchangeRate: 1,
              }
            : await convertPrice(productObj.price, userLocation);

        const displayMrp = inIndia || productObj.mrp === undefined || productObj.mrp === null
          ? productObj.mrp
          : Math.round(productObj.mrp * conversion.exchangeRate * 100) / 100;

        return {
          ...productObj,
          displayCurrency: conversion.currency,
          displayPrice: conversion.convertedPrice,
          currency: conversion.currency,
          currencySymbol: conversion.symbol,
          displayMrp,
          originalPrice: productObj.price,
          exchangeRate: conversion.exchangeRate,
        };
      })
    );

    return NextResponse.json(
      {
        message: 'Products fetched successfully',
        products: productsWithConvertedPrices,
        userLocation,
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
      usdPrice,
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
      popularSection,
      productType,
      potency,
      quantity,
      quantityUnit,
    } = body;

    const normalizedPotency = typeof potency === 'string' ? (potency.trim() || undefined) : potency;
    const normalizedQuantityUnit =
      typeof quantityUnit === 'string' ? (quantityUnit.trim() || 'None') : (quantityUnit || 'None');
    const normalizedProductType =
      typeof productType === 'string' ? (productType.trim() || undefined) : productType;
    const normalizedPopularSection =
      typeof popularSection === 'string' && ['None', 'Generic', 'Ayurveda', 'Homeopathy', 'LabTests'].includes(popularSection)
        ? popularSection
        : body.isPopularGeneric
          ? 'Generic'
          : body.isPopularAyurveda
            ? 'Ayurveda'
            : body.isPopularHomeopathy
              ? 'Homeopathy'
              : body.isPopularLabTests
                ? 'LabTests'
                : body.isPopular
                  ? 'Generic'
                  : 'None';
    const isPopularSectionSelected = normalizedPopularSection !== 'None';

    if (!name || !price || !category || usdPrice === undefined || usdPrice === null || isNaN(Number(usdPrice))) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields' },
        { status: 400 }
      );
    }

    const product = await Product.create({
      name,
      description,
      price,
      usdPrice: Number(usdPrice),
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
      popularSection: normalizedPopularSection,
      isPopular: isPopular !== undefined ? isPopular : isPopularSectionSelected,
      isPopularGeneric: normalizedPopularSection === 'Generic',
      isPopularAyurveda: normalizedPopularSection === 'Ayurveda',
      isPopularHomeopathy: normalizedPopularSection === 'Homeopathy',
      isPopularLabTests: normalizedPopularSection === 'LabTests',
      productType: normalizedProductType || 'Generic Medicine',
      potency: normalizedPotency,
      quantity,
      quantityUnit: normalizedQuantityUnit,
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
