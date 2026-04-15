import { randomUUID } from 'crypto';
import type {
  ExternalLabTest,
  LabPartnerAdapter,
  PartnerBookingInput,
  PartnerCreateOrderResult,
  PartnerStatusResult,
} from './types';

type UnknownRecord = Record<string, unknown>;

let cachedToken: { token: string; expiresAt: number } | null = null;
let resolvedPaths: {
  authPath: string;
  catalogPath: string;
  createOrderPath: string;
  orderStatusPath: string;
  reportPath: string;
} | null = null;

const DEFAULT_HEALTHIANS_PATHS = {
  authPath: ['/partner/login', '/auth/login', '/partners/login'],
  catalogPath: ['/pathology/tests', '/pathology/catalog', '/tests/catalog'],
  createOrderPath: ['/pathology/bookings', '/bookings/create', '/orders'],
  orderStatusPath: ['/pathology/bookings/{orderId}', '/bookings/{orderId}', '/orders/{orderId}'],
  reportPath: [
    '/pathology/bookings/{orderId}/report',
    '/bookings/{orderId}/report',
    '/orders/{orderId}/report',
    '/orders/{orderId}/reports',
  ],
} as const;

function readConfig() {
  return {
    baseUrl: (process.env.HEALTHIANS_BASE_URL || 'https://t25crm.healthians.co.in/api').replace(/\/$/, ''),
    username: process.env.HEALTHIANS_USERNAME || '',
    password: process.env.HEALTHIANS_PASSWORD || '',
    partnerName: process.env.HEALTHIANS_PARTNER_NAME || '',
    authPath: process.env.HEALTHIANS_AUTH_PATH || DEFAULT_HEALTHIANS_PATHS.authPath[0],
    catalogPath: process.env.HEALTHIANS_CATALOG_PATH || DEFAULT_HEALTHIANS_PATHS.catalogPath[0],
    createOrderPath: process.env.HEALTHIANS_CREATE_ORDER_PATH || DEFAULT_HEALTHIANS_PATHS.createOrderPath[0],
    orderStatusPath: process.env.HEALTHIANS_ORDER_STATUS_PATH || DEFAULT_HEALTHIANS_PATHS.orderStatusPath[0],
    reportPath: process.env.HEALTHIANS_REPORT_PATH || DEFAULT_HEALTHIANS_PATHS.reportPath[0],
    clientType: process.env.HEALTHIANS_CLIENT_TYPE || 'web',
    userAgent: process.env.HEALTHIANS_USER_AGENT || 'MySanjeevni/1.0',
  };
}

function getPathCandidates() {
  const cfg = readConfig();

  return {
    authPath: [cfg.authPath, ...DEFAULT_HEALTHIANS_PATHS.authPath.filter((p) => p !== cfg.authPath)],
    catalogPath: [cfg.catalogPath, ...DEFAULT_HEALTHIANS_PATHS.catalogPath.filter((p) => p !== cfg.catalogPath)],
    createOrderPath: [
      cfg.createOrderPath,
      ...DEFAULT_HEALTHIANS_PATHS.createOrderPath.filter((p) => p !== cfg.createOrderPath),
    ],
    orderStatusPath: [
      cfg.orderStatusPath,
      ...DEFAULT_HEALTHIANS_PATHS.orderStatusPath.filter((p) => p !== cfg.orderStatusPath),
    ],
    reportPath: [cfg.reportPath, ...DEFAULT_HEALTHIANS_PATHS.reportPath.filter((p) => p !== cfg.reportPath)],
  };
}

function replacePathVar(path: string, orderId: string) {
  return path.replace('{orderId}', encodeURIComponent(orderId));
}

function parseNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseToken(data: UnknownRecord) {
  return String(
    data.token ||
      data.accessToken ||
      data.access_token ||
      data.jwt ||
      (data.data as UnknownRecord | undefined)?.token ||
      (data.data as UnknownRecord | undefined)?.accessToken ||
      (data.data as UnknownRecord | undefined)?.access_token ||
      (data.result as UnknownRecord | undefined)?.token ||
      (data.result as UnknownRecord | undefined)?.accessToken ||
      ''
  );
}

function parseList(data: UnknownRecord): UnknownRecord[] {
  const roots = [
    data.tests,
    data.items,
    data.data,
    (data.data as UnknownRecord | undefined)?.tests,
    (data.data as UnknownRecord | undefined)?.items,
    (data.result as UnknownRecord | undefined)?.items,
  ];

  const arr = roots.find((r) => Array.isArray(r));
  return (arr as UnknownRecord[] | undefined) || [];
}

function inferCategory(name: string) {
  const text = name.toLowerCase();
  if (text.includes('thyroid')) return 'thyroid';
  if (text.includes('sugar') || text.includes('hba1c') || text.includes('diabet')) return 'diabetic';
  if (text.includes('card') || text.includes('lipid') || text.includes('heart')) return 'cardiac';
  if (text.includes('liver') || text.includes('lft')) return 'liver';
  if (text.includes('kidney') || text.includes('kft') || text.includes('renal')) return 'kidney';
  if (text.includes('vitamin')) return 'vitamin';
  return 'general';
}

function toHealthiansTest(item: UnknownRecord): ExternalLabTest | null {
  const providerTestId = String(item.id || item.test_id || item.testId || item.code || '').trim();
  const name = String(item.name || item.test_name || item.title || '').trim();
  if (!providerTestId || !name) return null;

  const mrp = parseNumber(item.mrp || item.list_price || item.price, 0);
  const price = parseNumber(item.offer_price || item.discounted_price || item.price || mrp, 0);

  return {
    _id: `healthians_${encodeURIComponent(providerTestId)}`,
    name,
    description: String(item.description || item.short_description || 'Partner test by Healthians'),
    price,
    mrp: mrp || undefined,
    category: inferCategory(name),
    icon: '🩺',
    rating: 4.5,
    reviews: 0,
    productType: 'Lab Tests',
    isActive: true,
    provider: 'healthians',
    providerMeta: {
      providerTestId,
      rawCategory: item.category || item.test_category || '',
    },
  };
}

async function parseJsonOrThrow(res: Response) {
  const body = (await res.json().catch(() => ({}))) as UnknownRecord;
  if (!res.ok) {
    const msg =
      String(body.message || (body.error as UnknownRecord | undefined)?.message || body.error || '').trim() ||
      `Healthians request failed (${res.status})`;
    throw new Error(msg);
  }
  return body;
}

async function getToken(forceRefresh = false) {
  if (!forceRefresh && cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const cfg = readConfig();
  const pathCandidates = getPathCandidates();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-Id': randomUUID(),
    'Client-Type': cfg.clientType,
    'User-Agent': cfg.userAgent,
  };

  if (cfg.partnerName) {
    headers['X-Partner-Name'] = cfg.partnerName;
  }

  let lastError: Error | null = null;
  let chosenAuthPath = pathCandidates.authPath[0];
  let token = '';

  for (const authPath of pathCandidates.authPath) {
    try {
      const res = await fetch(`${cfg.baseUrl}${authPath}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          username: cfg.username,
          password: cfg.password,
          partner_name: cfg.partnerName || undefined,
        }),
        cache: 'no-store',
      });

      const data = await parseJsonOrThrow(res);
      token = parseToken(data);
      if (!token) {
        throw new Error('Healthians login did not return a token');
      }

      chosenAuthPath = authPath;
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Healthians auth failed');
    }
  }

  if (!token) {
    throw lastError || new Error('Healthians authentication failed');
  }

  if (!resolvedPaths) {
    resolvedPaths = {
      authPath: chosenAuthPath,
      catalogPath: pathCandidates.catalogPath[0],
      createOrderPath: pathCandidates.createOrderPath[0],
      orderStatusPath: pathCandidates.orderStatusPath[0],
      reportPath: pathCandidates.reportPath[0],
    };
  } else {
    resolvedPaths.authPath = chosenAuthPath;
  }

  cachedToken = {
    token,
    expiresAt: Date.now() + 20 * 60 * 1000,
  };

  return token;
}

async function callHealthians(path: string, init: RequestInit = {}, retry = true) {
  const cfg = readConfig();
  const token = await getToken(false);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-Id': randomUUID(),
    'Client-Type': cfg.clientType,
    'User-Agent': cfg.userAgent,
    Authorization: `Bearer ${token}`,
    ...(init.headers as Record<string, string> | undefined),
  };

  if (cfg.partnerName) {
    headers['X-Partner-Name'] = cfg.partnerName;
  }

  const res = await fetch(`${cfg.baseUrl}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (retry && res.status === 401) {
    await getToken(true);
    return callHealthians(path, init, false);
  }

  return parseJsonOrThrow(res);
}

async function callWithFallback(
  candidates: string[],
  init: RequestInit = {}
): Promise<{ path: string; data: UnknownRecord }> {
  let lastError: Error | null = null;

  for (const path of candidates) {
    try {
      const data = await callHealthians(path, init);
      return { path, data };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Healthians request failed');
    }
  }

  throw lastError || new Error('Healthians request failed');
}

function parseHealthiansTestId(testId: string) {
  if (!testId.startsWith('healthians_')) {
    throw new Error('Invalid Healthians test ID');
  }

  const providerTestId = decodeURIComponent(testId.slice('healthians_'.length));
  if (!providerTestId) {
    throw new Error('Invalid Healthians test ID format');
  }

  return providerTestId;
}

function extractOrderId(data: UnknownRecord) {
  return String(
    data.orderId ||
      data.order_no ||
      data.bookingId ||
      data.id ||
      (data.data as UnknownRecord | undefined)?.orderId ||
      (data.data as UnknownRecord | undefined)?.bookingId ||
      (data.data as UnknownRecord | undefined)?.id ||
      (data.result as UnknownRecord | undefined)?.orderId ||
      ''
  );
}

function extractStatus(data: UnknownRecord) {
  return String(
    data.status ||
      data.orderStatus ||
      (data.data as UnknownRecord | undefined)?.status ||
      (data.data as UnknownRecord | undefined)?.orderStatus ||
      (data.result as UnknownRecord | undefined)?.status ||
      'ORDER_PLACED'
  );
}

function extractReport(data: UnknownRecord) {
  const reportUrl = String(
    data.reportUrl ||
      (data.data as UnknownRecord | undefined)?.reportUrl ||
      (data.result as UnknownRecord | undefined)?.reportUrl ||
      ''
  );
  const reportReady = Boolean(reportUrl) || Boolean((data.data as UnknownRecord | undefined)?.reportReady || data.reportReady);
  return { reportReady, reportUrl };
}

export const healthiansAdapter: LabPartnerAdapter = {
  provider: 'healthians',

  isConfigured() {
    const cfg = readConfig();
    return Boolean(cfg.username && cfg.password);
  },

  async fetchCatalog(params) {
    if (!this.isConfigured()) return [];

    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.category && params.category !== 'all') query.set('category', params.category);

    const pathCandidates = getPathCandidates();
    const catalogPaths = pathCandidates.catalogPath.map((p) => (query.toString() ? `${p}?${query.toString()}` : p));
    const { path: resolvedCatalogPath, data } = await callWithFallback(catalogPaths);

    if (!resolvedPaths) {
      resolvedPaths = {
        authPath: pathCandidates.authPath[0],
        catalogPath: resolvedCatalogPath.split('?')[0],
        createOrderPath: pathCandidates.createOrderPath[0],
        orderStatusPath: pathCandidates.orderStatusPath[0],
        reportPath: pathCandidates.reportPath[0],
      };
    } else {
      resolvedPaths.catalogPath = resolvedCatalogPath.split('?')[0];
    }

    const all = parseList(data).map(toHealthiansTest).filter((t): t is ExternalLabTest => Boolean(t));

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
      throw new Error('Healthians is not configured');
    }

    const providerTestId = parseHealthiansTestId(input.testId);
    const pathCandidates = getPathCandidates();

    const payload = {
      test_id: providerTestId,
      test_name: input.testName,
      collection_date: input.collectionDate,
      collection_time: input.collectionTime || '',
      address: input.address || '',
      pincode: input.patientPincode || '',
      patient: {
        name: input.user.fullName || 'Patient',
        age: input.patientAge ?? 30,
        gender: input.patientGender || 'MALE',
        phone: input.user.phone || '',
        email: input.user.email || '',
      },
      notes: input.notes || '',
      source: 'MySanjeevni',
      reference_id: `MSJ-${Date.now()}`,
      amount: input.testPrice,
    };

    const { path: createOrderPath, data } = await callWithFallback(pathCandidates.createOrderPath, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!resolvedPaths) {
      resolvedPaths = {
        authPath: pathCandidates.authPath[0],
        catalogPath: pathCandidates.catalogPath[0],
        createOrderPath,
        orderStatusPath: pathCandidates.orderStatusPath[0],
        reportPath: pathCandidates.reportPath[0],
      };
    } else {
      resolvedPaths.createOrderPath = createOrderPath;
    }

    const providerOrderId = extractOrderId(data);
    if (!providerOrderId) {
      throw new Error('Healthians create order did not return booking ID');
    }

    return {
      providerOrderId,
      providerStatus: extractStatus(data),
      raw: data,
    };
  },

  async getOrderStatus(orderId: string): Promise<PartnerStatusResult> {
    if (!this.isConfigured()) {
      throw new Error('Healthians is not configured');
    }

    const pathCandidates = getPathCandidates();

    const statusPaths = pathCandidates.orderStatusPath.map((p) => replacePathVar(p, orderId));
    const { path: statusPath, data: statusData } = await callWithFallback(statusPaths, { method: 'GET' });

    const reportPaths = pathCandidates.reportPath.map((p) => replacePathVar(p, orderId));
    const reportResult = await callWithFallback(reportPaths, { method: 'GET' }).catch(() => null);
    const reportData = reportResult?.data || ({} as UnknownRecord);

    if (!resolvedPaths) {
      resolvedPaths = {
        authPath: pathCandidates.authPath[0],
        catalogPath: pathCandidates.catalogPath[0],
        createOrderPath: pathCandidates.createOrderPath[0],
        orderStatusPath: statusPath,
        reportPath: reportResult?.path || pathCandidates.reportPath[0],
      };
    } else {
      resolvedPaths.orderStatusPath = statusPath;
      if (reportResult?.path) {
        resolvedPaths.reportPath = reportResult.path;
      }
    }

    const status = extractStatus(statusData);
    const report = extractReport(reportData);

    return {
      providerStatus: status,
      reportReady: report.reportReady,
      reportUrl: report.reportUrl,
      raw: {
        status: statusData,
        report: reportData,
      },
    };
  },
};
