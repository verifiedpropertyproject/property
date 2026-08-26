import { toWhatsAppNumber } from "@/lib/phoneValidation";

// Where seller/agent enquiries about a listing (verification questions, disputes,
// support requests, etc) get routed. Configure both in .env — either can be left blank
// to hide that particular contact option.
const { ADMIN_EMAIL, ADMIN_PHONE } = process.env;

export function getAdminMailtoHref(subject: string, body: string): string | null {
  if (!ADMIN_EMAIL) return null;
  return `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function getAdminCallHref(): string | null {
  if (!ADMIN_PHONE) return null;
  return `tel:${ADMIN_PHONE.trim()}`;
}

export function getAdminWhatsAppHref(message: string): string | null {
  if (!ADMIN_PHONE) return null;
  const whatsappNumber = toWhatsAppNumber(ADMIN_PHONE);
  if (!whatsappNumber) return null;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}
