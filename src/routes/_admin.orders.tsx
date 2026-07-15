import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, Download } from "lucide-react";
import { PageShell } from "@/components/admin/page-shell";
import { DataTable, exportCsv, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useCollection, inrFull, type Order } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/orders")({
  head: () => ({ meta: [{ title: "Orders — Arreniux Admin" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const { data } = useCollection<Order>("orders");
  const [tab, setTab] = useState<"All" | Order["type"]>("All");
  const filtered = useMemo(() => tab === "All" ? data : data.filter((o) => o.type === tab), [data, tab]);

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
    { key: "address", header: "Ships to", render: (o) => <span className="line-clamp-1 max-w-[200px] text-xs text-muted-foreground">{o.address}</span> },
    { key: "actions", header: "", render: (o) => (
      <Button asChild size="sm" variant="outline"><Link to="/orders/$id" params={{ id: o.id }}><Eye className="mr-1 h-3.5 w-3.5" /> Details</Link></Button>
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
        <TabsContent value={tab} className="mt-4">
          <DataTable rows={filtered} columns={cols} pageSize={10}
            searchKeys={["id", "customer", "phone", "productName"]}
            onExport={() => {
              exportCsv(`arreniux-orders-${tab.toLowerCase()}.csv`,
                filtered.map((o) => ({ id: o.id, customer: o.customer, phone: o.phone, type: o.type, date: o.date, qty: o.qty, amount: o.qty * o.unitPrice, payment: o.paymentStatus, status: o.status })));
              toast.success("Exported");
            }}
          />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
