import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Eye, Pencil, Printer } from "lucide-react";
import { PageShell } from "@/components/admin/page-shell";
import { SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { orders, inr } from "@/lib/demo-data";

export const Route = createFileRoute("/_admin/orders")({
  head: () => ({
    meta: [
      { title: "Orders — ARRHENIUX ERP" },
      { name: "description", content: "All order channels — Categories, Bulk, Sample, B2B, and New Collection." },
    ],
  }),
  component: OrdersPage,
});

const tabs = [
  { value: "all", label: "All Orders", count: orders.length },
  { value: "Categories", label: "Categories", count: orders.filter((o) => o.type === "Categories").length },
  { value: "Bulk", label: "Bulk", count: orders.filter((o) => o.type === "Bulk").length },
  { value: "Sample", label: "Sample", count: orders.filter((o) => o.type === "Sample").length },
  { value: "B2B", label: "B2B", count: orders.filter((o) => o.type === "B2B").length },
  { value: "New Collection", label: "New Collection", count: orders.filter((o) => o.type === "New Collection").length },
];

function OrdersPage() {
  return (
    <PageShell title="Order Management" subtitle="Every booking, every channel, every status" tabs={tabs}>
      {(tab, q) => {
        const rows = orders.filter((o) => {
          if (tab !== "all" && o.type !== tab) return false;
          if (q && !o.id.toLowerCase().includes(q.toLowerCase()) && !o.customer.toLowerCase().includes(q.toLowerCase())) return false;
          return true;
        });
        return <OrderTable rows={rows} />;
      }}
    </PageShell>
  );
}

function OrderTable({ rows }: { rows: typeof orders }) {
  const totals = useMemo(() => ({
    revenue: rows.reduce((a, b) => a + b.amount, 0),
    orders: rows.length,
  }), [rows]);

  return (
    <SectionCard
      title={`${totals.orders} orders`}
      subtitle={`Gross value ${inr(totals.revenue)}`}
    >
      <div className="overflow-x-auto scroll-thin">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0, 20).map((o) => (
              <TableRow key={o.id} className="group">
                <TableCell className="font-mono text-xs">{o.id}</TableCell>
                <TableCell>
                  <div className="text-sm font-semibold">{o.customer}</div>
                  <div className="text-[11px] text-muted-foreground">{o.company}</div>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-sm">{o.product}</TableCell>
                <TableCell className="text-right num">{o.qty}</TableCell>
                <TableCell className="text-right num font-semibold">{inr(o.amount)}</TableCell>
                <TableCell><StatusBadge value={o.type} /></TableCell>
                <TableCell><StatusBadge value={o.paymentStatus} /></TableCell>
                <TableCell><StatusBadge value={o.status} /></TableCell>
                <TableCell className="text-xs text-muted-foreground">{o.date}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button size="icon" variant="ghost" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8"><Printer className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </SectionCard>
  );
}
