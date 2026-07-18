import { cn } from "@/src/utils/tailwind";

export function CapabilityCard({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <article
      tabIndex={-1}
      className={cn(
        "border-border bg-card/70 rounded-2xl border p-5 shadow-[var(--shadow-sm)] backdrop-blur",
        "motion-safe:transition-[box-shadow,transform] motion-safe:duration-200",
        "motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[var(--shadow-md)]",
        "motion-reduce:transition-none",
        className,
      )}
    >
      <h3 className="text-foreground text-sm font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2 text-xs leading-5">
        {description}
      </p>
    </article>
  );
}
