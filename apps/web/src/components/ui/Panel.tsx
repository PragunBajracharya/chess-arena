import type { ReactNode } from "react";

interface PanelProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Remove inner padding, e.g. for tables that run edge to edge. */
  flush?: boolean;
}

export function Panel({ title, description, action, children, className = "", flush }: PanelProps) {
  return (
    <section className={`rounded-xl border border-line bg-panel ${className}`}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 px-5 pt-5">
          <div>
            {title && <h2 className="text-[18px] font-semibold leading-tight">{title}</h2>}
            {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={flush ? "pt-4" : "p-5"}>{children}</div>
    </section>
  );
}
