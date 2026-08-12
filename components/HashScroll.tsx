"use client";

import { useEffect } from "react";

/**
 * Mount this once on any page that has anchor targets (e.g. #buy-property,
 * #sell-property). It handles the cases Next.js's built-in hash scrolling
 * misses:
 *  - Navigating from a different route to "/#some-id" (the target element
 *    may not exist in the DOM the instant Next tries to scroll).
 *  - Clicking a hash link while already on "/", where the URL hash changes
 *    but the browser/router doesn't re-trigger a scroll on its own.
 */
export default function HashScroll() {
  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash;
      if (!hash) return;

      const id = decodeURIComponent(hash.slice(1));

      // Try immediately, then retry briefly in case the target hasn't
      // rendered/hydrated yet (covers streaming/suspense timing).
      let attempts = 0;
      const tryScroll = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        attempts += 1;
        if (attempts < 20) {
          setTimeout(tryScroll, 50);
        }
      };
      tryScroll();
    };

    // Run on initial mount (covers cross-page navigation landing on "/#id")
    scrollToHash();

    // Run again whenever the hash changes while already on this page
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  return null;
}
