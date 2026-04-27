'use client';

import { useState, useEffect } from 'react';

export interface CurrencyInfo {
  displayPrice: number;
  currency: 'INR' | 'USD';
  currencySymbol: '₹' | '$';
  originalPrice: number;
  exchangeRate: number;
}

export interface UserLocation {
  country: string;
  isIndia: boolean;
}

export function useCurrency() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectLocation = async () => {
      try {
        // Try to get location from currency API
        const response = await fetch('/api/currency?price=1');
        const data = await response.json();

        if (data.success) {
          setUserLocation(data.data.userLocation);
        } else {
          // Fallback to India
          setUserLocation({ country: 'IN', isIndia: true });
        }
      } catch (error) {
        console.error('Failed to detect user location:', error);
        // Fallback to India
        setUserLocation({ country: 'IN', isIndia: true });
      } finally {
        setLoading(false);
      }
    };

    detectLocation();
  }, []);

  const convertPrice = async (inrPrice: number): Promise<CurrencyInfo> => {
    try {
      const response = await fetch(`/api/currency?price=${inrPrice}`);
      const data = await response.json();

      if (data.success) {
        return {
          displayPrice: data.data.convertedPrice,
          currency: data.data.currency,
          currencySymbol: data.data.symbol,
          originalPrice: data.data.originalPrice,
          exchangeRate: data.data.exchangeRate,
        };
      } else {
        // Fallback
        return {
          displayPrice: inrPrice,
          currency: 'INR',
          currencySymbol: '₹',
          originalPrice: inrPrice,
          exchangeRate: 1,
        };
      }
    } catch (error) {
      console.error('Failed to convert price:', error);
      // Fallback
      return {
        displayPrice: inrPrice,
        currency: 'INR',
        currencySymbol: '₹',
        originalPrice: inrPrice,
        exchangeRate: 1,
      };
    }
  };

  const convertMultiplePrices = async (inrPrices: number[]): Promise<CurrencyInfo[]> => {
    try {
      const response = await fetch('/api/currency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prices: inrPrices }),
      });
      const data = await response.json();

      if (data.success) {
        return data.data.conversions.map((conversion: any) => ({
          displayPrice: conversion.convertedPrice,
          currency: conversion.currency,
          currencySymbol: conversion.symbol,
          originalPrice: conversion.originalPrice,
          exchangeRate: conversion.exchangeRate,
        }));
      } else {
        // Fallback
        return inrPrices.map(price => ({
          displayPrice: price,
          currency: 'INR' as const,
          currencySymbol: '₹' as const,
          originalPrice: price,
          exchangeRate: 1,
        }));
      }
    } catch (error) {
      console.error('Failed to convert prices:', error);
      // Fallback
      return inrPrices.map(price => ({
        displayPrice: price,
        currency: 'INR' as const,
        currencySymbol: '₹' as const,
        originalPrice: price,
        exchangeRate: 1,
      }));
    }
  };

  const formatPrice = (price: number, symbol: '₹' | '$'): string => {
    if (symbol === '₹') {
      return `₹${price.toLocaleString('en-IN')}`;
    } else {
      return `$${price.toFixed(2)}`;
    }
  };

  return {
    userLocation,
    loading,
    convertPrice,
    convertMultiplePrices,
    formatPrice,
    isIndia: userLocation?.isIndia ?? true, // Default to India
  };
}