// Kenyan phone numbers only, in one of two complete forms — no partial/short input accepted:
//   0743454334      (leading 0, 10 digits total)
//   +254743454334   (+254, then 9 digits, 13 characters total)
const KENYA_PHONE_REGEX = /^(0\d{9}|\+254\d{9})$/;

export function isValidPhone(phone: string): boolean {
  return KENYA_PHONE_REGEX.test(phone.trim());
}

export const PHONE_FORMAT_HINT = "Enter a complete Kenyan number: 0743454334 or +254743454334.";
export const PHONE_INPUT_PATTERN = "0\\d{9}|\\+254\\d{9}";

// Converts either accepted local format into the digits-only, country-coded form wa.me needs
// (e.g. "0743454334" or "+254743454334" -> "254743454334"). Returns null for anything that
// isn't a valid Kenyan number per isValidPhone, so callers never build a broken wa.me link.
export function toWhatsAppNumber(phone: string): string | null {
  const trimmed = phone.trim();
  if (!isValidPhone(trimmed)) return null;
  if (trimmed.startsWith("+")) return trimmed.slice(1);
  return `254${trimmed.slice(1)}`;
}

