import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label, value, delta, icon: Icon, tone = "primary", index = 0, hint,
}: {
  label: string; value: ReactNode; delta?: number;
  icon: LucideIcon; tone?: "primary" | "success" | "warning" | "info" | "destructive" | "chart-5";
  index?: number; hint?: string;
}) {
  const toneCls: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning",
    info: "bg-info/10 text-info",
    destructive: "bg-destructive/10 text-destructive",
    "chart-5": "bg-chart-5/10 text-chart-5",
  };
  const positive = (delta ?? 0) >= 0;
  return (
    <div
      className="group rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)] animate-in-up"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
          <div className="mt-2 font-display text-2xl num">{value}</div>
          {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
        </div>
        <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", toneCls[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {typeof delta === "number" && (
        <div className="mt-3">
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
            positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {positive ? "+" : ""}{delta.toFixed(1)}%
          </span>
          <span className="ml-2 text-[11px] text-muted-foreground">vs last period</span>
        </div>
      )}
    </div>
  );
}
