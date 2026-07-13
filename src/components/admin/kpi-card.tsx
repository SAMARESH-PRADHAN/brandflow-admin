import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { sparkline } from "@/lib/demo-data";

type Tone = "primary" | "success" | "warning" | "info" | "destructive" | "chart-2" | "chart-5";

export interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: number;
  compare?: string;
  icon: LucideIcon;
  tone?: Tone;
  seed?: number;
  index?: number;
}

const toneMap: Record<Tone, { bg: string; text: string; stroke: string; fill: string }> = {
  primary: { bg: "bg-primary/10", text: "text-primary", stroke: "var(--color-primary)", fill: "var(--color-primary)" },
  success: { bg: "bg-success/10", text: "text-success", stroke: "var(--color-success)", fill: "var(--color-success)" },
  warning: { bg: "bg-warning/15", text: "text-warning", stroke: "var(--color-warning)", fill: "var(--color-warning)" },
  info: { bg: "bg-info/10", text: "text-info", stroke: "var(--color-info)", fill: "var(--color-info)" },
  destructive: { bg: "bg-destructive/10", text: "text-destructive", stroke: "var(--color-destructive)", fill: "var(--color-destructive)" },
  "chart-2": { bg: "bg-chart-2/10", text: "text-chart-2", stroke: "var(--color-chart-2)", fill: "var(--color-chart-2)" },
  "chart-5": { bg: "bg-chart-5/10", text: "text-chart-5", stroke: "var(--color-chart-5)", fill: "var(--color-chart-5)" },
};

export function KpiCard({
  label, value, delta, compare, icon: Icon, tone = "primary", seed = 1, index = 0,
}: KpiCardProps) {
  const t = toneMap[tone];
  const positive = (delta ?? 0) >= 0;
  const data = sparkline(seed);

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-16px_rgba(15,23,42,0.16)] animate-in-up"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className={cn("pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-40 blur-2xl", t.bg)} />

      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 font-display text-2xl font-bold tracking-tight num">
            {value}
          </div>
        </div>
        <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", t.bg, t.text)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="relative mt-4 flex items-end justify-between gap-3">
        <div>
          {typeof delta === "number" && (
            <div className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
            )}>
              {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {positive ? "+" : ""}{delta.toFixed(1)}%
            </div>
          )}
          {compare && <div className="mt-1 text-[11px] text-muted-foreground">{compare}</div>}
        </div>
        <div className="h-10 w-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`spark-${seed}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={t.fill} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={t.fill} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={t.stroke} strokeWidth={2} fill={`url(#spark-${seed})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
