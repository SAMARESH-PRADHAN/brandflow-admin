import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { PageShell } from "@/components/admin/page-shell";
import { DataTable, exportCsv, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useCollection, inrFull, type Order } from "@/lib/store";
import { toast } from "sonner";


function SamplesPage() {
  const { data } = useCollection<Order>("sampleOrders");
  const [tab, setTab] = useState<"All" | Order["type"]>("All");
  const filtered = useMemo(() => tab === "All" ? data : data.filter((o) => o.type === tab), [data, tab]);

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
    { key: "actions", header: "", render: (o) => (
      <Button asChild size="sm" variant="outline"><Link to={`/orders/${o.id}`}><Eye className="mr-1 h-3.5 w-3.5" /> View</Link></Button>
    ), className: "text-right" },
  ];

  return (
    <PageShell title="Sample Orders" subtitle="Every sample is qty 1 — segment by channel">
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="All">All ({data.length})</TabsTrigger>
          <TabsTrigger value="Normal">Normal Samples</TabsTrigger>
          <TabsTrigger value="Bulk">Bulk Samples</TabsTrigger>
          <TabsTrigger value="B2B">B2B Samples</TabsTrigger>
          <TabsTrigger value="New Collection">New Collection Samples</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <DataTable rows={filtered} columns={cols} pageSize={10} searchKeys={["id", "customer", "productName"]}
            onExport={() => { exportCsv("arreniux-samples.csv", filtered.map((o) => ({ id: o.id, customer: o.customer, product: o.productName, type: o.type, date: o.date, amount: o.qty * o.unitPrice, status: o.status }))); toast.success("Exported"); }}
          />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

export default SamplesPage;
