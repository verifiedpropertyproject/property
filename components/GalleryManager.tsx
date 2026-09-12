"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_HOMEPAGE_GALLERY_IMAGES } from "@/lib/galleryConstants";

type GalleryImage = { id: string; imageUrl: string; caption: string | null };

export default function GalleryManager({ images }: { images: GalleryImage[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const captionRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const remaining = MAX_HOMEPAGE_GALLERY_IMAGES - images.length;

  async function handleUpload() {
    setError("");
    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) {
      setError("Choose at least one image to upload.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append("images", file);
      }
      if (captionRef.current?.value.trim()) {
        formData.append("caption", captionRef.current.value.trim());
      }

      const res = await fetch("/api/gallery", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Failed to upload (status ${res.status}).`);
        return;
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
      if (captionRef.current) captionRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setError("");
    setBusyId(id);
    try {
      const res = await fetch(`/api/gallery/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Failed to remove image (status ${res.status}).`);
        return;
      }
      router.refresh();
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleMove(id: string, direction: "up" | "down") {
    setError("");
    setBusyId(id);
    try {
      const res = await fetch(`/api/gallery/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Failed to reorder (status ${res.status}).`);
        return;
      }
      router.refresh();
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-sm font-medium text-[var(--dk-ink)]">
        Homepage gallery images ({images.length}/{MAX_HOMEPAGE_GALLERY_IMAGES})
      </p>
      <p className="m-0 text-xs text-[var(--dk-muted)]">
        These rotate in a slow, continuous carousel on the homepage. Use the arrows to change the order they play in.
      </p>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((image, i) => (
            <div
              key={image.id}
              className="flex w-[180px] flex-col gap-1.5 overflow-hidden rounded-[var(--radius-md)] border border-[var(--dk-border)] bg-[var(--dk-ivory)] p-1.5"
            >
              <img
                src={image.imageUrl}
                alt={image.caption || "Homepage gallery image"}
                className="h-[110px] w-full rounded-[var(--radius-sm)] object-cover"
              />
              {image.caption && (
                <p className="m-0 truncate text-xs text-[var(--dk-muted)]" title={image.caption}>
                  {image.caption}
                </p>
              )}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={busyId === image.id || i === 0}
                  onClick={() => handleMove(image.id, "up")}
                  aria-label="Move earlier"
                  className="inline-flex flex-1 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--dk-border)] bg-[var(--dk-card)] py-1 text-xs font-semibold text-[var(--dk-ink)] transition-colors duration-150 hover:border-[var(--dk-border-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={busyId === image.id || i === images.length - 1}
                  onClick={() => handleMove(image.id, "down")}
                  aria-label="Move later"
                  className="inline-flex flex-1 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--dk-border)] bg-[var(--dk-card)] py-1 text-xs font-semibold text-[var(--dk-ink)] transition-colors duration-150 hover:border-[var(--dk-border-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ↓
                </button>
              </div>
              <button
                type="button"
                disabled={busyId === image.id}
                onClick={() => handleDelete(image.id)}
                className="inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--dk-danger-ink)]/30 bg-[var(--dk-danger-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--dk-danger-ink)] transition-colors duration-150 hover:bg-[var(--dk-danger-ink)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyId === image.id ? "Working..." : "Remove"}
              </button>
            </div>
          ))}
        </div>
      )}

      {remaining > 0 ? (
        <div className="flex flex-wrap items-end gap-2.5">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--dk-muted)]">Images</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="rounded-[var(--radius-sm)] border border-[var(--dk-border)] bg-[var(--dk-card)] px-3 py-2 text-sm text-[var(--dk-ink)] outline-none transition-colors duration-150 file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-[var(--dk-ivory)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[var(--dk-primary)] hover:border-[var(--dk-border-hover)] focus:border-[var(--dk-primary)] focus:shadow-[0_0_0_3px_var(--dk-primary-ring)]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--dk-muted)]">
              Caption (optional)
            </label>
            <input
              ref={captionRef}
              type="text"
              placeholder="e.g. Why buyers trust Daktop360"
              className="w-56 rounded-[var(--radius-sm)] border border-[var(--dk-border)] bg-[var(--dk-card)] px-3 py-2 text-sm text-[var(--dk-ink)] outline-none transition-colors duration-150 hover:border-[var(--dk-border-hover)] focus:border-[var(--dk-primary)] focus:shadow-[0_0_0_3px_var(--dk-primary-ring)]"
            />
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={handleUpload}
            className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--dk-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[var(--dk-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Uploading..." : "Add images"}
          </button>
          <small className="text-xs text-[var(--dk-muted)]">
            Up to {remaining} more — JPEG, PNG, or WEBP, max 5MB each.
          </small>
        </div>
      ) : (
        <small className="text-xs text-[var(--dk-muted)]">
          You've reached the {MAX_HOMEPAGE_GALLERY_IMAGES}-image limit for the homepage gallery.
        </small>
      )}

      {error && (
        <p
          role="alert"
          className="m-0 rounded-[var(--radius-md)] border border-[var(--dk-danger-ink)]/30 bg-[var(--dk-danger-bg)] px-3.5 py-2 text-sm text-[var(--dk-danger-ink)]"
        >
          {error}
        </p>
      )}
    </div>
  );
}
