// "3001234567" -> "300 123 4567"
export function formatPkPhone(digits: string) {
  const d = digits.replace(/\D/g, '');
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 10)].filter(Boolean).join(' ');
}

export const isValidPkMobile = (digits: string) => /^3\d{9}$/.test(digits);

export const toE164 = (digits: string) => `+92${digits}`;

// "3001234567", "0300 1234567", "+92 300..." or an email address.
export function parseIdentifier(input: string): { phone: string } | { email: string } | null {
  const v = input.trim();
  if (v.includes('@')) return /^\S+@\S+\.\S+$/.test(v) ? { email: v.toLowerCase() } : null;
  const d = v.replace(/\D/g, '').replace(/^92/, '').replace(/^0/, '');
  return isValidPkMobile(d) ? { phone: d } : null;
}
