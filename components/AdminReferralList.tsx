"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getReferralStage,
  getStageLabel,
  getStageBadgeClass,
  summarizeReferrals,
  type ReferralStage,
} from "@/lib/referral";

export type AdminReferralRow = {
  id: string;
  createdAt: string | Date;
  rewardAmount: number;
  payoutStatus: string;
  paidAt: string | Date | null;
  purchaseConfirmedAt: string | Date | null;
  purchaseNote: string | null;
  purchaseConfirmedBy: string | null;
  paymentReference: string | null;
  referrerId: string;
  referrer: { name: string | null; email: string; phone: string | null };
  referredUser: { name: string | null; email: string; phone: string | null };
};

type Filter = "ALL" | ReferralStage;

const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString();
const STAGE_ORDER: Record<ReferralStage, number> = { PURCHASE_CONFIRMED: 0, AWAITING_PURCHASE: 1, PAID: 2 };

const smallBtn =
  "inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--dk-border)] bg-[var(--dk-card)] px-3 py-1.5 text-xs font-semibold text-[var(--dk-ink)] transition-colors duration-150 hover:border-[var(--dk-border-hover)] disabled:cursor-not-allowed disabled:opacity-60";
const primaryBtn =
  "inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--dk-primary)] px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-150 hover:bg-[var(--dk-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60";
const fieldClass =
  "w-full rounded-[var(--radius-sm)] border border-[var(--dk-border)] bg-[var(--dk-card)] px-3 py-2 text-sm text-[var(--dk-ink)] outline-none focus:border-[var(--dk-gold)]";

export default function AdminReferralList({
  referrals,
  currentUserId,
}: {
  referrals: AdminReferralRow[];
  currentUserId: string;
}) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const summary = summarizeReferrals(referrals);

  const rows = referrals
    .map((r) => ({ r, stage: getReferralStage(r) }))
    .filter(({ stage }) => filter === "ALL" || stage === filter)
    // Things that need an admin to act (payout due) first, then awaiting, then finished ones.
    .sort((a, b) => STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage] || +new Date(b.r.createdAt) - +new Date(a.r.createdAt));

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "ALL", label: "All", count: summary.total },
    { key: "PURCHASE_CONFIRMED", label: "To pay", count: summary.toPay },
    { key: "AWAITING_PURCHASE", label: "Awaiting purchase", count: summary.awaiting },
    { key: "PAID", label: "Paid", count: summary.paid },
  ];

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card label="Awaiting purchase" value={String(summary.awaiting)} hint="Signed up, nothing owed yet" />
        <Card label="To pay" value={`${summary.toPay} · KSh ${summary.toPayAmount.toLocaleString()}`} hint="Purchase confirmed, payout due" />
        <Card label="Paid" value={`${summary.paid} · KSh ${summary.paidAmount.toLocaleString()}`} hint="Already paid out" />
      </div>

      <div className="mb-3 flex flex-wrap gap-2" role="tablist" aria-label="Filter referrals">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={filter === t.key}
            onClick={() => setFilter(t.key)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              filter === t.key
                ? "border-[var(--dk-primary)] bg-[var(--dk-primary)] text-white"
                : "border-[var(--dk-border)] bg-[var(--dk-card)] text-[var(--dk-ink)] hover:border-[var(--dk-border-hover)]"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-[var(--dk-muted)]">No referrals in this view.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map(({ r, stage }) => (
            <ReferralRowItem key={r.id} r={r} stage={stage} isOwn={r.referrerId === currentUserId} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ReferralRowItem({ r, stage, isOwn }: { r: AdminReferralRow; stage: ReferralStage; isOwn: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<null | "confirm" | "pay">(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run(action: string, extra: { note?: string; reference?: string } = {}) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/referrals/${r.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Failed to update (status ${res.status}).`);
        return;
      }
      setMode(null);
      setText("");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const referrerName = r.referrer.name || r.referrer.email;
  const referredName = r.referredUser.name || r.referredUser.email;

  return (
    <li className="rounded-xl border border-[var(--dk-border)] px-4 py-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-[var(--dk-ink)]">
            <span className="font-medium">{referrerName}</span> referred <span className="font-medium">{referredName}</span>
          </p>
          <p className="m-0 mt-0.5 text-xs text-[var(--dk-muted)]">
            Joined {fmtDate(r.createdAt)} · Reward KSh {r.rewardAmount.toLocaleString()}
          </p>
          <p className="m-0 mt-0.5 text-xs text-[var(--dk-muted)]">
            Pay to: {r.referrer.phone || "no phone number on the referrer's profile"} · Buyer contact:{" "}
            {r.referredUser.phone || r.referredUser.email}
          </p>
          {r.purchaseConfirmedAt && (
            <p className="m-0 mt-0.5 text-xs text-[var(--dk-muted)]">
              Confirmed {fmtDate(r.purchaseConfirmedAt)}
              {r.purchaseConfirmedBy ? ` by ${r.purchaseConfirmedBy}` : ""}
              {r.purchaseNote ? ` — ${r.purchaseNote}` : ""}
            </p>
          )}
          {r.paidAt && (
            <p className="m-0 mt-0.5 text-xs text-[var(--dk-muted)]">
              Paid {fmtDate(r.paidAt)}
              {r.paymentReference ? ` (ref ${r.paymentReference})` : ""}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className={`dk-badge inline-block rounded-full ${getStageBadgeClass(stage)}`}>{getStageLabel(stage)}</span>

          {isOwn ? (
            <span className="max-w-[14rem] text-right text-xs text-[var(--dk-muted)]">
              Your own referral — another admin must handle it.
            </span>
          ) : mode === null ? (
            <div className="flex flex-wrap justify-end gap-2">
              {stage === "AWAITING_PURCHASE" && (
                <button type="button" className={primaryBtn} onClick={() => setMode("confirm")}>
                  Confirm purchase
                </button>
              )}
              {stage === "PURCHASE_CONFIRMED" && (
                <>
                  <button type="button" className={primaryBtn} onClick={() => setMode("pay")}>
                    Mark as paid
                  </button>
                  <button type="button" className={smallBtn} disabled={loading} onClick={() => run("UNDO_CONFIRMATION")}>
                    Undo confirmation
                  </button>
                </>
              )}
              {stage === "PAID" && (
                <button type="button" className={smallBtn} disabled={loading} onClick={() => run("UNDO_PAID")}>
                  Mark as unpaid
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {!isOwn && mode === "confirm" && (
        <div className="mt-3 space-y-2 border-t border-[var(--dk-border)] pt-3">
          <label className="block text-xs font-medium text-[var(--dk-ink)]" htmlFor={`note-${r.id}`}>
            What did you check? (the referrer will see this — keep it short, no prices or personal details)
          </label>
          <input
            id={`note-${r.id}`}
            className={fieldClass}
            value={text}
            maxLength={300}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Plot in Kitengela — sale agreement seen"
          />
          <div className="flex gap-2">
            <button type="button" className={primaryBtn} disabled={loading} onClick={() => run("CONFIRM_PURCHASE", { note: text })}>
              {loading ? "Saving..." : "Confirm purchase"}
            </button>
            <button type="button" className={smallBtn} onClick={() => { setMode(null); setText(""); setError(""); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {!isOwn && mode === "pay" && (
        <div className="mt-3 space-y-2 border-t border-[var(--dk-border)] pt-3">
          <label className="block text-xs font-medium text-[var(--dk-ink)]" htmlFor={`ref-${r.id}`}>
            Payment reference, after you've paid them yourself (e.g. the M-Pesa code) — optional
          </label>
          <input
            id={`ref-${r.id}`}
            className={fieldClass}
            value={text}
            maxLength={100}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. SJK3L9XYZ1"
          />
          <div className="flex gap-2">
            <button type="button" className={primaryBtn} disabled={loading} onClick={() => run("MARK_PAID", { reference: text })}>
              {loading ? "Saving..." : "Mark as paid"}
            </button>
            <button type="button" className={smallBtn} onClick={() => { setMode(null); setText(""); setError(""); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <p className="m-0 mt-2 text-xs text-[var(--dk-danger-ink)]">{error}</p>}
    </li>
  );
}

function Card({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-[var(--dk-border)] bg-[var(--dk-ivory)] px-4 py-3">
      <p className="m-0 text-xs font-semibold uppercase tracking-wide text-[var(--dk-muted)]">{label}</p>
      <p className="m-0 mt-1 text-lg font-bold text-[var(--dk-heading)]">{value}</p>
      <p className="m-0 mt-0.5 text-[11px] text-[var(--dk-muted)]">{hint}</p>
    </div>
  );
}
