"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

// Shared palette — keep in sync with Header.tsx, Footer.tsx and the home page
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
  errorRed: "#DC2626",
  errorBg: "#FEF2F2",
  white: "#FFFFFF",
};

const fieldLabelStyle: React.CSSProperties = {
  color: COLORS.textDark,
  fontWeight: 500,
  fontSize: "13px",
  marginBottom: "6px",
  display: "block",
};

const fieldInputStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: "8px",
  border: `1px solid ${COLORS.border}`,
  width: "100%",
  color: COLORS.textDark,
  boxSizing: "border-box",
  fontSize: "14px",
  fontFamily: "inherit",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
};

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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.sectionBg,
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "clamp(16px, 4vw, 40px)",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        * { box-sizing: border-box; }

        @keyframes dk-fade-in-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dk-shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }

        .dk-login-card {
          animation: dk-fade-in-up 0.5s ease both;
        }

        .dk-input:focus, .dk-input:focus-visible {
          outline: none;
          border-color: ${COLORS.primaryGreen} !important;
          box-shadow: 0 0 0 3px ${COLORS.primaryGreen}22;
        }

        .dk-error {
          animation: dk-shake 0.4s ease;
        }

        .dk-btn-primary {
          transition: background-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
        }
        .dk-btn-primary:hover:not(:disabled) {
          background-color: ${COLORS.primaryGreenHover};
          box-shadow: 0 6px 16px rgba(31,122,76,0.35);
        }
        .dk-btn-primary:active:not(:disabled) {
          transform: scale(0.98);
        }
        .dk-btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .dk-btn-google {
          transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .dk-btn-google:hover {
          background-color: ${COLORS.sectionBg};
          border-color: #D1D5DB;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .dk-link {
          transition: color 0.2s ease;
        }
        .dk-link:hover {
          color: ${COLORS.primaryGreenHover};
          text-decoration: underline;
        }

        @keyframes dk-spin {
          to { transform: rotate(360deg); }
        }
        .dk-spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: ${COLORS.white};
          border-radius: 50%;
          animation: dk-spin 0.7s linear infinite;
          margin-right: 8px;
          vertical-align: -2px;
        }
      `}</style>

      <div
        className="dk-login-card"
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: COLORS.white,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "16px",
          padding: "clamp(24px, 5vw, 40px)",
          boxShadow: "0 4px 24px rgba(11,46,31,0.08)",
        }}
      >
        {/* Logo / brand mark */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              backgroundColor: COLORS.primaryGreen,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: COLORS.white,
              fontWeight: 800,
              fontSize: "14px",
              flexShrink: 0,
            }}
          >
            360
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 800, fontSize: "16px", color: COLORS.darkGreen, letterSpacing: "0.01em" }}>
              DAKTOP360
            </div>
            <div style={{ fontSize: "10px", color: COLORS.textGray, letterSpacing: "0.03em" }}>
              REALTORS LIMITED
            </div>
          </div>
        </div>

        <h1 style={{ color: COLORS.darkGreen, fontSize: "24px", margin: "0 0 6px 0" }}>Welcome back</h1>
        <p style={{ color: COLORS.textGray, fontSize: "14px", margin: "0 0 28px 0" }}>
          Log in to manage your listings and saved properties.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={fieldLabelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="dk-input"
              style={fieldInputStyle}
            />
          </div>

          <div style={{ marginBottom: "8px" }}>
            <label style={fieldLabelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="dk-input"
              style={fieldInputStyle}
            />
          </div>

          <p style={{ margin: "0 0 20px 0", textAlign: "right" }}>
            <Link
              href="/forgot-password"
              className="dk-link"
              style={{ color: COLORS.primaryGreen, fontSize: "13px", fontWeight: 500, textDecoration: "none" }}
            >
              Forgot your password?
            </Link>
          </p>

          {error && (
            <p
              className="dk-error"
              style={{
                backgroundColor: COLORS.errorBg,
                color: COLORS.errorRed,
                border: `1px solid ${COLORS.errorRed}33`,
                borderRadius: "8px",
                padding: "10px 12px",
                fontSize: "13px",
                margin: "0 0 16px 0",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="dk-btn-primary"
            style={{
              width: "100%",
              backgroundColor: COLORS.primaryGreen,
              color: COLORS.white,
              border: "none",
              borderRadius: "8px",
              padding: "12px 16px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <>
                <span className="dk-spinner" />
                Logging in...
              </>
            ) : (
              "Log in"
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "24px 0" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: COLORS.border }} />
          <span style={{ color: COLORS.textGray, fontSize: "12px" }}>OR</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: COLORS.border }} />
        </div>

        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="dk-btn-google"
          style={{
            width: "100%",
            backgroundColor: COLORS.white,
            color: COLORS.textDark,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "8px",
            padding: "12px 16px",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.4 26.8 36 24 36c-5.2 0-9.6-3.1-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.3 5.3C39.9 36.6 44 31 44 24c0-1.3-.1-2.7-.4-3.5z" />
          </svg>
          Log in with Google
        </button>

        <p style={{ textAlign: "center", color: COLORS.textGray, fontSize: "14px", marginTop: "24px", marginBottom: 0 }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="dk-link" style={{ color: COLORS.primaryGreen, fontWeight: 600, textDecoration: "none" }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
