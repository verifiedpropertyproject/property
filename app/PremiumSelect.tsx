"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type Option = { value: string; label: string };

interface PremiumSelectProps {
  name: string;
  label?: string;
  options: Option[];
  defaultValue?: string;
  placeholder?: string;
  icon?: React.ReactNode;
}

export default function PremiumSelect({
  name,
  label,
  options,
  defaultValue = "",
  placeholder = "Any",
  icon,
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
      {label && <label className="dk-field-label">{label}</label>}
      <div className={`dk-select${open ? " dk-select-open" : ""}`}>
        <button
          type="button"
          className="dk-select-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="dk-select-trigger-inner">
            {icon && <span className="dk-select-icon">{icon}</span>}
            <span className={selected ? "" : "dk-select-placeholder"}>{selected ? selected.label : placeholder}</span>
          </span>
          <ChevronDown className="dk-select-chevron" size={15} strokeWidth={2} />
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
