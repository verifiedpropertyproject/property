"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { isValidPhone, PHONE_FORMAT_HINT, PHONE_INPUT_PATTERN } from "@/lib/phoneValidation";

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

      // Auto sign in after registration (dashboard will gate on email verification)
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
      <div>
        <h1>Almost there</h1>
        <p>Your account was created. We've sent a verification link to {email} — check your inbox.</p>
        <p>
          <Link href="/dashboard">Go to dashboard</Link> (you'll see a reminder until you verify)
        </p>
      </div>
    );
  }

  if (verifyUrl) {
    return (
      <div>
        <h1>Almost there</h1>
        <p>Your account was created. Before you can use your dashboard, verify your email.</p>
        <p>
          Real email sending isn't configured on this server, so here's your verification link
          directly (a fully configured version of this app would email it instead):
        </p>
        <p>
          <a href={verifyUrl}>{verifyUrl}</a>
        </p>
        <p>
          <Link href="/dashboard">Go to dashboard</Link> (you'll see a reminder to verify until
          you click the link above)
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>Create an account</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Name
            <br />
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
        </div>
        <div>
          <label>
            Email
            <br />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
        </div>
        <div>
          <label>
            Phone number{["OWNER", "AGENT"].includes(role) ? "" : " (optional)"}
            <br />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required={["OWNER", "AGENT"].includes(role)}
              pattern={PHONE_INPUT_PATTERN}
              placeholder="0743454334 or +254743454334"
            />
            <br />
            <small>{PHONE_FORMAT_HINT}</small>
          </label>
        </div>
        <div>
          <label>
            Password
            <br />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </label>
        </div>
        <div>
          <label>
            Confirm password
            <br />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>
        </div>
        <div>
          <label>
            Account type
            <br />
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="BUYER">Buyer</option>
              <option value="OWNER">Property Owner</option>
              <option value="AGENT">Real Estate Agent (selling on behalf of someone)</option>
            </select>
          </label>
        </div>

        {error && <p>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p>
        <button onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
          Sign up with Google
        </button>
      </p>

      <p>
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </div>
  );
}
