import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-brass text-brass-ink hover:bg-brass-strong",
  secondary: "border border-line-strong bg-raised text-text hover:border-faint",
  ghost: "text-muted hover:bg-raised hover:text-text",
  danger: "border border-line-strong text-loss hover:border-loss",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-[15px]",
  lg: "h-12 px-6 text-[15px]",
};

/** Class names for a button, so links can look like buttons too. */
export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`.trim();
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type,
  ...rest
}: ButtonProps) {
  return (
    <button type={type ?? "button"} className={buttonClass(variant, size, className)} {...rest} />
  );
}
