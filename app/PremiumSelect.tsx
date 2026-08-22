"use client";

import { useEffect, useRef, useState } from "react";

type Option = { value: string; label: string };

interface PremiumSelectProps {
  name: string;
  label: string;
  options: Option[];
  defaultValue?: string;
  placeholder?: string;
}

export default function PremiumSelect({
  name,
  label,
  options,
  defaultValue = "",
  placeholder = "Any",
}: PremiumSelectProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="dk-field" ref={rootRef}>
      <label className="dk-field-label">{label}</label>
      <div className={`dk-select${open ? " dk-select-open" : ""}`}>
        <button
          type="button"
          className="dk-select-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span className={selected ? "" : "dk-select-placeholder"}>{selected ? selected.label : placeholder}</span>
          <svg className="dk-select-chevron" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M1 1.5L6 6.5L11 1.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <ul className="dk-select-panel" role="listbox">
          <li
            role="option"
            aria-selected={value === ""}
            className={`dk-select-option${value === "" ? " dk-select-option-active" : ""}`}
            onClick={() => {
              setValue("");
              setOpen(false);
            }}
          >
            {placeholder}
          </li>
          {options.map((o) => (
            <li
              key={o.value}
              role="option"
              aria-selected={value === o.value}
              className={`dk-select-option${value === o.value ? " dk-select-option-active" : ""}`}
              onClick={() => {
                setValue(o.value);
                setOpen(false);
              }}
            >
              {o.label}
            </li>
          ))}
        </ul>
      </div>

      {/* keeps the field submitting with the plain GET <form>, same as a native select */}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
