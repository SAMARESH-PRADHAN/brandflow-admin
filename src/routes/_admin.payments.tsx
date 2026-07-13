import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, Printer } from "lucide-react";
import { PageShell } from "@/components/admin/page-shell";
import { SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { KpiCard } from "@/components/admin/kpi-card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { payments, inr, kpis } from "@/lib/demo-data";
import { HandCoins, Timer, CreditCard, XCircle } from "lucide-react";

export const Route = createFileRoute("/_admin/payments")({
  head: () => ({
    meta: [
      { title: "Payments & Invoices — ARRHENIUX ERP" },
      { name: "description", content: "Track cash collection, download invoices, and resolve pending or partial payments." },
    ],
  }),
  component: PaymentsPage,
});

const tabs = [
  { value: "all", label: "All", count: payments.length },
  { value: "Paid", label: "Paid", count: payments.filter((p) => p.status === "Paid").length },
  { value: "Pending", label: "Pending", count: payments.filter((p) => p.status === "Pending").length },
  { value: "Partial", label: "Partial", count: payments.filter((p) => p.status === "Partial").length },
  { value: "Failed", label: "Failed", count: payments.filter((p) => p.status === "Failed").length },
];

function PaymentsPage() {
  return (
    <PageShell title="Payments & Invoices" subtitle="Cash collection health and invoice management" tabs={tabs}>
      {(tab, q) => {
        const rows = payments.filter((p) => {
          if (tab !== "all" && p.status !== tab) return false;
          if (q && !p.id.toLowerCase().includes(q.toLowerCase()) && !p.customer.toLowerCase().includes(q.toLowerCase())) return false;
          return true;
        });
        return (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard label="Received" value={inr(kpis.receivedAmount)} delta={9.6} compare="collected" icon={HandCoins} tone="success" seed={31} index={0} />
              <KpiCard label="Pending" value={inr(kpis.pendingAmount)} delta={-4.3} compare="awaiting" icon={Timer} tone="warning" seed={32} index={1} />
              <KpiCard label="Partial" value={inr(kpis.partialAmount)} delta={2.1} compare="escrow" icon={CreditCard} tone="info" seed={33} index={2} />
              <KpiCard label="Failed" value={inr(120400)} delta={-1.1} compare="retry queue" icon={XCircle} tone="destructive" seed={34} index={3} />
            </div>
            <div className="mt-6">
              <SectionCard title={`${rows.length} transactions`} subtitle="Latest first">
                <div className="overflow-x-auto scroll-thin">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Txn ID</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="w-32">Invoice</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((p) => (
                        <TableRow key={p.id} className="group">
                          <TableCell className="font-mono text-xs">{p.id}</TableCell>
                          <TableCell className="font-mono text-xs">{p.orderId}</TableCell>
                          <TableCell className="text-sm">{p.customer}</TableCell>
                          <TableCell className="text-right num font-semibold">{inr(p.amount)}</TableCell>
                          <TableCell className="text-xs">{p.method}</TableCell>
                          <TableCell><StatusBadge value={p.status} /></TableCell>
                          <TableCell className="text-xs text-muted-foreground">{p.date}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8"><FileText className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8"><Printer className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </SectionCard>
            </div>
          </>
        );
      }}
    </PageShell>
  );
}
