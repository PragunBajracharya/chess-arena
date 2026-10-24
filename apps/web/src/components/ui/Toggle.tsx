"use client";

import { useId, type ReactNode } from "react";

interface ToggleProps {
  label: string;
  description?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** A labelled on/off switch, one per row. */
export function Toggle({ label, description, checked, onChange }: ToggleProps) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-6 py-3.5">
      <div className="min-w-0">
        <label htmlFor={id} className="text-[15px] font-medium">
          {label}
        </label>
        {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
          checked ? "border-brass bg-brass" : "border-line-strong bg-raised"
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute size-[18px] rounded-full shadow-sm transition-transform ${
            checked ? "translate-x-[21px] bg-brass-ink" : "translate-x-[2px] bg-muted"
          }`}
        />
      </button>
    </div>
  );
}

interface ChoiceProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

/** Segmented control for a handful of exclusive options. */
export function Segmented<T extends string>({ label, value, options, onChange }: ChoiceProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-grid grid-flow-col gap-1 rounded-lg bg-raised p-1"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1.5 text-[14px] ${
            value === o.value
              ? "bg-panel font-medium text-text shadow-sm"
              : "text-muted hover:text-text"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
