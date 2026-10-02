// "3001234567" -> "300 123 4567"
export function formatPkPhone(digits: string) {
  const d = digits.replace(/\D/g, '');
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 10)].filter(Boolean).join(' ');
}

export const isValidPkMobile = (digits: string) => /^3\d{9}$/.test(digits);

export const toE164 = (digits: string) => `+92${digits}`;
