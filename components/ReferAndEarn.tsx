"use client";

import { useState } from "react";
import {
  getReferralPath,
  getReferralStage,
  getStageLabel,
  getStageBadgeClass,
  summarizeReferrals,
  REFERRAL_REWARD_AMOUNT,
} from "@/lib/referral";

export type ReferralRow = {
  id: string;
  createdAt: string | Date;
  rewardAmount: number;
  payoutStatus: string;
  paidAt: string | Date | null;
  purchaseConfirmedAt: string | Date | null;
  purchaseNote: string | null;
  paymentReference: string | null;
  referredUser: { name: string | null; email: string };
};

const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString();

export default function ReferAndEarn({
  referralCode,
  referrals,
}: {
  referralCode: string;
  referrals: ReferralRow[];
}) {
  const [copied, setCopied] = useState(false);
  const summary = summarizeReferrals(referrals);

  async function handleCopy() {
    const link = typeof window !== "undefined" ? `${window.location.origin}${getReferralPath(referralCode)}` : "";
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can fail (older browsers, permissions) — the link is still visible and
      // selectable in the input below, so this isn't fatal.
    }
  }

  return (
    <div>
      <p className="mb-4 text-sm text-[var(--dk-muted)]">
        Share your link. When someone you referred buys a property and our team confirms the purchase, you
        earn KSh {REFERRAL_REWARD_AMOUNT.toLocaleString()}. We then pay you directly and mark it paid here.
      </p>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <input
          readOnly
          value={typeof window !== "undefined" ? `${window.location.origin}${getReferralPath(referralCode)}` : getReferralPath(referralCode)}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 rounded-[var(--radius-sm)] border border-[var(--dk-border)] bg-[var(--dk-ivory)] px-3 py-2 text-sm text-[var(--dk-ink)] outline-none"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--dk-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[var(--dk-primary-hover)]"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>

      <p className="mt-2 text-xs text-[var(--dk-muted)]">
        Or just share your code: <span className="font-semibold text-[var(--dk-ink)]">{referralCode}</span>
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Referrals" value={String(summary.total)} hint={`${summary.awaiting} awaiting purchase`} />
        <Stat label="Earned" value={`KSh ${summary.earnedAmount.toLocaleString()}`} hint="Purchase confirmed" />
        <Stat label="Awaiting payout" value={`KSh ${summary.toPayAmount.toLocaleString()}`} hint="Confirmed, not yet paid" />
        <Stat label="Paid to you" value={`KSh ${summary.paidAmount.toLocaleString()}`} hint="Already sent" />
      </div>

      {referrals.length > 0 && (
        <ul className="mt-5 flex flex-col gap-2.5">
          {referrals.map((r) => {
            const stage = getReferralStage(r);
            const confirmed = stage !== "AWAITING_PURCHASE";
            const paid = stage === "PAID";
            return (
              <li key={r.id} className="rounded-xl border border-[var(--dk-border)] px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="m-0 font-medium text-[var(--dk-ink)]">{r.referredUser.name || r.referredUser.email}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--dk-heading)]">KSh {r.rewardAmount.toLocaleString()}</span>
                    <span className={`dk-badge inline-block rounded-full ${getStageBadgeClass(stage)}`}>
                      {getStageLabel(stage)}
                    </span>
                  </div>
                </div>

                <ul className="m-0 mt-2 list-none space-y-1 p-0 text-xs text-[var(--dk-muted)]">
                  <li>
                    <Mark done /> Signed up on {fmtDate(r.createdAt)}
                  </li>
                  <li>
                    <Mark done={confirmed} />{" "}
                    {confirmed && r.purchaseConfirmedAt
                      ? `Purchase confirmed on ${fmtDate(r.purchaseConfirmedAt)}${r.purchaseNote ? ` — ${r.purchaseNote}` : ""}`
                      : "Waiting for their purchase to be confirmed"}
                  </li>
                  <li>
                    <Mark done={paid} />{" "}
                    {paid && r.paidAt
                      ? `Paid on ${fmtDate(r.paidAt)}${r.paymentReference ? ` (ref ${r.paymentReference})` : ""}`
                      : confirmed
                        ? "Payout pending — we'll pay you and notify you"
                        : "Paid once the purchase is confirmed"}
                  </li>
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-[var(--dk-border)] bg-[var(--dk-ivory)] px-4 py-3">
      <p className="m-0 text-xs font-semibold uppercase tracking-wide text-[var(--dk-muted)]">{label}</p>
      <p className="m-0 mt-1 text-lg font-bold text-[var(--dk-heading)]">{value}</p>
      <p className="m-0 mt-0.5 text-[11px] text-[var(--dk-muted)]">{hint}</p>
    </div>
  );
}

function Mark({ done }: { done: boolean }) {
  return (
    <span aria-hidden="true" className={`mr-1 inline-block w-3 ${done ? "text-[var(--dk-primary)]" : ""}`}>
      {done ? "✓" : "○"}
    </span>
  );
}
