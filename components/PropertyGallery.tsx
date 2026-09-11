"use client";

import { useState } from "react";

type PropertyGalleryProps = {
  images: string[];
  alt: string;
  closedLabel?: string | null;
};

export default function PropertyGallery({ images, alt, closedLabel }: PropertyGalleryProps) {
  // images[0] is always the one shown large. Clicking a thumbnail swaps it with
  // whatever's currently in that main spot, rather than just re-filtering the list —
  // so the photo the seller picked as cover always ends up back in the strip, not lost.
  const [order, setOrder] = useState(images);

  if (order.length === 0) return null;

  function swapToMain(thumbIndex: number) {
    setOrder((prev) => {
      const next = [...prev];
      [next[0], next[thumbIndex]] = [next[thumbIndex], next[0]];
      return next;
    });
  }

  const [main, ...thumbs] = order;

  return (
    <div className="mb-6">
      <div className="relative inline-block overflow-hidden rounded-[var(--radius-lg)] border border-[var(--dk-border)] bg-[var(--dk-ivory)]">
        {/* Keying on the url replays the fade-in whenever the main photo changes,
            so swapping in a thumbnail feels like a deliberate, sleek transition
            rather than an abrupt src swap. */}
        <img
          key={main}
          src={main}
          alt={alt}
          width={480}
          className="block h-auto max-w-full animate-[dkFadeIn_0.25s_ease]"
        />
        {closedLabel && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 dark:bg-black/60">
            <span className="rounded-md bg-white/95 px-4 py-1.5 text-base font-semibold uppercase tracking-wide text-gray-900 dark:bg-neutral-900/95 dark:text-neutral-50">
              {closedLabel}
            </span>
          </span>
        )}
      </div>

      {thumbs.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {thumbs.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              onClick={() => swapToMain(i + 1)}
              aria-label="View this photo larger"
              title="View this photo larger"
              className="h-[100px] w-[100px] cursor-pointer overflow-hidden rounded-[var(--radius-sm)] border border-[var(--dk-border)] bg-[var(--dk-ivory)] p-0 transition-transform duration-150 ease-out hover:scale-[1.04] hover:border-[var(--dk-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dk-primary)]"
            >
              <img src={url} alt={alt} width={160} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
