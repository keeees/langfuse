import { cn } from "@/src/utils/tailwind";
import { SectionLabelBadge } from "./SectionLabelBadge";
import type { ReactNode } from "react";

export function OverviewTile({
  label,
  heading,
  children,
  className,
}: {
  label: string;
  heading: string;
  children: ReactNode;
  className?: string;
}) {
  const id = `tile-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "border-border bg-card rounded-[var(--radius)] border p-5 shadow-[var(--shadow-md)]",
        className,
      )}
    >
      <SectionLabelBadge label={label} className="mb-3" />
      <h2 id={id} className="text-foreground text-base font-semibold">
        {heading}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
