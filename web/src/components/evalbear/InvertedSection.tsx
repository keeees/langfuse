import { cn } from "@/src/utils/tailwind";
import type { ReactNode } from "react";

export function InvertedSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-foreground text-background relative rounded-[var(--radius)] p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
