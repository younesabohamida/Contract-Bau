import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { money } from "@/lib/format";

export function StatCard({
  label,
  value,
  icon,
  tone = "default",
  hint,
}: {
  label: string;
  value: number;
  icon?: ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "primary";
  hint?: string;
}) {
  const tones: Record<string, string> = {
    default: "text-foreground",
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
  };
  return (
    <div className="card-soft p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </div>
      <p className={cn("mt-2 text-xl font-bold tabular-nums", tones[tone])}>{money(value)}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
