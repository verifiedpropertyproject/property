"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { isValidPhone, PHONE_FORMAT_HINT, PHONE_INPUT_PATTERN } from "@/lib/phoneValidation";

// --- Color palette (matches the Daktop360 reference design) ---
const COLORS = {
  darkGreen: "#0B2E1F",
  primaryGreen: "#1F7A4C",
  primaryGreenHover: "#176339",
  lightGreenBg: "#E8F5EC",
  pageBg: "#FFFFFF",
  sectionBg: "#F7FAF8",
  textDark: "#111827",
  textGray: "#6B7280",
  border: "#E5E7EB",
  white: "#FFFFFF",
  dangerBg: "#FDECEC",
  dangerText: "#B42318",
};

const fieldInputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: `1px solid ${COLORS.border}`,
  width: "100%",
  color: COLORS.textDark,
  boxSizing: "border-box",
  fontSize: "14px",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
};

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
    <div
      style={{
        backgroundColor: COLORS.pageBg,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <style>{`
        * { box-sizing: border-box; }

        .dk-sr-option {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          border: 1px solid ${COLORS.border};
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 10px;
          cursor: pointer;
          transition: border-color 0.2s ease, background-color 0.2s ease;
        }
        .dk-sr-option:hover {
          border-color: ${COLORS.primaryGreen};
          background-color: ${COLORS.sectionBg};
        }
        .dk-sr-option-selected {
          border-color: ${COLORS.primaryGreen};
          background-color: ${COLORS.lightGreenBg};
        }
        .dk-sr-option input[type="radio"] {
          margin-top: 3px;
          accent-color: ${COLORS.primaryGreen};
        }

        .dk-sr-input:focus, .dk-sr-input:focus-visible {
          outline: none;
          border-color: ${COLORS.primaryGreen} !important;
          box-shadow: 0 0 0 3px ${COLORS.primaryGreen}22;
        }

        .dk-sr-btn {
          background-color: ${COLORS.primaryGreen};
          color: ${COLORS.white};
          border: none;
          border-radius: 8px;
          padding: 11px 20px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          width: 100%;
          transition: background-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
        }
        .dk-sr-btn:hover:not(:disabled) {
          background-color: ${COLORS.primaryGreenHover};
          box-shadow: 0 4px 12px rgba(31,122,76,0.35);
        }
        .dk-sr-btn:active:not(:disabled) {
          transform: scale(0.98);
        }
        .dk-sr-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
      `}</style>

      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          backgroundColor: COLORS.white,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "14px",
          padding: "clamp(24px, 4vw, 32px)",
        }}
      >
        <h1 style={{ color: COLORS.darkGreen, fontSize: "22px", marginTop: 0, marginBottom: "8px" }}>
          Choose your account type
        </h1>
        <p style={{ color: COLORS.textGray, lineHeight: 1.6, marginBottom: "22px", fontSize: "14px" }}>
          Before continuing, tell us what kind of account this is.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "18px" }}>
            {roleOptions.map((opt) => (
              <label
                key={opt.value}
                className={`dk-sr-option${role === opt.value ? " dk-sr-option-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="role"
                  value={opt.value}
                  checked={role === opt.value}
                  onChange={() => setRole(opt.value)}
                />
                <span style={{ color: COLORS.textDark, fontWeight: 600, fontSize: "14px" }}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>

          {["OWNER", "AGENT"].includes(role) && (
            <div style={{ marginBottom: "18px" }}>
              <label style={{ color: COLORS.textDark, fontWeight: 500, fontSize: "13px", marginBottom: "6px", display: "block" }}>
                Phone number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                pattern={PHONE_INPUT_PATTERN}
                placeholder="0743454334 or +254743454334"
                className="dk-sr-input"
                style={fieldInputStyle}
              />
              <small style={{ color: COLORS.textGray, display: "block", marginTop: "6px", fontSize: "12px" }}>
                {PHONE_FORMAT_HINT}
              </small>
            </div>
          )}

          {error && (
            <p
              style={{
                color: COLORS.dangerText,
                backgroundColor: COLORS.dangerBg,
                borderRadius: "8px",
                padding: "10px 12px",
                fontSize: "13px",
                marginBottom: "16px",
              }}
            >
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="dk-sr-btn">
            {loading ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
