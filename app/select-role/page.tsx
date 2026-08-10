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

  return (
    <div>
      <h1>Choose your account type</h1>
      <p>Before continuing, tell us what kind of account this is.</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            <input type="radio" name="role" value="BUYER" checked={role === "BUYER"} onChange={() => setRole("BUYER")} />
            Buyer
          </label>
        </div>
        <div>
          <label>
            <input type="radio" name="role" value="OWNER" checked={role === "OWNER"} onChange={() => setRole("OWNER")} />
            Property Owner
          </label>
        </div>
        <div>
          <label>
            <input type="radio" name="role" value="AGENT" checked={role === "AGENT"} onChange={() => setRole("AGENT")} />
            Real Estate Agent (selling on behalf of someone)
          </label>
        </div>

        {["OWNER", "AGENT"].includes(role) && (
          <div>
            <label>
              Phone number
              <br />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                pattern={PHONE_INPUT_PATTERN}
                placeholder="0743454334 or +254743454334"
              />
              <br />
              <small>{PHONE_FORMAT_HINT}</small>
            </label>
          </div>
        )}

        {error && <p>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
