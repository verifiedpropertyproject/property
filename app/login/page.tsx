"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[var(--dk-ivory)] flex items-stretch font-sans">
      <div className="mx-auto flex w-full max-w-6xl flex-col lg:flex-row lg:my-auto lg:h-[720px] lg:shadow-2xl lg:rounded-[28px] overflow-hidden">
        {/* Left panel — brand / imagery */}
        <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-[#0B3D2E] via-[#0F4A38] to-[#0B3D2E] p-12 text-white overflow-hidden">
          {/* Skyline silhouette signature element */}
          <svg
            className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 w-full opacity-90"
            viewBox="0 0 600 400"
            preserveAspectRatio="xMidYMax slice"
            aria-hidden="true"
          >
            <rect x="20" y="220" width="60" height="180" fill="#0F4A38" />
            <rect x="95" y="160" width="45" height="240" fill="#123C2E" />
            <rect x="150" y="240" width="70" height="160" fill="#0F4A38" />
            <rect x="235" y="120" width="50" height="280" fill="#134536" />
            <rect x="300" y="190" width="65" height="210" fill="#0F4A38" />
            <rect x="380" y="90" width="55" height="310" fill="#123C2E" />
            <rect x="450" y="200" width="60" height="200" fill="#0F4A38" />
            <rect x="525" y="150" width="55" height="250" fill="#134536" />
            <g fill="#C9A227" opacity="0.85">
              <rect x="245" y="140" width="8" height="8" />
              <rect x="245" y="160" width="8" height="8" />
              <rect x="265" y="140" width="8" height="8" />
              <rect x="395" y="110" width="8" height="8" />
              <rect x="395" y="135" width="8" height="8" />
              <rect x="415" y="110" width="8" height="8" />
              <rect x="415" y="135" width="8" height="8" />
              <rect x="540" y="170" width="8" height="8" />
              <rect x="560" y="170" width="8" height="8" />
            </g>
          </svg>

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#C9A227] bg-[#0B3D2E] text-lg font-bold tracking-tight text-[#C9A227]">
              360
            </div>
            <div>
              <div className="text-lg font-semibold tracking-wide">DAKTOP360</div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-[#C9A227]">
                Realtors Limited
              </div>
            </div>
          </div>

          <div className="relative z-10 max-w-sm">
            <div className="mb-4 h-px w-14 bg-[#C9A227]" />
            <h2 className="text-3xl font-semibold leading-tight">
              Own a piece of Kenya&apos;s skyline.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Trusted by investors nationwide to manage, track, and grow premium
              property portfolios across Kenya.
            </p>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex w-full flex-1 items-center justify-center bg-[var(--dk-card)] px-6 py-12 sm:px-12 lg:w-1/2">
          <div className="w-full max-w-sm">
            {/* Mobile-only brand mark */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--dk-dark)] text-lg font-bold text-[var(--dk-gold)]">
                360
              </div>
              <div>
                <div className="text-lg font-semibold tracking-wide text-[var(--dk-heading)]">
                  DAKTOP360
                </div>
                <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--dk-gold-deep)]">
                  Realtors Limited
                </div>
              </div>
            </div>

            <h1 className="[font-family:var(--font-display)] text-2xl font-semibold text-[var(--dk-heading)] sm:text-3xl">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-[var(--dk-muted)]">
              Log in to manage your listings and saved properties.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--dk-ink)]">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-[var(--dk-border)] bg-[var(--dk-card)] px-4 py-3 text-sm text-[var(--dk-ink)] placeholder:text-[var(--dk-muted)] outline-none transition focus:border-[var(--dk-gold)] focus:ring-2 focus:ring-[var(--dk-gold)]/30"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--dk-ink)]">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[var(--dk-border)] bg-[var(--dk-card)] px-4 py-3 text-sm text-[var(--dk-ink)] placeholder:text-[var(--dk-muted)] outline-none transition focus:border-[var(--dk-gold)] focus:ring-2 focus:ring-[var(--dk-gold)]/30"
                />
              </div>

              <p className="text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-[var(--dk-heading)] underline-offset-2 hover:text-[var(--dk-gold-deep)] hover:underline"
                >
                  Forgot your password?
                </Link>
              </p>

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
                    Logging in...
                  </>
                ) : (
                  "Log in"
                )}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--dk-border)]" />
              <span className="text-xs font-medium uppercase tracking-wider text-[var(--dk-muted)]">
                Or
              </span>
              <div className="h-px flex-1 bg-[var(--dk-border)]" />
            </div>

            <button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--dk-border)] bg-[var(--dk-card)] px-4 py-3 text-sm font-medium text-[var(--dk-ink)] shadow-sm transition hover:border-[var(--dk-border-hover)] hover:bg-[var(--dk-ivory)]"
            >
              <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.4 26.8 36 24 36c-5.2 0-9.6-3.1-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.3 5.3C39.9 36.6 44 31 44 24c0-1.3-.1-2.7-.4-3.5z" />
              </svg>
              Log in with Google
            </button>

            <p className="mt-8 text-center text-sm text-[var(--dk-muted)]">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-[var(--dk-heading)] hover:text-[var(--dk-gold-deep)]">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
