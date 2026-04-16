import { randomUUID } from 'crypto';
import type {
  ExternalLabTest,
  LabPartnerAdapter,
  PartnerBookingInput,
  PartnerCreateOrderResult,
  PartnerPincodeServiceability,
  PartnerSlot,
  PartnerStatusResult,
} from './types';

type ThyrocareCatalogItem = {
  id?: string;
  name?: string;
  type?: string;
  testsIncluded?: Array<{ name?: string }>;
  rate?: {
    listingPrice?: string;
    sellingPrice?: string;
  };
  flags?: {
    isFastingRequired?: boolean;
    isHomeCollectible?: boolean;
  };
};

type ThyrocareOrderDetails = {
  status?: string;
  patients?: Array<{ id?: string; isReportAvailable?: boolean }>;
};

type ThyrocarePincodesResponse = {
  serviceTypes?: Array<{
    type?: string;
    pincodes?: number[];
  }>;
};

type ThyrocareSlotsResponse = {
  timeZone?: string;
  appointmentDate?: string;
  slots?: Array<{
    id?: string | number;
    startTime?: string;
    endTime?: string;
  }>;
};

const DEFAULT_BASE_URL = 'https://api-sandbox.thyrocare.com';

let cachedToken: { token: string; expiresAt: number } | null = null;
let cachedPincodes: { expiresAt: number; data: ThyrocarePincodesResponse } | null = null;

function readConfig() {
  const username = process.env.THYROCARE_USERNAME || '';
  const password = process.env.THYROCARE_PASSWORD || '';
  const partnerId = process.env.THYROCARE_PARTNER_ID || '';

  return {
    baseUrl: (process.env.THYROCARE_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, ''),
    username,
    password,
    partnerId,
    clientType: process.env.THYROCARE_CLIENT_TYPE || 'web',
    userAgent: process.env.THYROCARE_USER_AGENT || 'MySanjeevni/1.0',
    entityType: process.env.THYROCARE_ENTITY_TYPE || 'DSA',
    apiVersion: process.env.THYROCARE_API_VERSION || 'v1',
  };
}

function formatIndiaPhone(phone?: string) {
  const digits = String(phone || '').replace(/\D/g, '');
  const tenDigits = digits.length > 10 ? digits.slice(-10) : digits;
  if (tenDigits.length !== 10) return '+91-9999999999';
  return `+91-${tenDigits}`;
}

function parseTimeStart(collectionTime?: string) {
  const text = String(collectionTime || '').trim();
  const twentyFourHourMatch = text.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHourMatch) {
    const hour = Number(twentyFourHourMatch[1]);
    const minute = Number(twentyFourHourMatch[2]);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
  }

  const match = text.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return '09:00';

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridian = match[3].toUpperCase();

  if (meridian === 'PM' && hour < 12) hour += 12;
  if (meridian === 'AM' && hour === 12) hour = 0;

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function formatSlotLabel(startTime: string, endTime: string) {
  const to12Hour = (value: string) => {
    const parts = value.split(':');
    if (parts.length !== 2) return value;

    const hour = Number(parts[0]);
    const minute = Number(parts[1]);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;

    const meridian = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${String(minute).padStart(2, '0')} ${meridian}`;
  };

  return `${to12Hour(startTime)} - ${to12Hour(endTime)}`;
}

function toCategory(item: ThyrocareCatalogItem) {
  const text = `${item.name || ''} ${item.testsIncluded?.map((t) => t.name || '').join(' ')}`.toLowerCase();
  if (text.includes('thyroid')) return 'thyroid';
  if (text.includes('diabetes') || text.includes('hba1c') || text.includes('sugar')) return 'diabetic';
  if (text.includes('lipid') || text.includes('cardio') || text.includes('heart')) return 'cardiac';
  if (text.includes('liver') || text.includes('lft')) return 'liver';
  if (text.includes('kidney') || text.includes('kft') || text.includes('renal')) return 'kidney';
  if (text.includes('vitamin')) return 'vitamin';
  if (text.includes('cbc') || text.includes('blood')) return 'general';
  return 'general';
}

function toPartnerTest(item: ThyrocareCatalogItem): ExternalLabTest | null {
  const id = String(item.id || '').trim();
  const name = String(item.name || '').trim();
  if (!id || !name) return null;

  const mrp = Number(item.rate?.listingPrice || 0);
  const price = Number(item.rate?.sellingPrice || mrp || 0);
  const type = String(item.type || 'SSKU');

  return {
    _id: `thyrocare_${encodeURIComponent(id)}_${encodeURIComponent(type)}`,
    name,
    description: `Partner test by Thyrocare${item.flags?.isFastingRequired ? ' • Fasting may be required' : ''}`,
    price: Number.isFinite(price) ? price : 0,
    mrp: Number.isFinite(mrp) ? mrp : undefined,
    category: toCategory(item),
    icon: '🧪',
    rating: 4.6,
    reviews: 0,
    productType: 'Lab Tests',
    isActive: true,
    provider: 'thyrocare',
    providerMeta: {
      providerTestId: id,
      providerType: type,
      isHomeCollectible: item.flags?.isHomeCollectible ?? true,
      fastingRequired: item.flags?.isFastingRequired ?? false,
    },
  };
}

async function parseJsonOrThrow(res: Response) {
  const rawText = await res.text().catch(() => '');
  let body: any = {};
  if (rawText) {
    try {
      body = JSON.parse(rawText);
    } catch {
      body = {};
    }
  }
  if (!res.ok) {
    const message =
      (body as any)?.errors?.[0]?.message ||
      (body as any)?.message ||
      rawText ||
      `Thyrocare request failed (${res.status})`;
    throw new Error(message);
  }
  return body as any;
}

function normalizePartnerGender(gender?: 'MALE' | 'FEMALE' | 'OTHER') {
  if (gender === 'MALE' || gender === 'FEMALE') return gender;
  return 'MALE';
}

async function getToken(forceRefresh = false) {
  if (!forceRefresh && cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const cfg = readConfig();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Partner-Id': cfg.partnerId,
    'Request-Id': randomUUID(),
    'User-Agent': cfg.userAgent,
    'Client-Type': cfg.clientType,
    'Entity-Type': cfg.entityType,
    'API-Version': cfg.apiVersion,
  };

  const res = await fetch(`${cfg.baseUrl}/partners/v1/auth/login`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      username: cfg.username,
      password: cfg.password,
    }),
    cache: 'no-store',
  });

  const data = await parseJsonOrThrow(res);
  const token = String(data.token || '');
  if (!token) {
    throw new Error('Thyrocare login did not return a token');
  }

  cachedToken = {
    token,
    // Token validity is not explicitly returned; keep a conservative 20-minute cache.
    expiresAt: Date.now() + 20 * 60 * 1000,
  };

  return token;
}

async function callThyrocare(path: string, init: RequestInit = {}, retry = true) {
  const cfg = readConfig();
  const token = await getToken(false);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Partner-Id': cfg.partnerId,
    'Request-Id': randomUUID(),
    'User-Agent': cfg.userAgent,
    'Client-Type': cfg.clientType,
    'API-Version': cfg.apiVersion,
    Authorization: `Bearer ${token}`,
    ...(init.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${cfg.baseUrl}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (retry && res.status === 401) {
    await getToken(true);
    return callThyrocare(path, init, false);
  }

  return parseJsonOrThrow(res);
}

function parseThyrocareTestId(testId: string) {
  if (!testId.startsWith('thyrocare_')) {
    throw new Error('Invalid Thyrocare test ID');
  }

  const parts = testId.split('_');
  if (parts.length < 3) {
    throw new Error('Invalid Thyrocare test ID format');
  }

  const providerTestId = decodeURIComponent(parts[1]);
  const providerType = decodeURIComponent(parts.slice(2).join('_')) || 'SSKU';
  return { providerTestId, providerType };
}

async function fetchReportUrl(orderId: string, leadId: string) {
  try {
    const data = await callThyrocare(`/partners/v1/${encodeURIComponent(orderId)}/reports/${encodeURIComponent(leadId)}?type=pdf`);
    return String(data.reportUrl || '');
  } catch {
    return '';
  }
}

async function getPincodeData() {
  if (cachedPincodes && cachedPincodes.expiresAt > Date.now()) {
    return cachedPincodes.data;
  }

  const data = (await callThyrocare('/partners/v1/serviceability/pincodes')) as ThyrocarePincodesResponse;
  cachedPincodes = {
    data,
    // The docs recommend caching this response for 24h.
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };

  return data;
}

function normalizePincode(value: string) {
  return String(value || '').replace(/\D/g, '').slice(0, 6);
}

function extractServiceability(data: ThyrocarePincodesResponse, pincode: string): PartnerPincodeServiceability {
  const cleanPincode = normalizePincode(pincode);
  const serviceTypes = Array.isArray(data.serviceTypes) ? data.serviceTypes : [];

  const matchingTypes = serviceTypes
    .filter((entry) => Array.isArray(entry.pincodes) && entry.pincodes.some((code) => String(code) === cleanPincode))
    .map((entry) => String(entry.type || '').trim())
    .filter(Boolean);

  return {
    pincode: cleanPincode,
    isServiceable: matchingTypes.length > 0,
    serviceTypes: matchingTypes,
  };
}

async function searchSlotsForBooking(input: {
  testId: string;
  testName: string;
  appointmentDate: string;
  pincode: string;
  patientName?: string;
  patientAge?: number;
  patientGender?: 'MALE' | 'FEMALE' | 'OTHER';
}) {
  const { providerTestId, providerType } = parseThyrocareTestId(input.testId);
  const cleanPincode = normalizePincode(input.pincode);
  const appointmentDate = String(input.appointmentDate || '').slice(0, 10);
  const patientName = input.patientName || 'Patient';
  const patientGender = normalizePartnerGender(input.patientGender);
  const patientAge = input.patientAge ?? 30;

  const requestBodies = [
    {
      appointmentDate,
      pincode: Number(cleanPincode),
      patients: [
        {
          name: patientName,
          gender: patientGender,
          age: patientAge,
          ageType: 'YEAR',
          items: [
            {
              id: providerTestId,
              type: providerType,
              name: input.testName || providerTestId,
            },
          ],
        },
      ],
    },
    {
      appointmentDate,
      pincode: cleanPincode,
      patients: [
        {
          name: patientName,
          gender: patientGender,
          age: patientAge,
          ageType: 'YEARS',
          items: [
            {
              id: providerTestId,
              type: providerType,
              name: input.testName || providerTestId,
            },
          ],
        },
      ],
    },
  ];

  let data: ThyrocareSlotsResponse | null = null;
  let lastError: unknown = null;

  for (const payload of requestBodies) {
    try {
      data = (await callThyrocare('/partners/v1/slots/search', {
        method: 'POST',
        body: JSON.stringify(payload),
      })) as ThyrocareSlotsResponse;
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!data) {
    throw (lastError instanceof Error
      ? lastError
      : new Error('Unable to fetch Thyrocare slots'));
  }

  const slots: PartnerSlot[] = (Array.isArray(data.slots) ? data.slots : [])
    .map((slot) => {
      const id = String(slot.id ?? '').trim();
      const startTime = String(slot.startTime || '').trim();
      const endTime = String(slot.endTime || '').trim();
      if (!id || !startTime || !endTime) return null;

      return {
        id,
        startTime,
        endTime,
        label: formatSlotLabel(startTime, endTime),
      };
    })
    .filter((slot): slot is PartnerSlot => Boolean(slot));

  return {
    timeZone: data.timeZone,
    appointmentDate: data.appointmentDate,
    slots,
  };
}

export const thyrocareAdapter: LabPartnerAdapter = {
  provider: 'thyrocare',

  isConfigured() {
    const cfg = readConfig();
    return Boolean(cfg.username && cfg.password && cfg.partnerId);
  },

  async fetchCatalog(params) {
    if (!this.isConfigured()) return [];

    const page = Math.max(1, params?.page || 1);
    const pageSize = Math.max(10, Math.min(100, params?.limit || 30));

    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      minPrice: '0',
      maxPrice: '100000',
    });

    const data = await callThyrocare(`/partners/v1/catalog/products?${query.toString()}`);
    const skuList: ThyrocareCatalogItem[] = Array.isArray(data.skuList) ? data.skuList : [];

    const all = skuList.map(toPartnerTest).filter((t): t is ExternalLabTest => Boolean(t));
    const category = String(params?.category || '').trim().toLowerCase();
    const search = String(params?.search || '').trim().toLowerCase();

    return all.filter((item) => {
      const byCategory = !category || category === 'all' || item.category === category;
      const bySearch = !search || item.name.toLowerCase().includes(search) || (item.description || '').toLowerCase().includes(search);
      return byCategory && bySearch;
    });
  },

  async createOrder(input: PartnerBookingInput): Promise<PartnerCreateOrderResult> {
    if (!this.isConfigured()) {
      throw new Error('Thyrocare is not configured');
    }

    const { providerTestId, providerType } = parseThyrocareTestId(input.testId);
    const collectionDate = input.collectionDate || new Date().toISOString().slice(0, 10);
    const normalizedPincode = normalizePincode(input.patientPincode || '');
    const pincode = Number(normalizedPincode || '110001');

    if (normalizedPincode) {
      const serviceability = extractServiceability(await getPincodeData(), normalizedPincode);
      if (!serviceability.isServiceable) {
        throw new Error(`Thyrocare service is not available for pincode ${normalizedPincode}`);
      }
    }

    if (normalizedPincode) {
      const slotSearch = await searchSlotsForBooking({
        testId: input.testId,
        testName: input.testName,
        appointmentDate: collectionDate,
        pincode: normalizedPincode,
        patientName: input.user.fullName,
        patientAge: input.patientAge,
        patientGender: input.patientGender,
      });

      if (!slotSearch.slots.length) {
        throw new Error('No Thyrocare collection slots are available for the selected date and pincode');
      }

      const selectedTime = parseTimeStart(input.collectionTime);
      const selectedSlot = slotSearch.slots.find((slot) => slot.startTime === selectedTime);

      if (!selectedSlot) {
        throw new Error('Selected collection slot is not available with Thyrocare. Please choose an available slot.');
      }
    }

    const payload = {
      address: {
        houseNo: '',
        street: input.address || 'Address',
        addressLine1: input.address || 'Address Line 1',
        addressLine2: 'N/A',
        landmark: '',
        city: 'NA',
        state: 'NA',
        country: 'India',
        pincode,
      },
      email: input.user.email || 'user@example.com',
      contactNumber: formatIndiaPhone(input.user.phone),
      appointment: {
        date: collectionDate,
        startTime: parseTimeStart(input.collectionTime),
        timeZone: 'IST',
      },
      origin: {
        platform: 'DSA-PARTNER',
        appId: 'MySanjeevni',
        portalType: 'B2C',
        enteredBy: input.user.fullName || 'MySanjeevni User',
        source: 'B2C MIDDLEWARE API',
      },
      referredBy: {
        doctorId: '',
        doctorName: '',
      },
      paymentDetails: {
        payType: 'PREPAID',
      },
      attributes: {
        remarks: input.notes || '',
        phleboNotes: input.notes || '',
        campId: null,
        isReportHardCopyRequired: false,
        refOrderNo: `MSJ-${Date.now()}`,
        collectionType: 'HOME_COLLECTION',
        alertMessage: [],
      },
      config: {
        communication: {
          shareReport: true,
          shareReceipt: true,
          shareModes: {
            whatsapp: true,
            email: true,
          },
        },
      },
      patients: [
        {
          name: input.user.fullName || 'Patient',
          gender: input.patientGender || 'MALE',
          age: input.patientAge ?? 30,
          ageType: 'YEAR',
          contactNumber: formatIndiaPhone(input.user.phone),
          email: input.user.email || 'user@example.com',
          attributes: {
            ulcUniqueCode: '',
            patientAddress: input.address || '',
            externalPatientId: input.user.id,
          },
          items: [
            {
              id: providerTestId,
              type: providerType,
              name: input.testName,
              origin: {
                enteredBy: input.user.fullName || 'MySanjeevni User',
                platform: 'web',
              },
            },
          ],
          documents: [],
        },
      ],
      price: {
        discounts: [],
        incentivePasson: {
          type: 'FLAT',
          value: '0',
        },
      },
      orderOptions: {
        isPdpcOrder: false,
      },
    };

    const data = await callThyrocare('/partners/v1/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const providerOrderId = String(data.orderId || data.orderNo || data.orderID || '');
    if (!providerOrderId) {
      throw new Error('Thyrocare create order did not return order ID');
    }

    return {
      providerOrderId,
      providerStatus: 'ORDER_PLACED',
      raw: data,
    };
  },

  async getOrderStatus(orderId: string, leadId?: string): Promise<PartnerStatusResult> {
    if (!this.isConfigured()) {
      throw new Error('Thyrocare is not configured');
    }

    const details = (await callThyrocare(`/partners/v1/orders/${encodeURIComponent(orderId)}?include=tracking,price,items`)) as ThyrocareOrderDetails;
    const resolvedLeadId = leadId || details.patients?.[0]?.id || '';
    const reportReady = Boolean(details.patients?.some((p) => p.isReportAvailable));

    let reportUrl = '';
    if (reportReady && resolvedLeadId) {
      reportUrl = await fetchReportUrl(orderId, resolvedLeadId);
    }

    return {
      providerStatus: details.status || 'ORDER_PLACED',
      reportReady,
      reportUrl,
      providerLeadId: resolvedLeadId || undefined,
      raw: details,
    };
  },

  async checkPincodeServiceability(pincode: string): Promise<PartnerPincodeServiceability> {
    if (!this.isConfigured()) {
      throw new Error('Thyrocare is not configured');
    }

    const cleanPincode = normalizePincode(pincode);
    if (cleanPincode.length !== 6) {
      throw new Error('Please provide a valid 6-digit pincode');
    }

    const data = await getPincodeData();
    return extractServiceability(data, cleanPincode);
  },

  async searchSlots(input): Promise<{ timeZone?: string; appointmentDate?: string; slots: PartnerSlot[] }> {
    if (!this.isConfigured()) {
      throw new Error('Thyrocare is not configured');
    }

    const cleanPincode = normalizePincode(input.pincode);
    if (cleanPincode.length !== 6) {
      throw new Error('Please provide a valid 6-digit pincode');
    }

    const serviceability = extractServiceability(await getPincodeData(), cleanPincode);
    if (!serviceability.isServiceable) {
      return {
        timeZone: '+5:30 Asia/Kolkata',
        appointmentDate: input.appointmentDate,
        slots: [],
      };
    }

    return searchSlotsForBooking({
      testId: input.testId,
      testName: input.testName,
      appointmentDate: input.appointmentDate,
      pincode: cleanPincode,
      patientName: input.patientName,
      patientAge: input.patientAge,
      patientGender: input.patientGender,
    });
  },

  async cancelOrder(orderId: string, reason?: { reasonKey?: string; reasonText?: string }) {
    if (!this.isConfigured()) {
      throw new Error('Thyrocare is not configured');
    }

    const data = await callThyrocare(`/partners/v1/orders/${encodeURIComponent(orderId)}/cancel`, {
      method: 'DELETE',
      body: JSON.stringify({
        reasonKey: reason?.reasonKey || 'OTHER',
        reasonText: reason?.reasonText || 'Cancelled by MySanjeevni user',
      }),
    });

    return {
      message: String(data.message || 'Order cancelled successfully'),
      raw: data,
    };
  },
};
