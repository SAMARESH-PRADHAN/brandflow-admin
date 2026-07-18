import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { Eye, Filter } from "lucide-react";
import { PageShell } from "@/components/admin/page-shell";
import { DataTable, exportCsv, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { DateRangeFilter, inRange, type DateRange } from "@/components/admin/date-range-filter";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCollection, inrFull, type Order, type OrderStatus } from "@/lib/store";
import { toast } from "sonner";

const STATUSES: (OrderStatus | "All")[] = ["All", "Placed", "Confirmed", "In Production", "Shipped", "Delivered"];

function OrdersPage() {
  const { data } = useCollection<Order>("orders");
  const [tab, setTab] = useState<"All" | Order["type"]>("All");
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });
  const [status, setStatus] = useState<"All" | OrderStatus>("All");

  const filtered = useMemo(() => data.filter((o) =>
    (tab === "All" || o.type === tab) &&
    (status === "All" || o.status === status) &&
    inRange(o.date, range)
  ), [data, tab, range, status]);

  const cols: Column<Order>[] = [
    { key: "id", header: "Order ID", render: (o) => <span className="font-mono text-xs">{o.id}</span>, sortable: true, getValue: (o) => o.id },
    { key: "customer", header: "Customer", render: (o) => (
      <div><div className="text-sm font-semibold">{o.customer}</div><div className="text-[11px] text-muted-foreground">{o.phone}</div></div>
    ) },
    { key: "type", header: "Type", render: (o) => <StatusBadge value={o.type} /> },
    { key: "date", header: "Date", render: (o) => <span className="text-xs text-muted-foreground">{o.date}</span>, sortable: true, getValue: (o) => o.date },
    { key: "amount", header: "Amount", render: (o) => <span className="num text-sm font-semibold">{inrFull(o.qty * o.unitPrice)}</span>, sortable: true, getValue: (o) => o.qty * o.unitPrice, className: "text-right" },
    { key: "payment", header: "Payment", render: (o) => <StatusBadge value={o.paymentStatus} /> },
    { key: "status", header: "Status", render: (o) => <StatusBadge value={o.status} /> },
    { key: "logo", header: "Artwork", render: (o) => o.uploadedLogo ? <img src={o.uploadedLogo} alt="artwork" className="h-8 w-12 rounded border border-border object-cover" /> : <span className="text-[10px] text-muted-foreground">—</span> },
    { key: "actions", header: "", render: (o) => (
      <Button asChild size="sm" variant="outline"><Link to={`/orders/${o.id}`}><Eye className="mr-1 h-3.5 w-3.5" /> Details</Link></Button>
    ), className: "text-right" },
  ];

  return (
    <PageShell title="All Orders" subtitle="Normal, Bulk, B2B and New Collection orders in one place">
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="All">All ({data.length})</TabsTrigger>
          <TabsTrigger value="Normal">Normal ({data.filter((o) => o.type === "Normal").length})</TabsTrigger>
          <TabsTrigger value="Bulk">Bulk ({data.filter((o) => o.type === "Bulk").length})</TabsTrigger>
          <TabsTrigger value="B2B">B2B ({data.filter((o) => o.type === "B2B").length})</TabsTrigger>
          <TabsTrigger value="New Collection">New Collection ({data.filter((o) => o.type === "New Collection").length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <DateRangeFilter value={range} onChange={setRange} label="Order date" />
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

      <div className="mt-4">
        <DataTable rows={filtered} columns={cols} pageSize={10}
          searchKeys={["id", "customer", "phone", "productName"]}
          onExport={() => {
            exportCsv(`arreniux-orders-${tab.toLowerCase()}.csv`,
              filtered.map((o) => ({ id: o.id, customer: o.customer, phone: o.phone, type: o.type, date: o.date, qty: o.qty, amount: o.qty * o.unitPrice, payment: o.paymentStatus, status: o.status })));
            toast.success("Exported filtered rows");
          }}
        />
      </div>
    </PageShell>
  );
}

export default OrdersPage;
