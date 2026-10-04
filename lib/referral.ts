// Refer & earn — a user shares their referralCode (or the link built from it below), and when
// someone they referred has a CONFIRMED purchase, the referrer earns a flat reward (see
// REFERRAL_REWARD_AMOUNT). Kept deliberately simple: one flat reward per confirmed purchase, no
// tiers or ongoing commissions.
//
// Lifecycle of a referral (buyers pay outside the website, so both steps are done by hand):
//   1. AWAITING_PURCHASE  — the referred person signed up with the code. Nothing is owed yet.
//   2. PURCHASE_CONFIRMED — an admin checked that they really bought and confirmed it. The
//                           reward is now earned and due.
//   3. PAID               — an admin paid the referrer (e.g. M-Pesa) and marked it paid.
// See prisma/schema.prisma's Referral model, lib/referralServer.ts (how a referral is created),
// and app/api/admin/referrals/[id]/status/route.ts (the admin actions).

// KSh, flat, per successful purchase by the referred user. Snapshotted onto each Referral row at
// creation, so changing this later only affects new referrals, not ones already earned.
export const REFERRAL_REWARD_AMOUNT = 10000;

// The raw payoutStatus column only ever holds these two values; the fuller lifecycle above is
// derived from it plus purchaseConfirmedAt (see getReferralStage).
export const PAYOUT_STATUSES = ["PENDING", "PAID"] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

export type ReferralStage = "AWAITING_PURCHASE" | "PURCHASE_CONFIRMED" | "PAID";

type StageInput = { payoutStatus: string; purchaseConfirmedAt?: Date | string | null };

export function getReferralStage(r: StageInput): ReferralStage {
  if (r.payoutStatus === "PAID") return "PAID";
  if (r.purchaseConfirmedAt) return "PURCHASE_CONFIRMED";
  return "AWAITING_PURCHASE";
}

export const STAGE_LABELS: Record<ReferralStage, string> = {
  AWAITING_PURCHASE: "Awaiting purchase",
  PURCHASE_CONFIRMED: "Confirmed — payout due",
  PAID: "Paid",
};

export function getStageLabel(stage: ReferralStage): string {
  return STAGE_LABELS[stage];
}

export function getStageBadgeClass(stage: ReferralStage): string {
  switch (stage) {
    case "PAID":
      return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/30";
    case "PURCHASE_CONFIRMED":
      return "bg-sky-50 text-sky-800 ring-1 ring-sky-200 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/30";
    default:
      return "bg-amber-50 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/30";
  }
}

// Totals used by both the referrer's own box and the admin overview, so the two always agree.
// "Earned" only counts referrals whose purchase has been confirmed — a signup alone earns nothing.
export function summarizeReferrals(rows: Array<StageInput & { rewardAmount: number }>) {
  let awaiting = 0, toPay = 0, paid = 0;
  let toPayAmount = 0, paidAmount = 0;
  for (const r of rows) {
    const stage = getReferralStage(r);
    if (stage === "AWAITING_PURCHASE") awaiting += 1;
    else if (stage === "PURCHASE_CONFIRMED") { toPay += 1; toPayAmount += r.rewardAmount; }
    else { paid += 1; paidAmount += r.rewardAmount; }
  }
  return {
    total: rows.length,
    awaiting,
    toPay,
    paid,
    toPayAmount,
    paidAmount,
    earnedAmount: toPayAmount + paidAmount,
  };
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
