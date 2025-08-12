import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "active" | "paused" | "completed" | "pending";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    active: "bg-chart-4 text-white border-chart-4",
    paused: "bg-chart-3 text-white border-chart-3",
    completed: "bg-chart-1 text-white border-chart-1",
    pending: "bg-chart-2 text-white border-chart-2",
  };

  return (
    <Badge
      className={cn(
        "border-2 font-base text-xs px-2 py-1 rounded-base shadow-shadow",
        variants[status],
        className
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
