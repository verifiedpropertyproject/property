"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MAX_GALLERY_IMAGES } from "@/lib/propertyConstants";
import { uploadPropertyMedia } from "@/lib/clientBlobUpload";

type GalleryImage = { id: string; url: string };

export default function PropertyGalleryManager({
  propertyId,
  images,
}: {
  propertyId: string;
  images: GalleryImage[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const remaining = MAX_GALLERY_IMAGES - images.length;

  async function handleUpload() {
    setError("");
    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) {
      setError("Choose at least one photo to upload.");
      return;
    }

    setLoading(true);
    try {
      // Straight to Vercel Blob (our own API rejects requests over ~4.5MB), then send only the
      // URLs. If Blob isn't set up (local dev) the first upload returns null and we post the files.
      const list = Array.from(files);
      const userId = (session?.user as { id?: string } | undefined)?.id;
      const urls: string[] = [];
      if (userId) {
        try {
          for (let i = 0; i < list.length; i++) {
            setProgress(`Uploading photo ${i + 1} of ${list.length}...`);
            const url = await uploadPropertyMedia(list[i], userId);
            if (!url) break;
            urls.push(url);
          }
        } catch (uploadErr: any) {
          setError(`Couldn't upload your photos${uploadErr?.message ? ` (${uploadErr.message})` : ""}. Check your connection and try again.`);
          return;
        }
      }
      setProgress("Saving...");

      let res: Response;
      if (urls.length === list.length && urls.length > 0) {
        res = await fetch(`/api/properties/${propertyId}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrls: urls }),
        });
      } else {
        const formData = new FormData();
        for (const file of list) formData.append("images", file);
        res = await fetch(`/api/properties/${propertyId}/images`, { method: "POST", body: formData });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Failed to upload (status ${res.status}).`);
        return;
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  }

  async function handleDelete(imageId: string) {
    setError("");
    setDeletingId(imageId);
    try {
      const res = await fetch(`/api/properties/${propertyId}/images/${imageId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Failed to remove photo (status ${res.status}).`);
        return;
      }

      router.refresh();
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-sm font-medium text-[var(--dk-ink)]">
        Additional photos ({images.length}/{MAX_GALLERY_IMAGES})
      </p>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((image) => (
            <div
              key={image.id}
              className="flex flex-col gap-1.5 overflow-hidden rounded-[var(--radius-md)] border border-[var(--dk-border)] bg-[var(--dk-ivory)] p-1.5"
            >
              <img
                src={image.url}
                alt="Listing photo"
                width={120}
                height={90}
                className="rounded-[var(--radius-sm)] object-cover"
              />
              <button
                type="button"
                disabled={deletingId === image.id}
                onClick={() => handleDelete(image.id)}
                className="inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--dk-danger-ink)]/30 bg-[var(--dk-danger-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--dk-danger-ink)] transition-colors duration-150 hover:bg-[var(--dk-danger-ink)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId === image.id ? "Removing..." : "Remove"}
              </button>
            </div>
          ))}
        </div>
      )}

      {remaining > 0 ? (
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="rounded-[var(--radius-sm)] border border-[var(--dk-border)] bg-[var(--dk-card)] px-3 py-2 text-sm text-[var(--dk-ink)] outline-none transition-colors duration-150 file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-[var(--dk-ivory)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[var(--dk-primary)] hover:border-[var(--dk-border-hover)] focus:border-[var(--dk-primary)] focus:shadow-[0_0_0_3px_var(--dk-primary-ring)]"
          />
          <button
            type="button"
            disabled={loading}
            onClick={handleUpload}
            className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--dk-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[var(--dk-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? progress || "Uploading..." : "Add photos"}
          </button>
          <small className="text-xs text-[var(--dk-muted)]"> Up to {remaining} more — JPEG, PNG, or WEBP, max 5MB each.</small>
        </div>
      ) : (
        <small className="text-xs text-[var(--dk-muted)]">You've reached the {MAX_GALLERY_IMAGES}-photo limit for this listing.</small>
      )}

      {error && (
        <p role="alert" className="m-0 rounded-[var(--radius-md)] border border-[var(--dk-danger-ink)]/30 bg-[var(--dk-danger-bg)] px-3.5 py-2 text-sm text-[var(--dk-danger-ink)]">
          {error}
        </p>
      )}
    </div>
  );
}
