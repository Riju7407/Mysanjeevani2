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
  homeCollectionAvailable?: boolean;
  centerCollectionAvailable?: boolean;
  sampleType?: string;
  reportTime?: string;
  fasting?: boolean;
  fastingHours?: number;
  testsIncluded?: string | string[];
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

export interface PartnerSlot {
  id: string;
  startTime: string;
  endTime: string;
  label: string;
}

export interface PartnerPincodeServiceability {
  pincode: string;
  isServiceable: boolean;
  serviceTypes: string[];
}

export interface LabPartnerAdapter {
  readonly provider: Exclude<LabProvider, 'local'>;
  isConfigured(): boolean;
  fetchCatalog(params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    gender?: 'MALE' | 'FEMALE';
  }): Promise<ExternalLabTest[]>;
  createOrder(input: PartnerBookingInput): Promise<PartnerCreateOrderResult>;
  getOrderStatus(orderId: string, leadId?: string): Promise<PartnerStatusResult>;
  checkPincodeServiceability?(pincode: string): Promise<PartnerPincodeServiceability>;
  searchSlots?(input: {
    testId: string;
    testName: string;
    appointmentDate: string;
    pincode: string;
    patientName?: string;
    patientAge?: number;
    patientGender?: 'MALE' | 'FEMALE' | 'OTHER';
  }): Promise<{ timeZone?: string; appointmentDate?: string; slots: PartnerSlot[] }>;
  cancelOrder?(orderId: string, reason?: { reasonKey?: string; reasonText?: string }): Promise<{ message?: string; raw?: unknown }>;
}
