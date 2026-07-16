import { createFileRoute } from "react-router-dom";
import { useMemo, useState } from "react";
import { Download, IndianRupee, ShoppingCart, Users, Package, TrendingUp, ClipboardList } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { PageShell } from "@/components/admin/page-shell";
import { KpiCard } from "@/components/admin/kpi-card";
import { SectionCard } from "@/components/admin/section-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, inr, inrFull, type Order, type Customer, type Product, type Payment } from "@/lib/store";
import { exportCsv } from "@/components/admin/data-table";
import { toast } from "sonner";


const COLORS = ["hsl(354 78% 47%)", "hsl(0 0% 12%)", "hsl(152 65% 40%)", "hsl(35 92% 50%)", "hsl(217 91% 55%)", "hsl(280 65% 50%)"];

function AnalyticsPage() {
  const { data: orders } = useCollection<Order>("orders");
  const { data: samples } = useCollection<Order>("sampleOrders");
  const { data: customers } = useCollection<Customer>("customers");
  const { data: products } = useCollection<Product>("products");
  const { data: payments } = useCollection<Payment>("payments");
  const [range, setRange] = useState("Monthly");

  const filtered = useMemo(() => {
    const days = range === "Daily" ? 1 : range === "Weekly" ? 7 : range === "Monthly" ? 30 : range === "Yearly" ? 365 : 9999;
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
    return orders.filter((o) => new Date(o.date) >= cutoff);
  }, [orders, range]);

  const revenue = filtered.reduce((a, o) => a + o.qty * o.unitPrice, 0);
  const stats = { revenue, orders: filtered.length, customers: customers.length, productsSold: filtered.reduce((a, o) => a + o.qty, 0), aov: filtered.length ? revenue / filtered.length : 0, samples: samples.length };

  const monthly = useMemo(() => {
    const m: Record<string, { label: string; revenue: number; orders: number }> = {};
    for (const o of orders) {
      const k = o.date.slice(0, 7);
      m[k] ??= { label: k, revenue: 0, orders: 0 };
      m[k].revenue += o.qty * o.unitPrice;
      m[k].orders += 1;
    }
    return Object.values(m).sort((a, b) => a.label.localeCompare(b.label)).slice(-12);
  }, [orders]);

  const catSales = useMemo(() => {
    const m: Record<string, number> = {};
    for (const o of filtered) m[o.category] = (m[o.category] ?? 0) + o.qty * o.unitPrice;
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const topProducts = useMemo(() => {
    const m: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const o of filtered) {
      m[o.productId] ??= { name: o.productName, qty: 0, revenue: 0 };
      m[o.productId]!.qty += o.qty;
      m[o.productId]!.revenue += o.qty * o.unitPrice;
    }
    return Object.values(m).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  }, [filtered]);

  const topCustomers = useMemo(() => {
    const m: Record<string, { name: string; total: number }> = {};
    for (const o of filtered) {
      m[o.customerId] ??= { name: o.customer, total: 0 };
      m[o.customerId]!.total += o.qty * o.unitPrice;
    }
    return Object.values(m).sort((a, b) => b.total - a.total).slice(0, 6);
  }, [filtered]);

  const orderTypes = useMemo(() =>
    (["Normal", "Bulk", "B2B", "New Collection"] as const).map((t) => ({ name: t, value: filtered.filter((o) => o.type === t).length })),
  [filtered]);

  const payMethod = useMemo(() => {
    const methods = ["UPI", "Credit Card", "Net Banking", "COD", "Wallet"];
    return methods.map((m) => ({ name: m, value: payments.filter((p) => p.method === m).length }));
  }, [payments]);

  return (
    <PageShell title="Analytics" subtitle="Business performance & trend analysis"
      actions={<Button onClick={() => {
        exportCsv("arreniux-analytics-report.csv", monthly);
        toast.success("Report downloaded");
      }}><Download className="mr-1 h-4 w-4" /> Download Report</Button>}>
      <Tabs value={range} onValueChange={setRange}>
        <TabsList>
          <TabsTrigger value="Daily">Daily</TabsTrigger>
          <TabsTrigger value="Weekly">Weekly</TabsTrigger>
          <TabsTrigger value="Monthly">Monthly</TabsTrigger>
          <TabsTrigger value="Yearly">Yearly</TabsTrigger>
          <TabsTrigger value="All">All Time</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Revenue" value={inr(stats.revenue)} icon={IndianRupee} tone="primary" delta={12.4} index={0} />
        <KpiCard label="Orders" value={stats.orders} icon={ShoppingCart} tone="info" delta={8.1} index={1} />
        <KpiCard label="Customers" value={stats.customers} icon={Users} tone="success" delta={4.5} index={2} />
        <KpiCard label="Products Sold" value={stats.productsSold} icon={Package} tone="chart-5" delta={9.3} index={3} />
        <KpiCard label="Avg Order Value" value={inr(stats.aov)} icon={TrendingUp} tone="warning" delta={2.7} index={4} />
        <KpiCard label="Sample Orders" value={stats.samples} icon={ClipboardList} tone="destructive" index={5} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Revenue Trend" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 90%)" />
                <XAxis dataKey="label" stroke="hsl(0 0% 45%)" fontSize={11} />
                <YAxis stroke="hsl(0 0% 45%)" fontSize={11} tickFormatter={inr} />
                <Tooltip formatter={(v: number) => inrFull(v)} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(354 78% 47%)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
        <SectionCard title="Order Types">
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={orderTypes} dataKey="value" nameKey="name" outerRadius={80} innerRadius={45}>
                  {orderTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Sales by Category" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={catSales}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 90%)" />
                <XAxis dataKey="name" stroke="hsl(0 0% 45%)" fontSize={10} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis stroke="hsl(0 0% 45%)" fontSize={11} tickFormatter={inr} />
                <Tooltip formatter={(v: number) => inrFull(v)} />
                <Bar dataKey="value" fill="hsl(354 78% 47%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Payment Methods">
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={payMethod} dataKey="value" nameKey="name" outerRadius={80}>
                  {payMethod.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Top Products" className="lg:col-span-1">
          <div className="space-y-2">
            {topProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                <div className="min-w-0"><div className="truncate text-xs font-semibold">{p.name}</div><div className="text-[11px] text-muted-foreground">{p.qty} sold</div></div>
                <span className="num text-xs font-semibold">{inr(p.revenue)}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Top Customers" className="lg:col-span-1">
          <div className="space-y-2">
            {topCustomers.map((c, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                <div className="text-xs font-semibold">{c.name}</div>
                <span className="num text-xs font-semibold">{inr(c.total)}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Top Categories" className="lg:col-span-1">
          <div className="space-y-2">
            {catSales.slice(0, 6).map((c, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                <div className="text-xs font-semibold">{c.name}</div>
                <span className="num text-xs font-semibold">{inr(c.value)}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}

export default AnalyticsPage;
