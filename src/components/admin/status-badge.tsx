import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  Paid: "bg-success/10 text-success ring-success/20",
  Pending: "bg-warning/15 text-warning ring-warning/25",
  Partial: "bg-info/10 text-info ring-info/20",
  Failed: "bg-destructive/10 text-destructive ring-destructive/20",
  Completed: "bg-success/10 text-success ring-success/20",
  Delivered: "bg-chart-2/10 text-chart-2 ring-chart-2/20",
  Processing: "bg-info/10 text-info ring-info/20",
  Cancelled: "bg-destructive/10 text-destructive ring-destructive/20",
  Approved: "bg-success/10 text-success ring-success/20",
  Rejected: "bg-destructive/10 text-destructive ring-destructive/20",
  Bulk: "bg-chart-2/10 text-chart-2 ring-chart-2/20",
  Sample: "bg-warning/15 text-warning ring-warning/25",
  B2B: "bg-chart-5/10 text-chart-5 ring-chart-5/20",
  Categories: "bg-primary/10 text-primary ring-primary/20",
  "New Collection": "bg-info/10 text-info ring-info/20",
  Premium: "bg-primary/10 text-primary ring-primary/20",
  Regular: "bg-muted text-muted-foreground ring-border",
  Product: "bg-primary/10 text-primary ring-primary/20",
  Company: "bg-chart-2/10 text-chart-2 ring-chart-2/20",
  "B2B Agent": "bg-chart-5/10 text-chart-5 ring-chart-5/20",
  Retail: "bg-muted text-muted-foreground ring-border",
};

export function StatusBadge({ value }: { value: string }) {
  const cls = map[value] ?? "bg-muted text-muted-foreground ring-border";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        cls,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {value}
    </span>
  );
}
