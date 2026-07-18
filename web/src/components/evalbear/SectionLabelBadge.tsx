import { cn } from "@/src/utils/tailwind";

export function SectionLabelBadge({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "border-accent bg-accent-soft inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5",
        className,
      )}
    >
      <span
        className="bg-accent h-[7px] w-[7px] rounded-full motion-safe:animate-[evalbear-pulse-dot_2s_ease-in-out_infinite]"
        aria-hidden="true"
      />
      <span className="text-accent font-mono text-[10px] font-medium tracking-[0.12em] uppercase">
        {label}
      </span>
    </span>
  );
}
