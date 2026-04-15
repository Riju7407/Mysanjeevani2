export type LabProvider = 'local' | 'thyrocare' | 'healthians';

export interface ExternalLabTest {
  _id: string;
  name: string;
  description?: string;
  price: number;
  mrp?: number;
  category: string;
  image?: string;
  icon?: string;
  rating?: number;
  reviews?: number;
  productType: 'Lab Tests';
  isActive: boolean;
  provider: Exclude<LabProvider, 'local'>;
  providerMeta?: Record<string, unknown>;
}

export interface PartnerBookingInput {
  testId: string;
  testName: string;
  testPrice: number;
  collectionDate: string;
  collectionTime?: string;
  address?: string;
  patientPincode?: string;
  patientAge?: number;
  patientGender?: 'MALE' | 'FEMALE' | 'OTHER';
  notes?: string;
  user: {
    id: string;
    fullName?: string;
    email?: string;
    phone?: string;
  };
}

export interface PartnerCreateOrderResult {
  providerOrderId: string;
  providerStatus?: string;
  providerLeadId?: string;
  raw?: unknown;
}

export interface PartnerStatusResult {
  providerStatus?: string;
  reportReady?: boolean;
  reportUrl?: string;
  providerLeadId?: string;
  raw?: unknown;
}

export interface LabPartnerAdapter {
  readonly provider: Exclude<LabProvider, 'local'>;
  isConfigured(): boolean;
  fetchCatalog(params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ExternalLabTest[]>;
  createOrder(input: PartnerBookingInput): Promise<PartnerCreateOrderResult>;
  getOrderStatus(orderId: string, leadId?: string): Promise<PartnerStatusResult>;
}
