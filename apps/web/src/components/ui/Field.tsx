import type { InputHTMLAttributes, ReactNode } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  hint?: ReactNode;
  /** Replaces the hint and marks the input invalid. */
  error?: string | null;
  /** Shown at the right end of the label row, e.g. a "Forgot password?" link. */
  labelAside?: ReactNode;
}

export function Field({ label, name, hint, error, labelAside, id, ...input }: FieldProps) {
  const inputId = id ?? name;
  const note = error ?? hint;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={inputId} className="block text-[14px] font-medium">
          {label}
        </label>
        {labelAside}
      </div>
      <input
        id={inputId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? `${inputId}-note` : undefined}
        className={`mt-1.5 h-11 w-full rounded-lg border bg-raised px-3 text-[15px] text-text placeholder:text-faint focus:outline-none disabled:opacity-60 ${
          error ? "border-loss focus:border-loss" : "border-line-strong focus:border-brass"
        }`}
        {...input}
      />
      {note && (
        <p
          id={`${inputId}-note`}
          className={`mt-1.5 text-[13px] ${error ? "text-loss" : "text-muted"}`}
        >
          {note}
        </p>
      )}
    </div>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-lg bg-loss/10 px-3 py-2 text-[14px] text-loss">
      {children}
    </p>
  );
}

export function FormNotice({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="rounded-lg bg-win/10 px-3 py-2 text-[14px] text-text">
      {children}
    </p>
  );
}
