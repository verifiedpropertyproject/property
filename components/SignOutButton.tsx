"use client";

import { signOut } from "next-auth/react";

// --- Color palette (matches Daktop360 homepage / admin components) ---
const COLORS = {
  textDark: "#111827",
  dangerRed: "#DC2626",
  dangerBg: "#FEF2F2",
  border: "#E5E7EB",
  white: "#FFFFFF",
};

export default function SignOutButton() {
  return (
    <>
      <style>{`
        .dk-signout-btn:hover {
          background-color: ${COLORS.dangerBg} !important;
          border-color: ${COLORS.dangerRed} !important;
          color: ${COLORS.dangerRed} !important;
        }
        .dk-signout-btn:active {
          transform: scale(0.97);
        }
      `}</style>
      <button
        className="dk-signout-btn"
        onClick={() => signOut({ callbackUrl: "/" })}
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          backgroundColor: COLORS.white,
          color: COLORS.textDark,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "8px",
          padding: "9px 16px",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          transition: "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.15s ease",
        }}
      >
        Log out</button>
    </>
  );
}