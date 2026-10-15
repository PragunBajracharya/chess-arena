import type { InputHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  hint?: string;
}

export function Field({ label, name, hint, ...input }: FieldProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-[14px] font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        className="mt-1.5 h-11 w-full rounded-lg border border-line-strong bg-raised px-3 text-[15px] text-text placeholder:text-faint focus:border-brass focus:outline-none"
        aria-describedby={hint ? `${name}-hint` : undefined}
        {...input}
      />
      {hint && (
        <p id={`${name}-hint`} className="mt-1.5 text-[13px] text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
