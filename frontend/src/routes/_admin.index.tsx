import { Link } from "react-router-dom";
import { useMemo } from "react";
import {
  ShoppingCart, Clock, CheckCircle2, ClipboardList, Users, Boxes, Star, IndianRupee,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";
import { PageShell } from "@/components/admin/page-shell";
import { KpiCard } from "@/components/admin/kpi-card";
import { SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { useCollection, inr, inrFull } from "@/lib/store";
import type { Order, Product, Customer, Review, Payment } from "@/lib/store";


function DashboardPage() {
  const { data: products } = useCollection<Product>("products");
  const { data: orders } = useCollection<Order>("orders");
  const { data: samples } = useCollection<Order>("sampleOrders");
  const { data: customers } = useCollection<Customer>("customers");
  const { data: reviews } = useCollection<Review>("reviews");
  const { data: payments } = useCollection<Payment>("payments");

  const stats = useMemo(() => {
    const revenue = orders.reduce((a, o) => a + o.qty * o.unitPrice, 0);
    return {
      revenue,
      totalOrders: orders.length,
      pending: orders.filter((o) => o.status === "Placed" || o.status === "Confirmed").length,
      completed: orders.filter((o) => o.status === "Delivered").length,
      sampleOrders: samples.length,
      customers: customers.length,
      products: products.length,
      reviews: reviews.length,
      pendingPayments: payments.filter((p) => p.status === "Pending").reduce((a, p) => a + p.amount, 0),
      todaySales: orders.filter((o) => o.date === new Date().toISOString().slice(0, 10)).reduce((a, o) => a + o.qty * o.unitPrice, 0),
    };
  }, [orders, samples, customers, reviews, products, payments]);

  const monthly = useMemo(() => {
    const map: Record<string, { label: string; revenue: number; orders: number }> = {};
    for (const o of orders) {
      const m = o.date.slice(0, 7);
      map[m] ??= { label: m, revenue: 0, orders: 0 };
      map[m].revenue += o.qty * o.unitPrice;
      map[m].orders += 1;
    }
    return Object.values(map).sort((a, b) => a.label.localeCompare(b.label)).slice(-8);
  }, [orders]);

  const orderTypes = useMemo(() => {
    const types = ["Normal", "Bulk", "B2B", "New Collection"] as const;
    return types.map((t) => ({ name: t, value: orders.filter((o) => o.type === t).length }));
  }, [orders]);

  const categorySales = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of orders) map[o.category] = (map[o.category] ?? 0) + o.qty * o.unitPrice;
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [orders]);

  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const o of orders) {
      map[o.productId] ??= { name: o.productName, qty: 0, revenue: 0 };
      map[o.productId]!.qty += o.qty;
      map[o.productId]!.revenue += o.qty * o.unitPrice;
    }
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  }, [orders]);

  const weekly = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      return { label: d.toLocaleDateString(undefined, { weekday: "short" }), orders: orders.filter((o) => o.date === key).length };
    });
    return days;
  }, [orders]);

  const COLORS = ["hsl(354 78% 47%)", "hsl(0 0% 12%)", "hsl(152 65% 40%)", "hsl(35 92% 50%)", "hsl(217 91% 55%)", "hsl(280 65% 50%)"];

  const latestOrders = orders.slice(0, 6);

  return (
    <PageShell title="Dashboard" subtitle="Real-time overview of your Arreniux business">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Total Revenue" value={inr(stats.revenue)} delta={12.4} icon={IndianRupee} tone="primary" index={0} />
        <KpiCard label="Total Orders" value={stats.totalOrders} delta={8.2} icon={ShoppingCart} tone="info" index={1} />
        <KpiCard label="Pending Orders" value={stats.pending} delta={-3.1} icon={Clock} tone="warning" index={2} />
        <KpiCard label="Completed" value={stats.completed} delta={5.6} icon={CheckCircle2} tone="success" index={3} />
        <KpiCard label="Sample Orders" value={stats.sampleOrders} icon={ClipboardList} tone="chart-5" index={4} />
        <KpiCard label="Total Customers" value={stats.customers} delta={4.3} icon={Users} tone="info" index={5} />
        <KpiCard label="Total Products" value={stats.products} icon={Boxes} tone="primary" index={6} />
        <KpiCard label="Total Reviews" value={stats.reviews} icon={Star} tone="warning" index={7} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Monthly Revenue" subtitle="Last 8 months" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(354 78% 47%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(354 78% 47%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 90%)" />
                <XAxis dataKey="label" stroke="hsl(0 0% 45%)" fontSize={11} />
                <YAxis stroke="hsl(0 0% 45%)" fontSize={11} tickFormatter={inr} />
                <Tooltip formatter={(v: number) => inrFull(v)} contentStyle={{ borderRadius: 12, border: "1px solid hsl(0 0% 90%)" }} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(354 78% 47%)" strokeWidth={2} fill="url(#revG)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
        <SectionCard title="Order Types" subtitle="Distribution">
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={orderTypes} dataKey="value" nameKey="name" outerRadius={80} innerRadius={45} paddingAngle={2}>
                  {orderTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Category Wise Sales">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={categorySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 90%)" />
                <XAxis dataKey="name" stroke="hsl(0 0% 45%)" fontSize={10} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis stroke="hsl(0 0% 45%)" fontSize={11} tickFormatter={inr} />
                <Tooltip formatter={(v: number) => inrFull(v)} />
                <Bar dataKey="value" fill="hsl(354 78% 47%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
        <SectionCard title="Weekly Orders" subtitle="Last 7 days">
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 90%)" />
                <XAxis dataKey="label" stroke="hsl(0 0% 45%)" fontSize={11} />
                <YAxis stroke="hsl(0 0% 45%)" fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="orders" stroke="hsl(0 0% 10%)" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Latest Orders" className="lg:col-span-2">
          <div className="space-y-2">
            {latestOrders.map((o) => (
              <Link key={o.id} to={`/orders/${o.id}`} className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-3 transition hover:bg-secondary">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{o.customer}</div>
                  <div className="truncate text-xs text-muted-foreground">{o.id} • {o.productName}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="num text-sm font-semibold">{inr(o.qty * o.unitPrice)}</span>
                  <StatusBadge value={o.status} />
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Top Products" subtitle="By revenue">
          <div className="space-y-2">
            {topProducts.map((p, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{i + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground">{p.qty} sold</div>
                </div>
                <div className="num text-xs font-semibold">{inr(p.revenue)}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

    </PageShell>
  );
}

export default DashboardPage;
