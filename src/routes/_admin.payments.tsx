import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CreditCard, CheckCircle2, Clock, RefreshCw, Wallet, Banknote, TrendingUp } from "lucide-react";
import { PageShell } from "@/components/admin/page-shell";
import { KpiCard } from "@/components/admin/kpi-card";
import { SectionCard } from "@/components/admin/section-card";
import { DataTable, exportCsv, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, inr, inrFull, type Payment } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/payments")({
  head: () => ({ meta: [{ title: "Payments — Arreniux Admin" }] }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const { data } = useCollection<Payment>("payments");
  const [range, setRange] = useState("All");

  const filtered = useMemo(() => {
    if (range === "All") return data;
    const days = range === "Daily" ? 1 : range === "Weekly" ? 7 : range === "Monthly" ? 30 : 365;
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
    return data.filter((p) => new Date(p.date) >= cutoff);
  }, [data, range]);

  const stats = useMemo(() => {
    const total = filtered.reduce((a, p) => a + p.amount, 0);
    const paid = filtered.filter((p) => p.status === "Paid");
    const pending = filtered.filter((p) => p.status === "Pending");
    const refunded = filtered.filter((p) => p.status === "Refunded");
    const cod = filtered.filter((p) => p.method === "COD");
    const online = filtered.filter((p) => p.method !== "COD");
    return {
      total, paid: paid.reduce((a, p) => a + p.amount, 0),
      pending: pending.reduce((a, p) => a + p.amount, 0),
      refunded: refunded.reduce((a, p) => a + p.amount, 0),
      cod: cod.reduce((a, p) => a + p.amount, 0),
      online: online.reduce((a, p) => a + p.amount, 0),
      successRate: filtered.length ? (paid.length / filtered.length) * 100 : 0,
    };
  }, [filtered]);

  const cols: Column<Payment>[] = [
    { key: "id", header: "Transaction ID", render: (p) => <span className="font-mono text-xs">{p.id}</span> },
    { key: "customer", header: "Customer", render: (p) => <span className="text-sm font-semibold">{p.customer}</span> },
    { key: "order", header: "Order", render: (p) => <span className="font-mono text-xs">{p.orderId}</span> },
    { key: "amount", header: "Amount", render: (p) => <span className="num text-sm font-semibold">{inrFull(p.amount)}</span>, sortable: true, getValue: (p) => p.amount, className: "text-right" },
    { key: "method", header: "Method", render: (p) => <span className="text-xs">{p.method}</span> },
    { key: "status", header: "Status", render: (p) => <StatusBadge value={p.status} /> },
    { key: "date", header: "Date", render: (p) => <span className="text-xs text-muted-foreground">{p.date}</span>, sortable: true, getValue: (p) => p.date },
  ];

  return (
    <PageShell title="Payments" subtitle="Razorpay (demo) — transactions and gateway health">
      <Tabs value={range} onValueChange={setRange}>
        <TabsList>
          <TabsTrigger value="All">All</TabsTrigger>
          <TabsTrigger value="Daily">Daily</TabsTrigger>
          <TabsTrigger value="Weekly">Weekly</TabsTrigger>
          <TabsTrigger value="Monthly">Monthly</TabsTrigger>
          <TabsTrigger value="Yearly">Yearly</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Total Payments" value={inr(stats.total)} icon={CreditCard} tone="primary" index={0} />
        <KpiCard label="Completed" value={inr(stats.paid)} icon={CheckCircle2} tone="success" index={1} />
        <KpiCard label="Pending" value={inr(stats.pending)} icon={Clock} tone="warning" index={2} />
        <KpiCard label="Refunded" value={inr(stats.refunded)} icon={RefreshCw} tone="destructive" index={3} />
        <KpiCard label="COD" value={inr(stats.cod)} icon={Banknote} tone="info" index={4} />
        <KpiCard label="Online" value={inr(stats.online)} icon={Wallet} tone="chart-5" index={5} />
        <KpiCard label="Success Rate" value={`${stats.successRate.toFixed(1)}%`} icon={TrendingUp} tone="success" index={6} />
        <KpiCard label="Transactions" value={filtered.length} icon={CreditCard} tone="primary" index={7} />
      </div>

      <SectionCard title="Recent Payments" subtitle={`${filtered.length} transactions`}>
        <DataTable rows={filtered} columns={cols} pageSize={10} searchKeys={["id", "customer", "orderId", "method"]}
          onExport={() => { exportCsv("arreniux-payments.csv", filtered); toast.success("Exported"); }} />
      </SectionCard>
    </PageShell>
  );
}
