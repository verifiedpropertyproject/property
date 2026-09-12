"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, MessageCircle, X } from "lucide-react";

type FloatingContactProps = {
  whatsappHref: string;
  callHref: string;
};

export default function FloatingContact({ whatsappHref, callHref }: FloatingContactProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape, same UX pattern as PremiumSelect's dropdown.
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const actions = [
    {
      key: "whatsapp",
      href: whatsappHref,
      label: "WhatsApp us",
      bg: "#25D366",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35z" />
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.33 4.95L2 22l5.28-1.39c1.44.79 3.07 1.2 4.74 1.2h.01c5.46 0 9.91-4.45 9.91-9.91C21.94 6.45 17.5 2 12.04 2zm0 18.15h-.01c-1.48 0-2.94-.4-4.21-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.18 8.18 0 01-1.26-4.37c0-4.53 3.69-8.21 8.22-8.21 2.2 0 4.26.85 5.82 2.41a8.17 8.17 0 012.4 5.81c0 4.53-3.69 8.23-8.17 8.23z" />
        </svg>
      ),
    },
    {
      key: "call",
      href: callHref,
      label: "Call us",
      bg: "var(--dk-primary)",
      icon: <Phone size={18} strokeWidth={2.25} />,
    },
  ];

  return (
    <div
      ref={rootRef}
      className="fixed bottom-[max(20px,env(safe-area-inset-bottom))] right-[max(20px,env(safe-area-inset-right))] z-50 flex flex-col items-end gap-3"
      style={{
        // Force this fixed element onto its own GPU-composited layer. Without this,
        // the always-on `dk-fab-ring` animation inside a `position: fixed` ancestor
        // can make mobile Safari/Chrome mis-paint it mid-scroll — it visually
        // detaches and drifts toward the bottom of the screen until the scroll
        // settles. Promoting the layer keeps it pinned to the viewport throughout.
        transform: "translateZ(0)",
        willChange: "transform",
      }}
    >
      {open && (
        <div className="flex flex-col items-end gap-3">
          {actions.map((action, i) => (
            <a
              key={action.key}
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="dk-fab-pop flex items-center gap-2.5 rounded-full py-2.5 pl-4 pr-5 text-[13.5px] font-semibold text-white no-underline shadow-[0_8px_20px_rgba(0,0,0,0.22)] transition-transform duration-150 hover:scale-105 active:scale-95"
              style={{ backgroundColor: action.bg, animationDelay: `${i * 60}ms` }}
            >
              {action.icon}
              {action.label}
            </a>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close contact options" : "Contact us"}
        className="relative flex h-[58px] w-[58px] items-center justify-center rounded-full text-white shadow-[0_10px_28px_rgba(0,0,0,0.28)] transition-transform duration-200 hover:scale-105 active:scale-95"
        style={{
          background: "linear-gradient(155deg, var(--dk-primary), var(--dk-primary-hover))",
        }}
      >
        {/* Breathing attention ring — quiet enough not to be annoying, sits behind the button. */}
        {!open && (
          <>
            <span
              aria-hidden="true"
              className="dk-fab-ring pointer-events-none absolute inset-0 rounded-full"
              style={{ backgroundColor: "var(--dk-primary)" }}
            />
            <span
              aria-hidden="true"
              className="dk-fab-ring pointer-events-none absolute inset-0 rounded-full"
              style={{ backgroundColor: "var(--dk-primary)", animationDelay: "1s" }}
            />
          </>
        )}

        <span className="relative z-10 grid h-6 w-6 place-items-center">
          <MessageCircle
            size={24}
            strokeWidth={2.25}
            className={`absolute transition-all duration-250 ${open ? "rotate-45 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`}
          />
          <X
            size={24}
            strokeWidth={2.25}
            className={`absolute transition-all duration-250 ${open ? "rotate-0 scale-100 opacity-100" : "-rotate-45 scale-0 opacity-0"}`}
          />
        </span>
      </button>
    </div>
  );
}
