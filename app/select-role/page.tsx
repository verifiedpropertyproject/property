"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { isValidPhone, PHONE_FORMAT_HINT, PHONE_INPUT_PATTERN } from "@/lib/phoneValidation";

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
    { value: "BUYER", label: "Buyer" },
    { value: "OWNER", label: "Property Owner" },
    { value: "AGENT", label: "Real Estate Agent (selling on behalf of someone)" },
  ];

  return (
    <div>
      <div>
        <h1>
          Choose your account type
        </h1>
        <p>
          Before continuing, tell us what kind of account this is.
        </p>

        <form onSubmit={handleSubmit}>
          <div>
            {roleOptions.map((opt) => (
              <label key={opt.value}>
                <input
                  type="radio"
                  name="role"
                  value={opt.value}
                  checked={role === opt.value}
                  onChange={() => setRole(opt.value)}
                />
                <span>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>

          {["OWNER", "AGENT"].includes(role) && (
            <div>
              <label>
                Phone number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                pattern={PHONE_INPUT_PATTERN}
                placeholder="0743454334 or +254743454334"
              />
              <small>
                {PHONE_FORMAT_HINT}
              </small>
            </div>
          )}

          {error && (
            <p>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}