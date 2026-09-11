// Refer & earn — a user shares their referralCode (or the link built from it below), and when
// someone they referred completes a successful purchase, the referrer earns a flat reward (see
// REFERRAL_REWARD_AMOUNT). Kept deliberately simple: one flat reward per successful purchase, no
// tiers or ongoing commissions.
// See prisma/schema.prisma's Referral model and User.referralCode, app/api/register/route.ts for
// how a referral is created, and app/api/admin/referrals/[id]/payout/route.ts for how an admin
// marks one as paid out (the actual payout itself — e.g. M-Pesa — happens outside the app).

// KSh, flat, per successful purchase by the referred user. Snapshotted onto each Referral row at
// creation, so changing this later only affects new referrals, not ones already earned.
export const REFERRAL_REWARD_AMOUNT = 10000;

export const PAYOUT_STATUSES = ["PENDING", "PAID"] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

export const PAYOUT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending payout",
  PAID: "Paid",
};

export function getPayoutStatusLabel(status: string): string {
  return PAYOUT_STATUS_LABELS[status] || status;
}

export function getPayoutStatusBadgeClass(status: string): string {
  return status === "PAID"
    ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/30"
    : "bg-amber-50 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/30";
}

// Derives a short, unique, shareable code from a user's (already-unique) id — no separate
// generation/collision-retry logic needed. Used for backfilling pre-existing accounts (see this
// feature's migration, which does the SQL equivalent: upper(right(id, 8))).
export function deriveReferralCode(userId: string): string {
  return userId.slice(-8).toUpperCase();
}

// For a brand-new signup, the id doesn't exist yet at the point Prisma needs referralCode (it's
// a required, unique column, so `user.create` needs it up front — the id isn't assigned until
// that same call returns). So new accounts instead get a short random code, generated here and
// retried on the rare collision — see app/api/register/route.ts.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — easy to read/type aloud
export function generateReferralCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

// Relative path is enough for an in-app copy button (built into an absolute URL client-side with
// window.location.origin) and for the register page's own link handling.
export function getReferralPath(code: string): string {
  return `/register?ref=${encodeURIComponent(code)}`;
}
