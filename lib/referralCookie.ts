// Remembers a referral code in the browser so it survives the person clicking around before
// they sign up, and — importantly — the trip through Google sign-in, which leaves the site and
// comes back (so ?ref=... in the URL is long gone by the time they pick a role).
// Browser-only: call these from client components / effects, never during server rendering.

const COOKIE_NAME = "dk_ref";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function saveReferralCookie(code: string) {
  if (typeof document === "undefined" || !code) return;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(code)}; max-age=${MAX_AGE_SECONDS}; path=/; SameSite=Lax`;
}

export function readReferralCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE_NAME}=`));
  return match ? decodeURIComponent(match.slice(COOKIE_NAME.length + 1)) : "";
}

export function clearReferralCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; max-age=0; path=/; SameSite=Lax`;
}
