"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DocumentVerifyButton({
  documentId,
  verified,
}: {
  documentId: string;
  verified: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleToggle() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/documents/${documentId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: !verified }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to update (status ${res.status}).`);
        return;
      }

      router.refresh();
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span>
      <button onClick={handleToggle} disabled={loading}>
        {loading ? "Saving..." : verified ? "Mark as pending" : "Mark as received"}
      </button>

      {error && <span> {error}</span>}
    </span>
  );
}
