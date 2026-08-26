// Seller/agent-initiated identity check: requested from the dashboard or while creating a
// listing, reviewed by an admin. Distinct from User.verified (the resulting trust badge) and
// from Property.verified/daktopVerified (per-listing due-diligence) — this is specifically the
// status of the identity check request itself, shown to the seller and on their listings.
export const IDENTITY_VERIFICATION_STATUSES = ["NOT_SUBMITTED", "PENDING", "APPROVED", "REJECTED"] as const;

export type IdentityVerificationStatus = (typeof IDENTITY_VERIFICATION_STATUSES)[number];

export const IDENTITY_VERIFICATION_LABELS: Record<string, string> = {
  NOT_SUBMITTED: "Not submitted",
  PENDING: "Pending review",
  APPROVED: "Identity verified",
  REJECTED: "Not approved",
};

export function getIdentityVerificationLabel(status: string | null | undefined): string {
  if (!status) return IDENTITY_VERIFICATION_LABELS.NOT_SUBMITTED;
  return IDENTITY_VERIFICATION_LABELS[status] || status;
}

// A seller can (re)submit a request unless one is already pending or already approved — a
// rejected or never-submitted seller is free to try again.
export function canRequestIdentityVerification(status: string | null | undefined): boolean {
  return status !== "PENDING" && status !== "APPROVED";
}
