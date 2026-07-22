import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  // Order status
  Placed: "bg-muted text-foreground",
  Confirmed: "bg-info/10 text-info",
  "In Production": "bg-warning/15 text-warning",
  Shipped: "bg-chart-5/10 text-chart-5",
  Delivered: "bg-success/10 text-success",
  Cancelled: "bg-destructive/10 text-destructive",
  // Payments
  Paid: "bg-success/10 text-success",
  Pending: "bg-warning/15 text-warning",
  Partial: "bg-info/10 text-info",
  Failed: "bg-destructive/10 text-destructive",
  Refunded: "bg-muted text-muted-foreground",
  // Order types
  Normal: "bg-secondary text-foreground",
  Bulk: "bg-info/10 text-info",
  B2B: "bg-chart-5/10 text-chart-5",
  "New Collection": "bg-primary/10 text-primary",
  Sample: "bg-warning/15 text-warning",
  // Product / user
  Active: "bg-success/10 text-success",
  Inactive: "bg-muted text-muted-foreground",
  Approved: "bg-success/10 text-success",
  Rejected: "bg-destructive/10 text-destructive",
  Retail: "bg-info/10 text-info",
  "B2B Agent": "bg-chart-5/10 text-chart-5",
  Premium: "bg-primary/10 text-primary",
  Regular: "bg-secondary text-foreground",
  Others: "bg-muted text-muted-foreground",
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold", map[value] ?? "bg-muted text-muted-foreground")}>
      {value}
    </span>
  );
}
