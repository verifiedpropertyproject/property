"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { VIDEO_MAX_SIZE_BYTES } from "@/lib/propertyConstants";

export default function PropertyVideoManager({
  propertyId,
  videoUrl,
}: {
  propertyId: string;
  videoUrl: string | null;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");

  const maxMb = Math.round(VIDEO_MAX_SIZE_BYTES / (1024 * 1024));

  async function handleUpload() {
    setError("");
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a video to upload.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("video", file);

      const res = await fetch(`/api/properties/${propertyId}/video`, {
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

  async function handleRemove() {
    setError("");
    setRemoving(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/video`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Failed to remove video (status ${res.status}).`);
        return;
      }

      router.refresh();
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div>
      <p>Walkthrough video {videoUrl ? "" : "(none yet)"}</p>

      {videoUrl && (
        <div>
          <video src={videoUrl} controls width={320} />
          <div>
            <button type="button" disabled={removing} onClick={handleRemove}>
              {removing ? "Removing..." : "Remove video"}
            </button>
          </div>
        </div>
      )}

      <div>
        <input ref={fileInputRef} type="file" accept="video/mp4,video/webm,video/quicktime" />
        <button type="button" disabled={loading} onClick={handleUpload}>
          {loading ? "Uploading..." : videoUrl ? "Replace video" : "Add video"}
        </button>
        <small> MP4, WebM, or MOV, max {maxMb}MB. Uploading a new video replaces the current one.</small>
      </div>

      {error && <p role="alert">{error}</p>}
    </div>
  );
}
