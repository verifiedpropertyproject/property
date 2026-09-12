import Link from "next/link";
import type { Property } from "@prisma/client";
import { getPropertyTypeLabel } from "@/lib/propertyConstants";

// Only the fields the carousel card actually renders. Kept intentionally
// narrow so this component works with whatever `select`/`include` shape the
// page passes in.
export type FeaturedCarouselProperty = Pick<
  Property,
  "id" | "title" | "imageUrl" | "location" | "propertyType" | "propertyTypeOther" | "price"
>;

/**
 * Homepage "Featured properties" stacked carousel.
 *
 * Which three listings appear here is entirely up to a super admin: it's
 * driven by the existing `Property.featured` flag, the same flag toggled
 * from the "Feature" / "Unfeature" button in <AdminPropertyList /> and
 * guarded server-side by `isAdminRole` in
 * app/api/properties/[id]/feature/route.ts. No new admin surface needed —
 * whichever (up to) three listings an admin currently has featured are the
 * three shown and rotated here, in the order the page query provides them.
 *
 * The rotation itself is pure CSS (see the `.dk-fc-*` rules in globals.css):
 * three cards, three depth "slots" (center / left-back / right-back), each
 * card looping through all three slots via a single 24s keyframe animation
 * (7s hold + 1s transition, three times). No JS/timers involved, and it's
 * automatically frozen by the existing prefers-reduced-motion rule.
 */
export default function FeaturedCarousel({
  properties,
  kicker = "Handpicked by our team",
  title = "Featured properties",
}: {
  properties: FeaturedCarouselProperty[];
  /** Small label above the heading — override per page (e.g. resale). */
  kicker?: string;
  /** Section heading — override per page (e.g. resale). */
  title?: string;
}) {
  const items = properties.slice(0, 3);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="dk-fc-section" aria-label={`${title}, chosen by our team`}>
      <div className="dk-fc-header">
        <span className="dk-fc-kicker">{kicker}</span>
        <h2 className="dk-fc-title">{title}</h2>
      </div>

      <div className={`dk-fc-stage dk-fc-stage--${items.length}`}>
        {items.map((p, i) => (
          <Link
            key={p.id}
            href={`/properties/${p.id}`}
            className={`dk-fc-card dk-fc-card--slot-${i}`}
          >
            <div className="dk-fc-img-wrap">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.title} className="dk-fc-img" />
              ) : (
                <div className="dk-fc-img-fallback" aria-hidden="true" />
              )}
              <span className="dk-fc-ribbon">Featured</span>
            </div>

            <div className="dk-fc-body">
              <strong className="dk-fc-card-title">{p.title}</strong>
              <span className="dk-fc-card-meta">
                {p.location} — {getPropertyTypeLabel(p.propertyType, p.propertyTypeOther)}
              </span>
              <span className="dk-fc-card-price">KSh {p.price.toLocaleString()}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
