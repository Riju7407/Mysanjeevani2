import NodeCache from 'node-cache';

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
 * Detect user's country using IP address
 */
export async function detectUserCountry(ip?: string): Promise<UserLocation> {
  try {
    // If no IP provided, try to get from request headers
    if (!ip) {
      // In a real implementation, you'd get this from the request
      // For now, we'll use a fallback
      return { country: 'IN', isIndia: true };
    }

    // Use ipapi.co for IP geolocation
    const response = await fetch(`http://ipapi.co/${ip}/json/`, {
      headers: {
        'User-Agent': 'MySanjeevani/1.0'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch location data');
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.reason || 'Location detection failed');
    }

    const isIndia = data.country_code === 'IN' || data.country === 'India';

    return {
      country: data.country || 'Unknown',
      isIndia
    };
  } catch (error) {
    console.error('Error detecting user country:', error);
    // Fallback to India for safety
    return { country: 'IN', isIndia: true };
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
    // Fallback: return INR price
    return {
      originalPrice: inrPrice,
      convertedPrice: inrPrice,
      currency: 'INR',
      exchangeRate: 1,
      symbol: '₹'
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