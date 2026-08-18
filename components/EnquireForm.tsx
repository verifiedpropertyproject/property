"use client";

import { useState } from "react";
import type { FormEvent } from "react";

export default function EnquireForm({ propertyId }: { propertyId: string }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!message.trim()) {
      setError("Enter a message first.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/properties/${propertyId}/enquire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Failed to send enquiry (status ${res.status}).`);
        return;
      }

      setMessage("");
      setSuccess("Enquiry sent to the seller.");
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Ask the seller a question
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            required
          />
        </label>
      </div>

      {error && (
        <p>
          {error}
        </p>
      )}

      {success && (
        <p>
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
      >
        {loading ? "Sending..." : "Send enquiry"}
      </button>
    </form>
  );
}