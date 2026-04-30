export type CountryCode = string;

export type CurrencyCode = 'INR' | 'USD';

export type CountryOption = {
  code: CountryCode;
  label: string;
  currency: CurrencyCode;
  symbol: '₹' | '$';
};

// Full country list (codes are ISO Alpha-2). India uses INR; all other countries default to USD.
export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'AF', label: 'Afghanistan', currency: 'USD', symbol: '$' },
  { code: 'AL', label: 'Albania', currency: 'USD', symbol: '$' },
  { code: 'DZ', label: 'Algeria', currency: 'USD', symbol: '$' },
  { code: 'AD', label: 'Andorra', currency: 'USD', symbol: '$' },
  { code: 'AO', label: 'Angola', currency: 'USD', symbol: '$' },
  { code: 'AG', label: 'Antigua and Barbuda', currency: 'USD', symbol: '$' },
  { code: 'AR', label: 'Argentina', currency: 'USD', symbol: '$' },
  { code: 'AM', label: 'Armenia', currency: 'USD', symbol: '$' },
  { code: 'AU', label: 'Australia', currency: 'USD', symbol: '$' },
  { code: 'AT', label: 'Austria', currency: 'USD', symbol: '$' },
  { code: 'AZ', label: 'Azerbaijan', currency: 'USD', symbol: '$' },
  { code: 'BS', label: 'Bahamas', currency: 'USD', symbol: '$' },
  { code: 'BH', label: 'Bahrain', currency: 'USD', symbol: '$' },
  { code: 'BD', label: 'Bangladesh', currency: 'USD', symbol: '$' },
  { code: 'BB', label: 'Barbados', currency: 'USD', symbol: '$' },
  { code: 'BY', label: 'Belarus', currency: 'USD', symbol: '$' },
  { code: 'BE', label: 'Belgium', currency: 'USD', symbol: '$' },
  { code: 'BZ', label: 'Belize', currency: 'USD', symbol: '$' },
  { code: 'BJ', label: 'Benin', currency: 'USD', symbol: '$' },
  { code: 'BT', label: 'Bhutan', currency: 'USD', symbol: '$' },
  { code: 'BO', label: 'Bolivia', currency: 'USD', symbol: '$' },
  { code: 'BA', label: 'Bosnia and Herzegovina', currency: 'USD', symbol: '$' },
  { code: 'BW', label: 'Botswana', currency: 'USD', symbol: '$' },
  { code: 'BR', label: 'Brazil', currency: 'USD', symbol: '$' },
  { code: 'BN', label: 'Brunei', currency: 'USD', symbol: '$' },
  { code: 'BG', label: 'Bulgaria', currency: 'USD', symbol: '$' },
  { code: 'BF', label: 'Burkina Faso', currency: 'USD', symbol: '$' },
  { code: 'BI', label: 'Burundi', currency: 'USD', symbol: '$' },
  { code: 'CV', label: 'Cabo Verde', currency: 'USD', symbol: '$' },
  { code: 'KH', label: 'Cambodia', currency: 'USD', symbol: '$' },
  { code: 'CM', label: 'Cameroon', currency: 'USD', symbol: '$' },
  { code: 'CA', label: 'Canada', currency: 'USD', symbol: '$' },
  { code: 'CF', label: 'Central African Republic', currency: 'USD', symbol: '$' },
  { code: 'TD', label: 'Chad', currency: 'USD', symbol: '$' },
  { code: 'CL', label: 'Chile', currency: 'USD', symbol: '$' },
  { code: 'CN', label: 'China', currency: 'USD', symbol: '$' },
  { code: 'CO', label: 'Colombia', currency: 'USD', symbol: '$' },
  { code: 'KM', label: 'Comoros', currency: 'USD', symbol: '$' },
  { code: 'CG', label: 'Congo (Congo-Brazzaville)', currency: 'USD', symbol: '$' },
  { code: 'CR', label: 'Costa Rica', currency: 'USD', symbol: '$' },
  { code: 'HR', label: 'Croatia', currency: 'USD', symbol: '$' },
  { code: 'CU', label: 'Cuba', currency: 'USD', symbol: '$' },
  { code: 'CY', label: 'Cyprus', currency: 'USD', symbol: '$' },
  { code: 'CZ', label: 'Czechia', currency: 'USD', symbol: '$' },
  { code: 'CD', label: 'Democratic Republic of the Congo', currency: 'USD', symbol: '$' },
  { code: 'DK', label: 'Denmark', currency: 'USD', symbol: '$' },
  { code: 'DJ', label: 'Djibouti', currency: 'USD', symbol: '$' },
  { code: 'DM', label: 'Dominica', currency: 'USD', symbol: '$' },
  { code: 'DO', label: 'Dominican Republic', currency: 'USD', symbol: '$' },
  { code: 'EC', label: 'Ecuador', currency: 'USD', symbol: '$' },
  { code: 'EG', label: 'Egypt', currency: 'USD', symbol: '$' },
  { code: 'SV', label: 'El Salvador', currency: 'USD', symbol: '$' },
  { code: 'GQ', label: 'Equatorial Guinea', currency: 'USD', symbol: '$' },
  { code: 'ER', label: 'Eritrea', currency: 'USD', symbol: '$' },
  { code: 'EE', label: 'Estonia', currency: 'USD', symbol: '$' },
  { code: 'SZ', label: 'Eswatini', currency: 'USD', symbol: '$' },
  { code: 'ET', label: 'Ethiopia', currency: 'USD', symbol: '$' },
  { code: 'FJ', label: 'Fiji', currency: 'USD', symbol: '$' },
  { code: 'FI', label: 'Finland', currency: 'USD', symbol: '$' },
  { code: 'FR', label: 'France', currency: 'USD', symbol: '$' },
  { code: 'GA', label: 'Gabon', currency: 'USD', symbol: '$' },
  { code: 'GM', label: 'Gambia', currency: 'USD', symbol: '$' },
  { code: 'GE', label: 'Georgia', currency: 'USD', symbol: '$' },
  { code: 'DE', label: 'Germany', currency: 'USD', symbol: '$' },
  { code: 'GH', label: 'Ghana', currency: 'USD', symbol: '$' },
  { code: 'GR', label: 'Greece', currency: 'USD', symbol: '$' },
  { code: 'GD', label: 'Grenada', currency: 'USD', symbol: '$' },
  { code: 'GT', label: 'Guatemala', currency: 'USD', symbol: '$' },
  { code: 'GN', label: 'Guinea', currency: 'USD', symbol: '$' },
  { code: 'GW', label: 'Guinea-Bissau', currency: 'USD', symbol: '$' },
  { code: 'GY', label: 'Guyana', currency: 'USD', symbol: '$' },
  { code: 'HT', label: 'Haiti', currency: 'USD', symbol: '$' },
  { code: 'HN', label: 'Honduras', currency: 'USD', symbol: '$' },
  { code: 'HU', label: 'Hungary', currency: 'USD', symbol: '$' },
  { code: 'IS', label: 'Iceland', currency: 'USD', symbol: '$' },
  { code: 'IN', label: 'India', currency: 'INR', symbol: '₹' },
  { code: 'ID', label: 'Indonesia', currency: 'USD', symbol: '$' },
  { code: 'IR', label: 'Iran', currency: 'USD', symbol: '$' },
  { code: 'IQ', label: 'Iraq', currency: 'USD', symbol: '$' },
  { code: 'IE', label: 'Ireland', currency: 'USD', symbol: '$' },
  { code: 'IL', label: 'Israel', currency: 'USD', symbol: '$' },
  { code: 'IT', label: 'Italy', currency: 'USD', symbol: '$' },
  { code: 'JM', label: 'Jamaica', currency: 'USD', symbol: '$' },
  { code: 'JP', label: 'Japan', currency: 'USD', symbol: '$' },
  { code: 'JO', label: 'Jordan', currency: 'USD', symbol: '$' },
  { code: 'KZ', label: 'Kazakhstan', currency: 'USD', symbol: '$' },
  { code: 'KE', label: 'Kenya', currency: 'USD', symbol: '$' },
  { code: 'KI', label: 'Kiribati', currency: 'USD', symbol: '$' },
  { code: 'KW', label: 'Kuwait', currency: 'USD', symbol: '$' },
  { code: 'KG', label: 'Kyrgyzstan', currency: 'USD', symbol: '$' },
  { code: 'LA', label: 'Laos', currency: 'USD', symbol: '$' },
  { code: 'LV', label: 'Latvia', currency: 'USD', symbol: '$' },
  { code: 'LB', label: 'Lebanon', currency: 'USD', symbol: '$' },
  { code: 'LS', label: 'Lesotho', currency: 'USD', symbol: '$' },
  { code: 'LR', label: 'Liberia', currency: 'USD', symbol: '$' },
  { code: 'LY', label: 'Libya', currency: 'USD', symbol: '$' },
  { code: 'LI', label: 'Liechtenstein', currency: 'USD', symbol: '$' },
  { code: 'LT', label: 'Lithuania', currency: 'USD', symbol: '$' },
  { code: 'LU', label: 'Luxembourg', currency: 'USD', symbol: '$' },
  { code: 'MG', label: 'Madagascar', currency: 'USD', symbol: '$' },
  { code: 'MW', label: 'Malawi', currency: 'USD', symbol: '$' },
  { code: 'MY', label: 'Malaysia', currency: 'USD', symbol: '$' },
  { code: 'MV', label: 'Maldives', currency: 'USD', symbol: '$' },
  { code: 'ML', label: 'Mali', currency: 'USD', symbol: '$' },
  { code: 'MT', label: 'Malta', currency: 'USD', symbol: '$' },
  { code: 'MH', label: 'Marshall Islands', currency: 'USD', symbol: '$' },
  { code: 'MR', label: 'Mauritania', currency: 'USD', symbol: '$' },
  { code: 'MU', label: 'Mauritius', currency: 'USD', symbol: '$' },
  { code: 'MX', label: 'Mexico', currency: 'USD', symbol: '$' },
  { code: 'FM', label: 'Micronesia', currency: 'USD', symbol: '$' },
  { code: 'MD', label: 'Moldova', currency: 'USD', symbol: '$' },
  { code: 'MC', label: 'Monaco', currency: 'USD', symbol: '$' },
  { code: 'MN', label: 'Mongolia', currency: 'USD', symbol: '$' },
  { code: 'ME', label: 'Montenegro', currency: 'USD', symbol: '$' },
  { code: 'MA', label: 'Morocco', currency: 'USD', symbol: '$' },
  { code: 'MZ', label: 'Mozambique', currency: 'USD', symbol: '$' },
  { code: 'MM', label: 'Myanmar', currency: 'USD', symbol: '$' },
  { code: 'NA', label: 'Namibia', currency: 'USD', symbol: '$' },
  { code: 'NR', label: 'Nauru', currency: 'USD', symbol: '$' },
  { code: 'NP', label: 'Nepal', currency: 'USD', symbol: '$' },
  { code: 'NL', label: 'Netherlands', currency: 'USD', symbol: '$' },
  { code: 'NZ', label: 'New Zealand', currency: 'USD', symbol: '$' },
  { code: 'NI', label: 'Nicaragua', currency: 'USD', symbol: '$' },
  { code: 'NE', label: 'Niger', currency: 'USD', symbol: '$' },
  { code: 'NG', label: 'Nigeria', currency: 'USD', symbol: '$' },
  { code: 'KP', label: 'North Korea', currency: 'USD', symbol: '$' },
  { code: 'MK', label: 'North Macedonia', currency: 'USD', symbol: '$' },
  { code: 'NO', label: 'Norway', currency: 'USD', symbol: '$' },
  { code: 'OM', label: 'Oman', currency: 'USD', symbol: '$' },
  { code: 'PK', label: 'Pakistan', currency: 'USD', symbol: '$' },
  { code: 'PW', label: 'Palau', currency: 'USD', symbol: '$' },
  { code: 'PS', label: 'Palestine', currency: 'USD', symbol: '$' },
  { code: 'PA', label: 'Panama', currency: 'USD', symbol: '$' },
  { code: 'PG', label: 'Papua New Guinea', currency: 'USD', symbol: '$' },
  { code: 'PY', label: 'Paraguay', currency: 'USD', symbol: '$' },
  { code: 'PE', label: 'Peru', currency: 'USD', symbol: '$' },
  { code: 'PH', label: 'Philippines', currency: 'USD', symbol: '$' },
  { code: 'PL', label: 'Poland', currency: 'USD', symbol: '$' },
  { code: 'PT', label: 'Portugal', currency: 'USD', symbol: '$' },
  { code: 'QA', label: 'Qatar', currency: 'USD', symbol: '$' },
  { code: 'RO', label: 'Romania', currency: 'USD', symbol: '$' },
  { code: 'RU', label: 'Russia', currency: 'USD', symbol: '$' },
  { code: 'RW', label: 'Rwanda', currency: 'USD', symbol: '$' },
  { code: 'KN', label: 'Saint Kitts and Nevis', currency: 'USD', symbol: '$' },
  { code: 'LC', label: 'Saint Lucia', currency: 'USD', symbol: '$' },
  { code: 'VC', label: 'Saint Vincent and the Grenadines', currency: 'USD', symbol: '$' },
  { code: 'WS', label: 'Samoa', currency: 'USD', symbol: '$' },
  { code: 'SM', label: 'San Marino', currency: 'USD', symbol: '$' },
  { code: 'ST', label: 'Sao Tome and Principe', currency: 'USD', symbol: '$' },
  { code: 'SA', label: 'Saudi Arabia', currency: 'USD', symbol: '$' },
  { code: 'SN', label: 'Senegal', currency: 'USD', symbol: '$' },
  { code: 'RS', label: 'Serbia', currency: 'USD', symbol: '$' },
  { code: 'SC', label: 'Seychelles', currency: 'USD', symbol: '$' },
  { code: 'SL', label: 'Sierra Leone', currency: 'USD', symbol: '$' },
  { code: 'SG', label: 'Singapore', currency: 'USD', symbol: '$' },
  { code: 'SK', label: 'Slovakia', currency: 'USD', symbol: '$' },
  { code: 'SI', label: 'Slovenia', currency: 'USD', symbol: '$' },
  { code: 'SB', label: 'Solomon Islands', currency: 'USD', symbol: '$' },
  { code: 'SO', label: 'Somalia', currency: 'USD', symbol: '$' },
  { code: 'ZA', label: 'South Africa', currency: 'USD', symbol: '$' },
  { code: 'KR', label: 'South Korea', currency: 'USD', symbol: '$' },
  { code: 'SS', label: 'South Sudan', currency: 'USD', symbol: '$' },
  { code: 'ES', label: 'Spain', currency: 'USD', symbol: '$' },
  { code: 'LK', label: 'Sri Lanka', currency: 'USD', symbol: '$' },
  { code: 'SD', label: 'Sudan', currency: 'USD', symbol: '$' },
  { code: 'SR', label: 'Suriname', currency: 'USD', symbol: '$' },
  { code: 'SE', label: 'Sweden', currency: 'USD', symbol: '$' },
  { code: 'CH', label: 'Switzerland', currency: 'USD', symbol: '$' },
  { code: 'SY', label: 'Syria', currency: 'USD', symbol: '$' },
  { code: 'TJ', label: 'Tajikistan', currency: 'USD', symbol: '$' },
  { code: 'TZ', label: 'Tanzania', currency: 'USD', symbol: '$' },
  { code: 'TH', label: 'Thailand', currency: 'USD', symbol: '$' },
  { code: 'TL', label: 'Timor-Leste', currency: 'USD', symbol: '$' },
  { code: 'TG', label: 'Togo', currency: 'USD', symbol: '$' },
  { code: 'TO', label: 'Tonga', currency: 'USD', symbol: '$' },
  { code: 'TT', label: 'Trinidad and Tobago', currency: 'USD', symbol: '$' },
  { code: 'TN', label: 'Tunisia', currency: 'USD', symbol: '$' },
  { code: 'TR', label: 'Turkey', currency: 'USD', symbol: '$' },
  { code: 'TM', label: 'Turkmenistan', currency: 'USD', symbol: '$' },
  { code: 'TV', label: 'Tuvalu', currency: 'USD', symbol: '$' },
  { code: 'UG', label: 'Uganda', currency: 'USD', symbol: '$' },
  { code: 'UA', label: 'Ukraine', currency: 'USD', symbol: '$' },
  { code: 'AE', label: 'United Arab Emirates', currency: 'USD', symbol: '$' },
  { code: 'GB', label: 'United Kingdom', currency: 'USD', symbol: '$' },
  { code: 'US', label: 'United States', currency: 'USD', symbol: '$' },
  { code: 'UY', label: 'Uruguay', currency: 'USD', symbol: '$' },
  { code: 'UZ', label: 'Uzbekistan', currency: 'USD', symbol: '$' },
  { code: 'VU', label: 'Vanuatu', currency: 'USD', symbol: '$' },
  { code: 'VA', label: 'Vatican City', currency: 'USD', symbol: '$' },
  { code: 'VE', label: 'Venezuela', currency: 'USD', symbol: '$' },
  { code: 'VN', label: 'Vietnam', currency: 'USD', symbol: '$' },
  { code: 'YE', label: 'Yemen', currency: 'USD', symbol: '$' },
  { code: 'ZM', label: 'Zambia', currency: 'USD', symbol: '$' },
  { code: 'ZW', label: 'Zimbabwe', currency: 'USD', symbol: '$' },
];

/**
 * Normalize a country identifier (code or label) to an ISO alpha-2 code string.
 * If the value already looks like a 2-letter code present in the options it is returned.
 * If a label is provided, the matching option code is returned.
 * Defaults to 'IN' when unclear.
 */
export function normalizeCountryCode(value?: string | null): CountryCode {
  const raw = String(value || '').trim();
  if (!raw) return 'IN';

  const up = raw.toUpperCase();

  // If already a 2-letter code and exists in our list, return it.
  if (up.length === 2 && COUNTRY_OPTIONS.some((o) => o.code === up)) return up;

  // Match by label (case-insensitive)
  const byLabel = COUNTRY_OPTIONS.find((o) => o.label.toUpperCase() === up);
  if (byLabel) return byLabel.code;

  // Try partial match of the label
  const partial = COUNTRY_OPTIONS.find((o) => up.includes(o.label.toUpperCase()) || o.label.toUpperCase().includes(up));
  if (partial) return partial.code;

  // Fallback: if it contains 'INDIA' treat as India
  if (up.includes('INDIA')) return 'IN';

  return 'IN';
}

export function isIndiaCountry(value?: string | null): boolean {
  return normalizeCountryCode(value) === 'IN';
}

export function getCountryOption(code?: string | null): CountryOption {
  const normalized = normalizeCountryCode(code);
  return COUNTRY_OPTIONS.find((option) => option.code === normalized) || { code: 'IN', label: 'India', currency: 'INR', symbol: '₹' };
}

export function getCountryFromCookieHeader(cookieHeader?: string | null): CountryCode | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(/(?:^|;\s*)preferredCountry=([^;]+)/i);
  if (!match?.[1]) return undefined;
  return normalizeCountryCode(decodeURIComponent(match[1]));
}
