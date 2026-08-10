"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SaveButton({ propertyId, initiallySaved }: { propertyId: string; initiallySaved: boolean }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initiallySaved);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/properties/${propertyId}/save`, { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to update (status ${res.status}).`);
        return;
      }

      setSaved(data.saved);
      router.refresh();
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={toggle} disabled={loading}>
        {loading ? "Working..." : saved ? "Unsave property" : "Save property"}
      </button>
      {error && <p>{error}</p>}
    </div>
  );
}
