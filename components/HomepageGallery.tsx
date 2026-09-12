export type HomepageGalleryImage = {
  id: string;
  imageUrl: string;
  caption: string | null;
};

/**
 * Homepage "Gallery" section — admin-uploaded infographics/promo images (see
 * <GalleryManager /> in the admin dashboard and app/api/gallery) drifting past in one slow,
 * continuous, right-to-left strip.
 *
 * Same looping technique as <Marquee />: the list is duplicated and the duplicate slides in
 * right behind the original via a single linear keyframe, so the loop never visibly resets.
 * Unlike Marquee this is one row, sized for images rather than text pills, and moves
 * considerably slower since these are meant to be looked at, not skimmed.
 */
export default function HomepageGallery({ images }: { images: HomepageGalleryImage[] }) {
  if (images.length === 0) {
    return null;
  }

  // Duplicated once per track (matching the two-track technique in <Marquee />) so the loop
  // never visibly resets — see the .dk-marquee-fade / animate-marquee-left rules in globals.css.
  const content = [...images, ...images];

  // Slower for more images (each one gets roughly the same amount of screen time) but never
  // faster than a comfortable, unhurried drift.
  const duration = `${Math.max(50, images.length * 9)}s`;

  return (
    <section aria-label="Gallery" className="dk-gallery-section">
      <div className="dk-gallery-header">
        <span className="dk-fc-kicker">A closer look</span>
        <h2 className="dk-fc-title">Gallery</h2>
      </div>

      <div className="dk-marquee-fade dk-gallery-row group relative flex overflow-hidden">
        <div
          className="flex shrink-0 items-center animate-marquee-left group-hover:[animation-play-state:paused]"
          style={{ animationDuration: duration }}
        >
          {content.map((image, i) => (
            <figure key={`a-${image.id}-${i}`} className="dk-gallery-card">
              <img src={image.imageUrl} alt={image.caption || "Gallery image"} loading="lazy" />
              {image.caption && <figcaption>{image.caption}</figcaption>}
            </figure>
          ))}
        </div>
        <div
          className="flex shrink-0 items-center animate-marquee-left group-hover:[animation-play-state:paused]"
          style={{ animationDuration: duration }}
          aria-hidden="true"
        >
          {content.map((image, i) => (
            <figure key={`b-${image.id}-${i}`} className="dk-gallery-card">
              <img src={image.imageUrl} alt="" loading="lazy" />
              {image.caption && <figcaption>{image.caption}</figcaption>}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
