"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { isValidPhone, PHONE_FORMAT_HINT, PHONE_INPUT_PATTERN } from "@/lib/phoneValidation";
import { ROLE_LABELS } from "@/lib/propertyConstants";

const inputClass =
  "w-full rounded-xl border border-[var(--dk-border)] bg-[var(--dk-card)] px-4 py-3 text-sm text-[var(--dk-ink)] placeholder:text-[var(--dk-muted)] outline-none transition focus:border-[var(--dk-gold)] focus:ring-2 focus:ring-[var(--dk-gold)]/30";

export default function SelectRolePage() {
  const router = useRouter();
  const { update } = useSession();
  const [role, setRole] = useState("BUYER");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (["OWNER", "AGENT"].includes(role) && !phone.trim()) {
      setError("Phone number is required for owner and agent accounts.");
      return;
    }

    if (phone.trim() && !isValidPhone(phone)) {
      setError(PHONE_FORMAT_HINT);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/select-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, phone }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Something went wrong (status ${res.status}).`);
        return;
      }

      await update();
      router.push("/dashboard");
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const roleOptions = [
    { value: "BUYER", label: ROLE_LABELS.BUYER, hint: "You're browsing and saving properties." },
    { value: "OWNER", label: ROLE_LABELS.OWNER, hint: "You own the property being listed." },
    { value: "AGENT", label: ROLE_LABELS.AGENT, hint: "You're selling on behalf of someone else." },
  ];

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[var(--dk-ivory)] p-6 font-sans">
      <div className="w-full max-w-md rounded-2xl border border-[var(--dk-border)] bg-[var(--dk-card)] p-8 shadow-[0_1px_3px_var(--dk-shadow)] sm:p-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--dk-dark)] text-base font-bold text-[var(--dk-gold)]">
            360
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide text-[var(--dk-heading)]">
              DAKTOP360
            </div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--dk-gold-deep)]">
              Realtors Limited
            </div>
          </div>
        </div>

        <h1 className="[font-family:var(--font-display)] text-2xl font-semibold text-[var(--dk-heading)] sm:text-3xl">
          Choose your account type
        </h1>
        <p className="mt-2 text-sm text-[var(--dk-muted)]">
          Before continuing, tell us what kind of account this is.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-3">
            {roleOptions.map((opt) => {
              const checked = role === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
                    checked
                      ? "border-[var(--dk-primary)] bg-[var(--dk-primary-ring)]"
                      : "border-[var(--dk-border)] bg-[var(--dk-card)] hover:border-[var(--dk-border-hover)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={opt.value}
                    checked={checked}
                    onChange={() => setRole(opt.value)}
                    className="mt-1 h-4 w-4 accent-[var(--dk-primary)]"
                  />
                  <span className="text-sm">
                    <span className="block font-semibold text-[var(--dk-ink)]">{opt.label}</span>
                    {opt.hint && <span className="mt-0.5 block text-[var(--dk-muted)]">{opt.hint}</span>}
                  </span>
                </label>
              );
            })}
          </div>

          {["OWNER", "AGENT"].includes(role) && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--dk-ink)]">
                Phone number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                pattern={PHONE_INPUT_PATTERN}
                placeholder="0743454334 or +254743454334"
                className={inputClass}
              />
              <small className="mt-1.5 block text-xs text-[var(--dk-muted)]">{PHONE_FORMAT_HINT}</small>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-[var(--dk-danger-bg)] px-3 py-2 text-sm text-[var(--dk-danger-ink)]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--dk-dark)] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_18px_var(--dk-shadow-strong)] transition hover:bg-[#0F4A38] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-[var(--dk-gold)]" />
                Saving...
              </>
            ) : (
              "Continue"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
