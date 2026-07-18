import { cn } from "@/src/utils/tailwind";
import { Button } from "@/src/components/ui/button";
import { Loader2 } from "lucide-react";

export function EmptyState({
  heading,
  description,
  action,
  className,
}: {
  heading: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-col items-center py-10 text-center", className)}
    >
      <h3 className="text-foreground text-sm font-semibold">{heading}</h3>
      {description && (
        <p className="text-muted-foreground mt-1 max-w-xs text-xs">
          {description}
        </p>
      )}
      {action && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse space-y-3 py-6", className)}>
      <div className="bg-muted h-3 w-3/4 rounded" />
      <div className="bg-muted h-3 w-1/2 rounded" />
      <div className="bg-muted h-3 w-2/3 rounded" />
    </div>
  );
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-10", className)}>
      <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
    </div>
  );
}

export function ErrorState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-col items-center py-10 text-center", className)}
    >
      <h3 className="text-danger text-sm font-semibold">{title}</h3>
      {description && (
        <p className="text-muted-foreground mt-1 max-w-xs text-xs">
          {description}
        </p>
      )}
      {action && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
