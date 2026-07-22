import { Calendar, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export type DateRange = { from: string; to: string };

export function DateRangeFilter({
  value, onChange, label = "Date range",
}: {
  value: DateRange; onChange: (v: DateRange) => void; label?: string;
}) {
  const clear = () => onChange({ from: "", to: "" });
  const active = value.from || value.to;
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-secondary/30 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Calendar className="h-4 w-4" /> {label}
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">From</Label>
        <Input type="date" value={value.from} onChange={(e) => onChange({ ...value, from: e.target.value })} className="h-8 w-40" />
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">To</Label>
        <Input type="date" value={value.to} onChange={(e) => onChange({ ...value, to: e.target.value })} className="h-8 w-40" />
      </div>
      {active && (
        <Button size="sm" variant="ghost" onClick={clear}>
          <X className="mr-1 h-3.5 w-3.5" /> Clear
        </Button>
      )}
    </div>
  );
}

export function inRange(date: string, range: DateRange) {
  if (!range.from && !range.to) return true;
  if (range.from && date < range.from) return false;
  if (range.to && date > range.to) return false;
  return true;
}
