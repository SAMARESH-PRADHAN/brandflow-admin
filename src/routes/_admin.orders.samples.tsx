import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { Eye, Filter } from "lucide-react";
import { PageShell } from "@/components/admin/page-shell";
import { DataTable, exportCsv, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { DateRangeFilter, inRange, type DateRange } from "@/components/admin/date-range-filter";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCollection, inrFull, type Order, type OrderStatus } from "@/lib/store";
import { toast } from "sonner";

const SAMPLE_TYPES = ["All", "Normal", "B2B"] as const;
const STATUSES: (OrderStatus | "All")[] = ["All", "Placed", "Confirmed", "In Production", "Shipped", "Delivered"];

function SamplesPage() {
  const { data } = useCollection<Order>("sampleOrders");
  // Only Normal and B2B samples supported now
  const scoped = useMemo(() => data.filter((o) => o.type === "Normal" || o.type === "B2B"), [data]);
  const [tab, setTab] = useState<(typeof SAMPLE_TYPES)[number]>("All");
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });
  const [status, setStatus] = useState<"All" | OrderStatus>("All");

  const filtered = useMemo(() => scoped.filter((o) =>
    (tab === "All" || o.type === tab) &&
    (status === "All" || o.status === status) &&
    inRange(o.date, range)
  ), [scoped, tab, range, status]);

  const cols: Column<Order>[] = [
    { key: "id", header: "Sample ID", render: (o) => <span className="font-mono text-xs">{o.id}</span> },
    { key: "customer", header: "Customer", render: (o) => (
      <div><div className="text-sm font-semibold">{o.customer}</div><div className="text-[11px] text-muted-foreground">{o.phone}</div></div>
    ) },
    { key: "product", header: "Product", render: (o) => <span className="text-sm">{o.productName}</span> },
    { key: "type", header: "Type", render: (o) => <StatusBadge value={o.type} /> },
    { key: "date", header: "Date", render: (o) => <span className="text-xs text-muted-foreground">{o.date}</span> },
    { key: "amount", header: "Amount", render: (o) => <span className="num text-sm font-semibold">{inrFull(o.qty * o.unitPrice)}</span>, className: "text-right" },
    { key: "status", header: "Status", render: (o) => <StatusBadge value={o.status} /> },
    { key: "logo", header: "Artwork", render: (o) => o.uploadedLogo ? <img src={o.uploadedLogo} alt="artwork" className="h-8 w-12 rounded border border-border object-cover" /> : <span className="text-[10px] text-muted-foreground">—</span> },
    { key: "actions", header: "", render: (o) => (
      <Button asChild size="sm" variant="outline"><Link to={`/orders/${o.id}`}><Eye className="mr-1 h-3.5 w-3.5" /> View</Link></Button>
    ), className: "text-right" },
  ];

  return (
    <PageShell title="Sample Orders" subtitle="Normal and B2B samples only — qty 1 each">
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="All">All ({scoped.length})</TabsTrigger>
          <TabsTrigger value="Normal">Normal Samples</TabsTrigger>
          <TabsTrigger value="B2B">B2B Samples</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <DateRangeFilter value={range} onChange={setRange} label="Sample date" />
            <div className="flex items-end gap-2 rounded-xl border border-border bg-secondary/30 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Filter className="h-4 w-4" /> Status</div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                  <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DataTable rows={filtered} columns={cols} pageSize={10} searchKeys={["id", "customer", "productName"]}
            onExport={() => { exportCsv("arreniux-samples.csv", filtered.map((o) => ({ id: o.id, customer: o.customer, product: o.productName, type: o.type, date: o.date, amount: o.qty * o.unitPrice, status: o.status }))); toast.success("Exported filtered rows"); }}
          />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

export default SamplesPage;
