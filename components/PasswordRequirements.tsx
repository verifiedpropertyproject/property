"use client";

import { checkPassword } from "@/lib/passwordPolicy";

/** Live checklist that ticks off each password rule as the user types. */
export default function PasswordRequirements({ password }: { password: string }) {
  const c = checkPassword(password);
  const items = [
    { ok: c.length, label: "At least 8 characters" },
    { ok: c.letter, label: "Contains letters" },
    { ok: c.number, label: "Contains a number" },
    { ok: c.symbol, label: "Contains a symbol (e.g. ! @ # $ %)" },
  ];

  return (
    <ul className="mt-2 space-y-1 text-xs" aria-live="polite">
      {items.map((item) => (
        <li
          key={item.label}
          className={item.ok ? "text-[var(--dk-primary)]" : "text-[var(--dk-muted)]"}
        >
          <span aria-hidden="true" className="mr-1.5 inline-block w-3">
            {item.ok ? "✓" : "•"}
          </span>
          {item.label}
        </li>
      ))}
    </ul>
  );
}
