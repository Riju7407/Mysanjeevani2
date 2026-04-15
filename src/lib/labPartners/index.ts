import { healthiansAdapter } from './healthians';
import { thyrocareAdapter } from './thyrocare';
import type { ExternalLabTest, LabPartnerAdapter, LabProvider, PartnerBookingInput, PartnerCreateOrderResult, PartnerStatusResult } from './types';

export type { ExternalLabTest, LabProvider, PartnerBookingInput, PartnerCreateOrderResult, PartnerStatusResult };

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
