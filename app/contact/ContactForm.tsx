"use client";

import { useState } from "react";

const CONTACT_EMAIL = "hello@daktop360.co.ke";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const body = `${message}\n\n— ${name}${email ? ` (${email})` : ""}`;
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject || "Message from the Daktop website"
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
    setSent(true);
  }

  return (
    <div className="dk-search-panel !flex-none">
      <h2 className="dk-search-title">Send us a message</h2>
      <hr className="dk-search-rule" />

      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="dk-field">
            <label className="dk-field-label" htmlFor="contact-name">
              Your name
            </label>
            <input
              id="contact-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Wanjiru"
              className="dk-input"
            />
          </div>
          <div className="dk-field">
            <label className="dk-field-label" htmlFor="contact-email">
              Email address
            </label>
            <input
              id="contact-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="dk-input"
            />
          </div>
        </div>

        <div className="dk-field">
          <label className="dk-field-label" htmlFor="contact-subject">
            Subject
          </label>
          <input
            id="contact-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="I have a question about a listing"
            className="dk-input"
          />
        </div>

        <div className="dk-field">
          <label className="dk-field-label" htmlFor="contact-message">
            Message
          </label>
          <textarea
            id="contact-message"
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us how we can help..."
            className="dk-input resize-none"
          />
        </div>

        <button type="submit" className="dk-nav-cta !text-[14px] !py-3 !px-5 text-center">
          Send message
        </button>

        {sent && (
          <p className="text-[13px] text-[var(--dk-primary)] m-0">
            Opening your email app to send this — if nothing happened, email us directly at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        )}
      </form>
    </div>
  );
}
