import NodeCache from 'node-cache';
import { isIndiaCountry, normalizeCountryCode } from './countryPreference';

// Cache for exchange rates (1 hour TTL)
const exchangeRateCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

export interface CurrencyConversionResult {
  originalPrice: number;
  convertedPrice: number;
  currency: 'INR' | 'USD';
  exchangeRate: number;
  symbol: '₹' | '$';
}

export interface UserLocation {
  country: string;
  isIndia: boolean;
}

/**
 * Check if IP is a reserved/private IP address
 */
function isReservedIP(ip: string): boolean {
  const reservedRanges = [
    /^127\./,                    // Loopback
    /^192\.168\./,              // Private
    /^10\./,                     // Private
    /^172\.(1[6-9]|2[0-9]|3[01])\./, // Private
    /^::1$/,                      // IPv6 loopback
    /^fc00:/,                     // IPv6 private
  ];
  
  return reservedRanges.some(range => range.test(ip));
}

/**
 * Detect user's country using IP address
 * Falls back to header-based detection and defaults to non-India for development
 */
export async function detectUserCountry(ip?: string, acceptLanguage?: string, preferredCountry?: string): Promise<UserLocation> {
  try {
    if (preferredCountry) {
      return {
        country: normalizeCountryCode(preferredCountry) === 'IN' ? 'India' : 'Outside India',
        isIndia: isIndiaCountry(preferredCountry),
      };
    }

    // If IP is provided and not reserved, try geolocation
    if (ip && !isReservedIP(ip)) {
      try {
        // Use ipapi.co for IP geolocation
        const response = await fetch(`http://ipapi.co/${ip}/json/`, {
          headers: {
            'User-Agent': 'MySanjeevani/1.0'
          }
        });

        if (response.ok) {
          const data = await response.json();

          if (!data.error && data.country_code) {
            const isIndia = data.country_code === 'IN' || data.country === 'India';
            return {
              country: data.country || 'Unknown',
              isIndia
            };
          }
        }
      } catch (geoError) {
        // Geolocation failed, continue to fallback
      }
    }

    // Fallback: Check Accept-Language header for country hints
    if (acceptLanguage) {
      const languageLower = acceptLanguage.toLowerCase();
      if (languageLower.includes('hi') || languageLower.includes('ta') || languageLower.includes('te')) {
        return { country: 'IN', isIndia: true };
      }
    }

    // Default: Assume non-India for localhost and other development scenarios
    // This ensures proper USD pricing for testing
    return { country: 'US', isIndia: false };
  } catch (error) {
    console.error('Error detecting user country:', error);
    // Fallback to non-India to show USD prices
    return { country: 'US', isIndia: false };
  }
}

/**
 * Get current INR to USD exchange rate
 */
export async function getExchangeRate(): Promise<number> {
  try {
    // Check cache first
    const cached = exchangeRateCache.get<number>('INR_USD');
    if (cached) {
      return cached;
    }

    // Use exchangerate-api.com for free exchange rates
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/INR', {
      headers: {
        'User-Agent': 'MySanjeevani/1.0'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate');
    }

    const data = await response.json();
    const rate = data.rates?.USD;

    if (!rate || typeof rate !== 'number') {
      throw new Error('Invalid exchange rate data');
    }

    // Cache the rate
    exchangeRateCache.set('INR_USD', rate);

    return rate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    // Fallback rate (approximate current rate)
    return 0.012;
  }
}

/**
 * Convert price based on user location
 */
export async function convertPrice(
  inrPrice: number,
  userLocation?: UserLocation
): Promise<CurrencyConversionResult> {
  try {
    // If user is in India, return INR price
    if (userLocation?.isIndia) {
      return {
        originalPrice: inrPrice,
        convertedPrice: inrPrice,
        currency: 'INR',
        exchangeRate: 1,
        symbol: '₹'
      };
    }

    // Get exchange rate
    const exchangeRate = await getExchangeRate();
    const usdPrice = inrPrice * exchangeRate;

    // Round to 2 decimal places
    const roundedUsdPrice = Math.round(usdPrice * 100) / 100;

    return {
      originalPrice: inrPrice,
      convertedPrice: roundedUsdPrice,
      currency: 'USD',
      exchangeRate,
      symbol: '$'
    };
  } catch (error) {
    console.error('Error converting price:', error);
    // Fallback: return USD price (better to show USD than INR for unknown users)
    const fallbackRate = 0.012;
    const usdPrice = inrPrice * fallbackRate;
    const roundedUsdPrice = Math.round(usdPrice * 100) / 100;
    return {
      originalPrice: inrPrice,
      convertedPrice: roundedUsdPrice,
      currency: 'USD',
      exchangeRate: fallbackRate,
      symbol: '$'
    };
  }
}

/**
 * Format price with currency symbol
 */
export function formatPrice(price: number, symbol: '₹' | '$'): string {
  if (symbol === '₹') {
    return `₹${price.toLocaleString('en-IN')}`;
  } else {
    return `$${price.toFixed(2)}`;
  }
}

/**
 * Get currency info for display
 */
export function getCurrencyInfo(currency: 'INR' | 'USD'): { symbol: '₹' | '$'; code: string } {
  return currency === 'INR'
    ? { symbol: '₹', code: 'INR' }
    : { symbol: '$', code: 'USD' };
}