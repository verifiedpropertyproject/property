/**
 * Purely decorative, pointer-events-none background scene for the hero.
 * Server component (no hooks/state) — animation is done entirely in CSS
 * (see the `.dk-hero-bg*` rules in globals.css), so it costs nothing on the
 * client and automatically respects the app-wide `prefers-reduced-motion`
 * rule that zeroes animation durations.
 */
export default function PropertyBackground() {
  return (
    <div className="dk-hero-bg" aria-hidden="true">
      {/* soft radial glow */}
      <div className="dk-hero-bg-glow" />

      {/* drifting clouds */}
      <svg className="dk-hero-bg-cloud dk-hero-bg-cloud-1" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M20 30c-7 0-12-5.6-12-12S13 6 20 6c1.6-3.6 5.3-6 9.6-6 5.7 0 10.4 4.3 11 9.8C46.5 10.6 51 15 51 20.4c0 6.4-5.4 11.6-12 11.6H20z"
          fill="currentColor"
        />
      </svg>
      <svg className="dk-hero-bg-cloud dk-hero-bg-cloud-2" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M20 30c-7 0-12-5.6-12-12S13 6 20 6c1.6-3.6 5.3-6 9.6-6 5.7 0 10.4 4.3 11 9.8C46.5 10.6 51 15 51 20.4c0 6.4-5.4 11.6-12 11.6H20z"
          fill="currentColor"
        />
      </svg>
      <svg className="dk-hero-bg-cloud dk-hero-bg-cloud-3" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M20 30c-7 0-12-5.6-12-12S13 6 20 6c1.6-3.6 5.3-6 9.6-6 5.7 0 10.4 4.3 11 9.8C46.5 10.6 51 15 51 20.4c0 6.4-5.4 11.6-12 11.6H20z"
          fill="currentColor"
        />
      </svg>

      {/* gently bobbing property markers (pins) */}
      <svg className="dk-hero-bg-pin dk-hero-bg-pin-1" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z"
          fill="currentColor"
        />
        <circle cx="12" cy="12" r="4.5" fill="var(--dk-card)" />
      </svg>
      <svg className="dk-hero-bg-pin dk-hero-bg-pin-2" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z"
          fill="currentColor"
        />
        <circle cx="12" cy="12" r="4.5" fill="var(--dk-card)" />
      </svg>
      <svg className="dk-hero-bg-pin dk-hero-bg-pin-3" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z"
          fill="currentColor"
        />
        <circle cx="12" cy="12" r="4.5" fill="var(--dk-card)" />
      </svg>

      {/* floating house / key / keyhole outlines */}
      <svg className="dk-hero-bg-icon dk-hero-bg-icon-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 11.2L12 4l9 7.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.5 9.6V20h13V9.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 20v-6h4v6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <svg className="dk-hero-bg-icon dk-hero-bg-icon-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="4.4" stroke="currentColor" strokeWidth="1.4" />
        <path d="M11.2 11.2L20 20M15.5 15.5l3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <svg className="dk-hero-bg-icon dk-hero-bg-icon-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="10" width="16" height="10" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>

      {/* skyline silhouette anchored to the bottom edge */}
      <svg
        className="dk-hero-bg-skyline"
        viewBox="0 0 1000 140"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="currentColor">
          <rect x="0" y="70" width="70" height="70" />
          <rect x="80" y="40" width="50" height="100" />
          <rect x="140" y="90" width="60" height="50" />
          <rect x="210" y="20" width="46" height="120" />
          <rect x="266" y="60" width="80" height="80" />
          <rect x="356" y="50" width="40" height="90" />
          <path d="M406 140V70l30-22 30 22v70z" />
          <rect x="476" y="30" width="54" height="110" />
          <rect x="540" y="85" width="70" height="55" />
          <rect x="620" y="55" width="46" height="85" />
          <path d="M676 140V80l26-18 26 18v60z" />
          <rect x="738" y="15" width="50" height="125" />
          <rect x="798" y="65" width="64" height="75" />
          <rect x="872" y="45" width="46" height="95" />
          <rect x="928" y="90" width="72" height="50" />
        </g>
        <g fill="var(--dk-gold)" opacity="0.55">
          <rect x="18" y="88" width="6" height="6" />
          <rect x="32" y="88" width="6" height="6" />
          <rect x="18" y="104" width="6" height="6" />
          <rect x="32" y="104" width="6" height="6" />
          <rect x="96" y="58" width="6" height="6" />
          <rect x="110" y="58" width="6" height="6" />
          <rect x="96" y="76" width="6" height="6" />
          <rect x="110" y="76" width="6" height="6" />
          <rect x="222" y="36" width="6" height="6" />
          <rect x="236" y="36" width="6" height="6" />
          <rect x="222" y="52" width="6" height="6" />
          <rect x="236" y="52" width="6" height="6" />
          <rect x="750" y="30" width="6" height="6" />
          <rect x="764" y="30" width="6" height="6" />
          <rect x="750" y="46" width="6" height="6" />
          <rect x="764" y="46" width="6" height="6" />
        </g>
      </svg>
    </div>
  );
}
