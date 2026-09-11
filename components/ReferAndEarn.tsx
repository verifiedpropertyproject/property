"use client";

import { useState } from "react";
import { getReferralPath, getPayoutStatusLabel, getPayoutStatusBadgeClass, REFERRAL_REWARD_AMOUNT } from "@/lib/referral";

export type ReferralRow = {
  id: string;
  createdAt: string | Date;
  rewardAmount: number;
  payoutStatus: string;
  referredUser: { name: string | null; email: string };
};

export default function ReferAndEarn({
  referralCode,
  referrals,
}: {
  referralCode: string;
  referrals: ReferralRow[];
}) {
  const [copied, setCopied] = useState(false);

  const totalEarned = referrals.reduce((sum, r) => sum + r.rewardAmount, 0);
  const totalPending = referrals
    .filter((r) => r.payoutStatus !== "PAID")
    .reduce((sum, r) => sum + r.rewardAmount, 0);

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
        Share your link. When someone signs up with it, you earn KSh {REFERRAL_REWARD_AMOUNT.toLocaleString()}.
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

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--dk-border)] bg-[var(--dk-ivory)] px-4 py-3">
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-[var(--dk-muted)]">Referrals</p>
          <p className="m-0 mt-1 text-lg font-bold text-[var(--dk-heading)]">{referrals.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--dk-border)] bg-[var(--dk-ivory)] px-4 py-3">
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-[var(--dk-muted)]">Total earned</p>
          <p className="m-0 mt-1 text-lg font-bold text-[var(--dk-heading)]">KSh {totalEarned.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-[var(--dk-border)] bg-[var(--dk-ivory)] px-4 py-3">
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-[var(--dk-muted)]">
            Pending payout
          </p>
          <p className="m-0 mt-1 text-lg font-bold text-[var(--dk-heading)]">KSh {totalPending.toLocaleString()}</p>
        </div>
      </div>

      {referrals.length > 0 && (
        <ul className="mt-5 flex flex-col gap-2">
          {referrals.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--dk-border)] px-4 py-2.5 text-sm"
            >
              <div>
                <p className="m-0 font-medium text-[var(--dk-ink)]">{r.referredUser.name || r.referredUser.email}</p>
                <p className="m-0 text-xs text-[var(--dk-muted)]">
                  Joined {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--dk-heading)]">KSh {r.rewardAmount.toLocaleString()}</span>
                <span
                  className={`dk-badge inline-block rounded-full ${getPayoutStatusBadgeClass(r.payoutStatus)}`}
                >
                  {getPayoutStatusLabel(r.payoutStatus)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
