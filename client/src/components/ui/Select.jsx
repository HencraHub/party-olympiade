import { useState, useRef, useEffect } from "react";

/**
 * Custom glass-style select dropdown — replaces native <select>.
 * options: [{ value, label, description? }]
 */
export default function Select({
  label,
  value,
  onChange,
  options,
  className = "",
  description,
  placeholder = "— select —",
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className={`relative ${className}`} ref={ref}>
      {label && <label className="label">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input-field text-left flex items-center justify-between gap-2 w-full"
      >
        <span className={selected ? "text-white" : "text-white/30"}>
          {selected?.label ?? placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-muted shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div
          className="absolute z-50 top-full mt-1 w-full rounded-xl overflow-hidden border border-white/15 shadow-2xl"
          style={{
            background: "rgba(10,8,30,0.98)",
            backdropFilter: "blur(24px)",
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-purple-500/15 border-b border-white/5 last:border-b-0 ${
                value === opt.value
                  ? "text-purple-light bg-purple-500/10"
                  : "text-white"
              }`}
            >
              <span className="font-medium">{opt.label}</span>
              {opt.description && (
                <p className="text-xs text-white/40 mt-0.5">
                  {opt.description}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {description && <p className="text-xs text-muted mt-1">{description}</p>}
    </div>
  );
}
