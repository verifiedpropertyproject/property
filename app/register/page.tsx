"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { isValidPhone, PHONE_FORMAT_HINT, PHONE_INPUT_PATTERN } from "@/lib/phoneValidation";
import { ROLE_LABELS } from "@/lib/propertyConstants";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div>
        <div>
          <div>
            360
          </div>
          <div>
            <div>
              DAKTOP360
            </div>
            <div>
              REALTORS LIMITED
            </div>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("BUYER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter them.");
      return;
    }

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
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, confirmPassword, role }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Something went wrong (status ${res.status}).`);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Registered, but automatic login failed. Please log in.");
        router.push("/login");
        return;
      }

      if (data.emailSent) {
        setEmailSent(true);
      } else {
        setVerifyUrl(data.verifyUrl);
      }
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (emailSent) {
    return (
      <Shell>
        <div>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M4 6l8 6 8-6M4 6h16v12H4V6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1>Almost there</h1>
        <p>
          Your account was created. We&apos;ve sent a verification link to{" "}
          <span>{email}</span> — check your inbox.
        </p>
        <Link
          href="/dashboard"
        >
          Go to dashboard →
        </Link>
        <p>
          You&apos;ll see a reminder until you verify.
        </p>
      </Shell>
    );
  }

  if (verifyUrl) {
    return (
      <Shell>
        <div>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M4 6l8 6 8-6M4 6h16v12H4V6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1>Almost there</h1>
        <p>
          Your account was created. Before you can use your dashboard, verify your email.
        </p>
        <p>
          Real email sending isn&apos;t configured on this server, so here&apos;s your verification link
          directly (a fully configured version of this app would email it instead):
        </p>
        <div>
          <a href={verifyUrl}>
            {verifyUrl}
          </a>
        </div>
        <Link
          href="/dashboard"
        >
          Go to dashboard →
        </Link>
        <p>
          You&apos;ll see a reminder to verify until you click the link above.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1>Create an account</h1>
      <p>
        Join Daktop360 to browse, list, or manage properties.
      </p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="reg-name">
            Name
          </label>
          <input
            id="reg-name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Jane Wanjiru"
          />
        </div>

        <div>
          <label htmlFor="reg-email">
            Email
          </label>
          <input
            id="reg-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="reg-phone">
            Phone number{["OWNER", "AGENT"].includes(role) ? "" : " (optional)"}
          </label>
          <input
            id="reg-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required={["OWNER", "AGENT"].includes(role)}
            pattern={PHONE_INPUT_PATTERN}
            placeholder="0743454334 or +254743454334"
          />
          <small>{PHONE_FORMAT_HINT}</small>
        </div>

        <div>
          <label htmlFor="reg-password">
            Password
          </label>
          <input
            id="reg-password"
            name="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="••••••••"
          />
        </div>

        <div>
          <label htmlFor="reg-confirm-password">
            Confirm password
          </label>
          <input
            id="reg-confirm-password"
            name="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            placeholder="••••••••"
          />
        </div>

        <div>
          <label htmlFor="reg-role">
            Account type
          </label>
          <select
            id="reg-role"
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="BUYER">{ROLE_LABELS.BUYER}</option>
            <option value="OWNER">{ROLE_LABELS.OWNER}</option>
            <option value="AGENT">{ROLE_LABELS.AGENT}</option>
          </select>
        </div>

        {error && (
          <p
            role="alert"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <span />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <div>
        <div />
        <span>OR</span>
        <div />
      </div>

      <button
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      >
        <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.4 26.8 36 24 36c-5.2 0-9.6-3.1-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.3 5.3C39.9 36.6 44 31 44 24c0-1.3-.1-2.7-.4-3.5z" />
        </svg>
        Sign up with Google
      </button>

      <p>
        Already have an account?{" "}
        <Link href="/login">
          Log in
        </Link>
      </p>
    </Shell>
  );
}