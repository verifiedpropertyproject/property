"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { VIDEO_MAX_SIZE_BYTES, ALLOWED_VIDEO_MIME_TYPES } from "@/lib/propertyConstants";
import { uploadPropertyMedia } from "@/lib/clientBlobUpload";

export default function PropertyVideoManager({
  propertyId,
  videoUrl,
}: {
  propertyId: string;
  videoUrl: string | null;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
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

    if (!ALLOWED_VIDEO_MIME_TYPES.includes(file.type)) {
      setError("Videos must be MP4, WebM, or MOV files.");
      return;
    }
    if (file.size > VIDEO_MAX_SIZE_BYTES) {
      setError(`The video is too large. Max size is ${maxMb}MB.`);
      return;
    }

    setLoading(true);
    try {
      // Straight to Vercel Blob (our own API rejects requests over ~4.5MB), then send only the
      // URL. If Blob isn't set up (local dev) this returns null and we post the file instead.
      const userId = (session?.user as { id?: string } | undefined)?.id;
      let videoUrl: string | null = null;
      if (userId) {
        try {
          setProgress("Uploading video (this can take a minute)...");
          videoUrl = await uploadPropertyMedia(file, userId);
        } catch (uploadErr: any) {
          setError(`Couldn't upload the video${uploadErr?.message ? ` (${uploadErr.message})` : ""}. Check your connection and try again.`);
          return;
        }
        setProgress("Saving...");
      }

      let res: Response;
      if (videoUrl) {
        res = await fetch(`/api/properties/${propertyId}/video`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoUrl }),
        });
      } else {
        const formData = new FormData();
        formData.append("video", file);
        res = await fetch(`/api/properties/${propertyId}/video`, { method: "POST", body: formData });
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
    <div className="flex flex-col gap-3">
      <p className="m-0 text-sm font-medium text-[var(--dk-ink)]">
        Walkthrough video {videoUrl ? "" : "(none yet)"}
      </p>

      {videoUrl && (
        <div className="flex flex-col items-start gap-2.5">
          <video
            src={videoUrl}
            controls
            width={320}
            className="rounded-[var(--radius-md)] border border-[var(--dk-border)]"
          />
          <button
            type="button"
            disabled={removing}
            onClick={handleRemove}
            className="inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--dk-danger-ink)]/30 bg-[var(--dk-danger-bg)] px-3.5 py-1.5 text-sm font-semibold text-[var(--dk-danger-ink)] transition-colors duration-150 hover:bg-[var(--dk-danger-ink)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {removing ? "Removing..." : "Remove video"}
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="rounded-[var(--radius-sm)] border border-[var(--dk-border)] bg-[var(--dk-card)] px-3 py-2 text-sm text-[var(--dk-ink)] outline-none transition-colors duration-150 file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-[var(--dk-ivory)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[var(--dk-primary)] hover:border-[var(--dk-border-hover)] focus:border-[var(--dk-primary)] focus:shadow-[0_0_0_3px_var(--dk-primary-ring)]"
        />
        <button
          type="button"
          disabled={loading}
          onClick={handleUpload}
          className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--dk-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[var(--dk-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? progress || "Uploading..." : videoUrl ? "Replace video" : "Add video"}
        </button>
        <small className="text-xs text-[var(--dk-muted)]"> MP4, WebM, or MOV, max {maxMb}MB. Uploading a new video replaces the current one.</small>
      </div>

      {error && (
        <p role="alert" className="m-0 rounded-[var(--radius-md)] border border-[var(--dk-danger-ink)]/30 bg-[var(--dk-danger-bg)] px-3.5 py-2 text-sm text-[var(--dk-danger-ink)]">
          {error}
        </p>
      )}
    </div>
  );
}
