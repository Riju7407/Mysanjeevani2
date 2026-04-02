import { User } from '@/lib/models/User';
import { Vendor } from '@/lib/models/Vendor';

export type PhoneLoginRole = 'user' | 'vendor' | 'doctor';

export interface PhoneLookupResult {
  account: any;
  role: PhoneLoginRole;
}

export function normalizePhone(input: string): string {
  return String(input || '').replace(/\D/g, '');
}

export function phoneCandidates(input: string): string[] {
  const digits = normalizePhone(input);
  const last10 = digits.slice(-10);
  const withPlus = digits ? `+${digits}` : '';

  return Array.from(new Set([input, digits, last10, withPlus].filter(Boolean)));
}

export function normalizeRole(input: string): PhoneLoginRole {
  const role = String(input || 'user').toLowerCase();
  if (role === 'vendor' || role === 'doctor') return role;
  return 'user';
}

export async function findRegisteredByPhone(
  phone: string,
  role: PhoneLoginRole
): Promise<PhoneLookupResult | null> {
  const candidates = phoneCandidates(phone);

  if (role === 'vendor') {
    const vendor = await Vendor.findOne({ phone: { $in: candidates } }).select('+password');
    if (!vendor) return null;
    return { account: vendor, role: 'vendor' };
  }

  const user = await User.findOne({
    role,
    phone: { $in: candidates },
  }).select('+password');

  if (!user) return null;
  return { account: user, role };
}
