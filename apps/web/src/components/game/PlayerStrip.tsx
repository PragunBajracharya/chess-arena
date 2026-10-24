import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";

interface PlayerStripProps {
  name: string;
  image?: string | null;
  detail?: string;
  icon?: ReactNode;
  /** Right-hand slot, usually the clock. */
  aside?: ReactNode;
  active?: boolean;
  /** Marks the signed-in player's own strip. */
  you?: boolean;
}

export function PlayerStrip({ name, image, detail, icon, aside, active, you }: PlayerStripProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={name} image={image} size={36} icon={icon} />
        <div className="min-w-0">
          <p className={`truncate font-medium ${active ? "text-text" : "text-text/90"}`}>
            {name}
            {you && <span className="ml-1.5 font-normal text-muted">(you)</span>}
          </p>
          {detail && <p className="text-[13px] text-muted">{detail}</p>}
        </div>
      </div>
      {aside}
    </div>
  );
}
