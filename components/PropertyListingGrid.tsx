"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import PropertyCard, { type PropertyWithSeller } from "@/components/PropertyCard";

// Below this width a listing counts as a "small screen" and gets more rows
// per page (there's simply less content per row to make up for it).
const SMALL_SCREEN_QUERY = "(max-width: 767px)";
const ROWS_SMALL_SCREEN = 4;
const ROWS_DESKTOP_AND_TABLET = 2;

/**
 * Builds a compact page-number list with "…" gaps for large result sets,
 * e.g. [1, "…", 4, 5, 6, "…", 12] — always keeps the first, last, and a
 * small window around the current page.
 */
function getPageList(current: number, total: number): (number | "ellipsis")[] {
  const pages: (number | "ellipsis")[] = [];
  const windowStart = Math.max(2, current - 1);
  const windowEnd = Math.min(total - 1, current + 1);

  pages.push(1);
  if (windowStart > 2) pages.push("ellipsis");
  for (let i = windowStart; i <= windowEnd; i++) pages.push(i);
  if (windowEnd < total - 1) pages.push("ellipsis");
  if (total > 1) pages.push(total);

  return pages;
}

export default function PropertyListingGrid({
  properties,
  showSaveButton,
  savedPropertyIds,
  listingCountBySellerId,
}: {
  properties: PropertyWithSeller[];
  showSaveButton: boolean;
  savedPropertyIds: string[];
  listingCountBySellerId: Record<string, number>;
}) {
  const gridRef = useRef<HTMLUListElement>(null);
  const [itemsPerPage, setItemsPerPage] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const savedSet = useMemo(() => new Set(savedPropertyIds), [savedPropertyIds]);

  // Work out how many cards make up "two rows" (desktop/tablet) or "four
  // rows" (small screens) from the grid's own actual column count, rather
  // than a hardcoded number — the card grid uses auto-fill columns, so the
  // real column count already changes with viewport width on its own.
  useLayoutEffect(() => {
    function recalc() {
      const el = gridRef.current;
      if (!el) return;
      const columns = getComputedStyle(el).gridTemplateColumns.split(" ").filter(Boolean).length || 1;
      const rows = window.matchMedia(SMALL_SCREEN_QUERY).matches ? ROWS_SMALL_SCREEN : ROWS_DESKTOP_AND_TABLET;
      setItemsPerPage(columns * rows);
    }

    recalc();

    const resizeObserver = new ResizeObserver(recalc);
    if (gridRef.current) resizeObserver.observe(gridRef.current);
    window.addEventListener("resize", recalc);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", recalc);
    };
  }, []);

  // A new search/filter or a page-size change (e.g. rotating the phone)
  // should always land back on page 1 instead of risking an out-of-range page.
  useEffect(() => {
    setPage(1);
  }, [properties, itemsPerPage]);

  // Fall back to "everything on one page" for the very first render, before
  // the layout effect above has had a chance to measure the grid.
  const effectivePerPage = itemsPerPage ?? (properties.length || 1);
  const totalPages = Math.max(1, Math.ceil(properties.length / effectivePerPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * effectivePerPage;
  const visible = properties.slice(start, start + effectivePerPage);

  function goToPage(target: number) {
    const next = Math.min(Math.max(target, 1), totalPages);
    if (next === currentPage) return;
    setPage(next);
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <ul className="dk-grid" ref={gridRef}>
        {visible.map((p, index) => (
          <PropertyCard
            key={p.id}
            p={p}
            index={index}
            showSaveButton={showSaveButton}
            isSaved={savedSet.has(p.id)}
            listingCount={listingCountBySellerId[p.sellerId] ?? 0}
          />
        ))}
      </ul>

      {totalPages > 1 && (
        <nav className="dk-pagination" aria-label="Listings pages">
          <button
            type="button"
            className="dk-pagination-arrow"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="dk-pagination-pages">
            {getPageList(currentPage, totalPages).map((entry, i) =>
              entry === "ellipsis" ? (
                <span key={`ellipsis-${i}`} className="dk-pagination-ellipsis" aria-hidden="true">
                  &hellip;
                </span>
              ) : (
                <button
                  key={entry}
                  type="button"
                  className={`dk-pagination-page${entry === currentPage ? " dk-pagination-page-active" : ""}`}
                  onClick={() => goToPage(entry)}
                  aria-current={entry === currentPage ? "page" : undefined}
                >
                  {entry}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            className="dk-pagination-arrow"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </nav>
      )}
    </>
  );
}
