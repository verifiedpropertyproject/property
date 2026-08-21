"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_GALLERY_IMAGES } from "@/lib/propertyConstants";

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
  const [loading, setLoading] = useState(false);
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
      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append("images", file);
      }

      const res = await fetch(`/api/properties/${propertyId}/images`, {
        method: "POST",
        body: formData,
      });

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
    <div>
      <p>Additional photos ({images.length}/{MAX_GALLERY_IMAGES})</p>

      {images.length > 0 && (
        <div>
          {images.map((image) => (
            <div key={image.id}>
              <img src={image.url} alt="Listing photo" width={120} height={90} />
              <button
                type="button"
                disabled={deletingId === image.id}
                onClick={() => handleDelete(image.id)}
              >
                {deletingId === image.id ? "Removing..." : "Remove"}
              </button>
            </div>
          ))}
        </div>
      )}

      {remaining > 0 ? (
        <div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple />
          <button type="button" disabled={loading} onClick={handleUpload}>
            {loading ? "Uploading..." : "Add photos"}
          </button>
          <small> Up to {remaining} more — JPEG, PNG, or WEBP, max 5MB each.</small>
        </div>
      ) : (
        <small>You've reached the {MAX_GALLERY_IMAGES}-photo limit for this listing.</small>
      )}

      {error && <p role="alert">{error}</p>}
    </div>
  );
}
