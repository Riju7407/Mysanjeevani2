import { healthiansAdapter } from './healthians';
import { thyrocareAdapter } from './thyrocare';
import type {
  ExternalLabTest,
  LabPartnerAdapter,
  LabProvider,
  PartnerBookingInput,
  PartnerCreateOrderResult,
  PartnerPincodeServiceability,
  PartnerSlot,
  PartnerStatusResult,
} from './types';

export type {
  ExternalLabTest,
  LabProvider,
  PartnerBookingInput,
  PartnerCreateOrderResult,
  PartnerPincodeServiceability,
  PartnerSlot,
  PartnerStatusResult,
};

const adapters: LabPartnerAdapter[] = [thyrocareAdapter, healthiansAdapter];

export function detectProviderFromTestId(testId: string): LabProvider {
  if (testId.startsWith('thyrocare_')) return 'thyrocare';
  if (testId.startsWith('healthians_')) return 'healthians';
  return 'local';
}

export function getAdapter(provider: Exclude<LabProvider, 'local'>) {
  return adapters.find((a) => a.provider === provider) || null;
}

export async function fetchPartnerCatalog(params?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const results: ExternalLabTest[] = [];

  await Promise.all(
    adapters.map(async (adapter) => {
      if (!adapter.isConfigured()) return;
      try {
        const tests = await adapter.fetchCatalog(params);
        results.push(...tests);
      } catch (error) {
        console.error(`Failed to fetch ${adapter.provider} catalog:`, error);
      }
    })
  );

  return results;
}

export async function createPartnerOrder(provider: Exclude<LabProvider, 'local'>, input: PartnerBookingInput): Promise<PartnerCreateOrderResult> {
  const adapter = getAdapter(provider);
  if (!adapter) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  return adapter.createOrder(input);
}

export async function fetchPartnerOrderStatus(provider: Exclude<LabProvider, 'local'>, orderId: string, leadId?: string): Promise<PartnerStatusResult> {
  const adapter = getAdapter(provider);
  if (!adapter) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  return adapter.getOrderStatus(orderId, leadId);
}

export async function fetchPartnerPincodeServiceability(
  provider: Exclude<LabProvider, 'local'>,
  pincode: string
): Promise<PartnerPincodeServiceability> {
  const adapter = getAdapter(provider);
  if (!adapter || !adapter.checkPincodeServiceability) {
    throw new Error(`Pincode serviceability is not supported for provider: ${provider}`);
  }

  return adapter.checkPincodeServiceability(pincode);
}

export async function fetchPartnerSlots(
  provider: Exclude<LabProvider, 'local'>,
  input: {
    testId: string;
    testName: string;
    appointmentDate: string;
    pincode: string;
    patientName?: string;
    patientAge?: number;
    patientGender?: 'MALE' | 'FEMALE' | 'OTHER';
  }
): Promise<{ timeZone?: string; appointmentDate?: string; slots: PartnerSlot[] }> {
  const adapter = getAdapter(provider);
  if (!adapter || !adapter.searchSlots) {
    throw new Error(`Slot search is not supported for provider: ${provider}`);
  }

  return adapter.searchSlots(input);
}

export async function cancelPartnerOrder(
  provider: Exclude<LabProvider, 'local'>,
  orderId: string,
  reason?: { reasonKey?: string; reasonText?: string }
) {
  const adapter = getAdapter(provider);
  if (!adapter || !adapter.cancelOrder) {
    throw new Error(`Order cancellation is not supported for provider: ${provider}`);
  }

  return adapter.cancelOrder(orderId, reason);
}
