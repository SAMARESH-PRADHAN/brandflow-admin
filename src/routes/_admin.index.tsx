import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  IndianRupee, TrendingUp, Wallet, Clock, CheckCircle2, Truck, XCircle,
  ShoppingBag, Package, Users, UserPlus, Layers, Star, Boxes, Sparkles,
  CreditCard, PackageCheck, Timer, HandCoins,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";

import { Topbar } from "@/components/admin/topbar";
import { KpiCard } from "@/components/admin/kpi-card";
import { SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  kpis, inr, revenueDaily, revenueMonthly, orders, payments, reviews,
  topProducts, categorySales, orderStatusBreakdown, paymentStatusBreakdown,
  orderTypeBreakdown, customerGrowth,
} from "@/lib/demo-data";

export const Route = createFileRoute("/_admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard — ARRHENIUX ERP" },
      { name: "description", content: "Business overview: revenue, orders, customers, and operational KPIs across every ARRHENIUX channel." },
    ],
  }),
  component: DashboardPage,
});

const CHART_COLORS = [
  "var(--color-primary)", "var(--color-chart-2)", "var(--color-chart-3)",
  "var(--color-chart-4)", "var(--color-chart-5)", "var(--color-chart-6)",
  "var(--color-info)", "var(--color-warning)",
];

function DashboardPage() {
  const [range, setRange] = useState("monthly");

  const trendData = useMemo(() => {
    if (range === "daily") return revenueDaily.slice(-14);
    if (range === "weekly") return revenueDaily.map((d, i) => ({ label: `W${i + 1}`, revenue: d.revenue * 4, orders: d.orders * 4 })).slice(-12);
    if (range === "yearly") return ["2021", "2022", "2023", "2024", "2025"].map((y, i) => ({ label: y, revenue: 50000000 + i * 32000000, orders: 800 + i * 400 }));
    return revenueMonthly.map((m) => ({ label: m.label, revenue: m.current, orders: Math.round(m.current / 42000) }));
  }, [range]);

  return (
    <>
      <Topbar title="Command Center" subtitle="Real-time overview of every ARRHENIUX channel" />

      <main className="mx-auto w-full max-w-[1600px] space-y-8 p-4 sm:p-6 lg:p-8">
        {/* Hero strip */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/95 via-primary/85 to-primary/60 p-6 text-primary-foreground shadow-xl shadow-primary/25 sm:p-8">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-black/10 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] backdrop-blur">
                <Sparkles className="h-3 w-3" /> Live business pulse
              </div>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                {inr(kpis.totalRevenue)}
                <span className="ml-2 text-base font-medium opacity-80">gross revenue</span>
              </h2>
              <p className="mt-2 max-w-xl text-sm text-primary-foreground/80">
                {kpis.completedOrders + kpis.deliveredOrders} orders fulfilled across {kpis.totalCategories} categories.
                {" "}Received <span className="font-semibold text-white">{inr(kpis.receivedAmount)}</span>,
                pending <span className="font-semibold text-white">{inr(kpis.pendingAmount)}</span>.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" className="bg-white/95 text-primary hover:bg-white">
                  View reports
                </Button>
                <Button variant="outline" size="sm" className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                  Export snapshot
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { label: "Today", value: inr(kpis.todayRevenue), delta: "+12.4%" },
                { label: "This week", value: inr(kpis.weeklyRevenue), delta: "+8.1%" },
                { label: "This month", value: inr(kpis.monthlyRevenue), delta: "+18.7%" },
                { label: "This year", value: inr(kpis.yearlyRevenue), delta: "+34.2%" },
              ].map((m) => (
                <div key={m.label} className="rounded-2xl bg-white/10 p-4 backdrop-blur ring-1 ring-white/15">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-80">{m.label}</div>
                  <div className="mt-1 font-display text-xl font-bold num">{m.value}</div>
                  <div className="text-[11px] font-medium opacity-90">{m.delta} vs prev</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue KPIs */}
        <div>
          <SectionHeader title="Revenue & Payments" hint="Cash movement across every channel" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Today's Revenue" value={inr(kpis.todayRevenue)} delta={12.4} compare="vs yesterday" icon={IndianRupee} tone="primary" seed={1} index={0} />
            <KpiCard label="Weekly Revenue" value={inr(kpis.weeklyRevenue)} delta={8.1} compare="vs last week" icon={TrendingUp} tone="chart-2" seed={2} index={1} />
            <KpiCard label="Monthly Revenue" value={inr(kpis.monthlyRevenue)} delta={18.7} compare="vs last month" icon={TrendingUp} tone="success" seed={3} index={2} />
            <KpiCard label="Yearly Revenue" value={inr(kpis.yearlyRevenue)} delta={34.2} compare="vs last year" icon={TrendingUp} tone="chart-5" seed={4} index={3} />
            <KpiCard label="Total Revenue" value={inr(kpis.totalRevenue)} delta={22.1} compare="all-time" icon={Wallet} tone="primary" seed={5} index={4} />
            <KpiCard label="Received Amount" value={inr(kpis.receivedAmount)} delta={9.6} compare="collected" icon={HandCoins} tone="success" seed={6} index={5} />
            <KpiCard label="Pending Amount" value={inr(kpis.pendingAmount)} delta={-4.3} compare="awaiting" icon={Timer} tone="warning" seed={7} index={6} />
            <KpiCard label="Partial Payments" value={inr(kpis.partialAmount)} delta={2.1} compare="in escrow" icon={CreditCard} tone="info" seed={8} index={7} />
          </div>
        </div>

        {/* Orders KPIs */}
        <div>
          <SectionHeader title="Orders" hint="Fulfillment pipeline and channel mix" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Today's Orders" value={kpis.todayOrders} delta={6.2} compare="vs yesterday" icon={ShoppingBag} tone="primary" seed={11} index={0} />
            <KpiCard label="Pending Orders" value={kpis.pendingOrders} delta={-3.4} compare="need action" icon={Clock} tone="warning" seed={12} index={1} />
            <KpiCard label="Processing" value={kpis.processingOrders} delta={4.1} compare="in production" icon={PackageCheck} tone="info" seed={13} index={2} />
            <KpiCard label="Completed" value={kpis.completedOrders} delta={11.9} compare="this month" icon={CheckCircle2} tone="success" seed={14} index={3} />
            <KpiCard label="Delivered" value={kpis.deliveredOrders} delta={7.8} compare="last 30 days" icon={Truck} tone="chart-2" seed={15} index={4} />
            <KpiCard label="Cancelled" value={kpis.cancelledOrders} delta={-1.2} compare="churn rate" icon={XCircle} tone="destructive" seed={16} index={5} />
            <KpiCard label="Sample Orders" value={kpis.sampleOrders} delta={14.6} compare="lead gen" icon={Boxes} tone="warning" seed={17} index={6} />
            <KpiCard label="Bulk Orders" value={kpis.bulkOrders} delta={22.4} compare="enterprise" icon={Package} tone="chart-5" seed={18} index={7} />
            <KpiCard label="B2B Orders" value={kpis.b2bOrders} delta={16.8} compare="agent channel" icon={Users} tone="chart-2" seed={19} index={8} />
            <KpiCard label="New Collection" value={kpis.newCollectionOrders} delta={31.2} compare="launch buzz" icon={Sparkles} tone="primary" seed={20} index={9} />
          </div>
        </div>

        {/* Catalog KPIs */}
        <div>
          <SectionHeader title="Catalog & Community" hint="Inventory footprint and customer base" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard label="Total Customers" value={kpis.totalCustomers} delta={9.4} compare="retail base" icon={Users} tone="primary" seed={21} index={0} />
            <KpiCard label="Total B2B Agents" value={kpis.totalB2B} delta={12.1} compare="partner network" icon={UserPlus} tone="chart-5" seed={22} index={1} />
            <KpiCard label="Total Categories" value={kpis.totalCategories} delta={0} compare="active taxonomy" icon={Layers} tone="info" seed={23} index={2} />
            <KpiCard label="Total Products" value={kpis.totalProducts} delta={5.2} compare="SKUs live" icon={Package} tone="chart-2" seed={24} index={3} />
            <KpiCard label="Total Reviews" value={kpis.totalReviews} delta={14.3} compare="verified voices" icon={Star} tone="warning" seed={25} index={4} />
          </div>
        </div>

        {/* Revenue trend + Category */}
        <div className="grid gap-6 lg:grid-cols-3">
          <SectionCard
            className="lg:col-span-2"
            title="Revenue trend"
            subtitle="Interactive breakdown of gross bookings"
            action={
              <Tabs value={range} onValueChange={setRange}>
                <TabsList className="h-8 rounded-full bg-muted p-0.5">
                  <TabsTrigger value="daily" className="h-7 rounded-full px-3 text-xs">Daily</TabsTrigger>
                  <TabsTrigger value="weekly" className="h-7 rounded-full px-3 text-xs">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly" className="h-7 rounded-full px-3 text-xs">Monthly</TabsTrigger>
                  <TabsTrigger value="yearly" className="h-7 rounded-full px-3 text-xs">Yearly</TabsTrigger>
                </TabsList>
              </Tabs>
            }
          >
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => inr(v)} width={60} />
                  <Tooltip content={<ChartTooltip valueFormatter={inr} />} />
                  <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#rev-fill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Category sales" subtitle="Share of revenue by category">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categorySales} dataKey="value" nameKey="name" innerRadius={0} outerRadius={100} paddingAngle={2}>
                    {categorySales.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip valueFormatter={inr} />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        {/* Order status + Payment status + Order types */}
        <div className="grid gap-6 lg:grid-cols-3">
          <SectionCard title="Order status" subtitle="Fulfillment funnel">
            <DonutChart data={orderStatusBreakdown} />
          </SectionCard>
          <SectionCard title="Payment status" subtitle="Cash collection health">
            <DonutChart data={paymentStatusBreakdown} inner={0} />
          </SectionCard>
          <SectionCard title="Order types" subtitle="Channel mix">
            <DonutChart data={orderTypeBreakdown} inner={0} />
          </SectionCard>
        </div>

        {/* Top / Low products bar + revenue comparison */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Product sales — top & lowest" subtitle="Units sold over last 30 days">
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts.map((p) => ({ name: p.name.split(" — ")[0], orders: p.orders }))} margin={{ top: 8, right: 8, left: -12, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" height={60} interval={0} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="orders" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Revenue comparison" subtitle="Current month vs previous month">
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueMonthly} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cur" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="prev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={inr} width={60} />
                  <Tooltip content={<ChartTooltip valueFormatter={inr} />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="current" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#cur)" />
                  <Area type="monotone" dataKey="previous" stroke="var(--color-chart-2)" strokeWidth={2.5} fill="url(#prev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        {/* Monthly Sales column + Customer Growth line */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Monthly sales" subtitle="All twelve months at a glance">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueMonthly} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={inr} width={60} />
                  <Tooltip content={<ChartTooltip valueFormatter={inr} />} />
                  <Bar dataKey="current" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Customer growth" subtitle="Monthly registrations">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={customerGrowth} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="customers" stroke="var(--color-chart-2)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--color-chart-2)" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        {/* Tables */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Latest orders" subtitle="Newest bookings across all channels" action={<Button variant="ghost" size="sm">View all</Button>}>
            <div className="overflow-x-auto scroll-thin">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.slice(0, 7).map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.id}</TableCell>
                      <TableCell className="max-w-[140px] truncate">{o.customer}</TableCell>
                      <TableCell className="text-right num font-semibold">{inr(o.amount)}</TableCell>
                      <TableCell><StatusBadge value={o.paymentStatus} /></TableCell>
                      <TableCell><StatusBadge value={o.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>

          <SectionCard title="Latest payments" subtitle="Recent transactions" action={<Button variant="ghost" size="sm">View all</Button>}>
            <div className="overflow-x-auto scroll-thin">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Txn</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.slice(0, 7).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.id}</TableCell>
                      <TableCell className="max-w-[140px] truncate">{p.customer}</TableCell>
                      <TableCell className="text-right num font-semibold">{inr(p.amount)}</TableCell>
                      <TableCell className="text-xs">{p.method}</TableCell>
                      <TableCell><StatusBadge value={p.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>

          <SectionCard title="Recent reviews" subtitle="Latest voice of customer" action={<Button variant="ghost" size="sm">View all</Button>}>
            <ul className="space-y-4">
              {reviews.slice(0, 5).map((r) => (
                <li key={r.id} className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{r.avatar}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-sm font-semibold">{r.customer}</div>
                      <div className="flex items-center gap-0.5 text-warning">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-current" : "opacity-25"}`} />
                        ))}
                      </div>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{r.product}</div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/90">{r.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Top selling products" subtitle="By units in last 30 days" action={<Button variant="ghost" size="sm">View all</Button>}>
            <div className="overflow-x-auto scroll-thin">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.slice(0, 6).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-lg">{p.image}</div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">{p.name}</div>
                            <div className="truncate text-[11px] text-muted-foreground">{p.category}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right num font-semibold">{p.orders}</TableCell>
                      <TableCell className="text-right num font-semibold">{inr(p.orders * p.price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
        </div>
      </main>
    </>
  );
}

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight">{title}</h2>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

function DonutChart({ data, inner = 55 }: { data: { name: string; value: number }[]; inner?: number }) {
  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={inner} outerRadius={95} paddingAngle={3}>
            {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TooltipPayload {
  name?: string | number;
  value?: number;
  color?: string;
  dataKey?: string | number;
}
function ChartTooltip({ active, payload, label, valueFormatter }: {
  active?: boolean; payload?: TooltipPayload[]; label?: string | number;
  valueFormatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-xl">
      {label !== undefined && <div className="mb-1 font-semibold">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name ?? p.dataKey}</span>
          <span className="ml-auto font-semibold num">{valueFormatter ? valueFormatter(Number(p.value ?? 0)) : p.value}</span>
        </div>
      ))}
    </div>
  );
}
