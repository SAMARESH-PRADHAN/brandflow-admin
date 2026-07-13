import { createFileRoute } from "@tanstack/react-router";
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { Topbar } from "@/components/admin/topbar";
import { SectionCard } from "@/components/admin/section-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  revenueMonthly, categorySales, orderTypeBreakdown, customerGrowth,
  paymentStatusBreakdown, orderStatusBreakdown, inr, topProducts,
} from "@/lib/demo-data";

export const Route = createFileRoute("/_admin/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — ARRHENIUX ERP" },
      { name: "description", content: "Advanced analytics across revenue, sales, customers, products, orders, and every commerce channel." },
    ],
  }),
  component: AnalyticsPage,
});

const CHART_COLORS = [
  "var(--color-primary)", "var(--color-chart-2)", "var(--color-chart-3)",
  "var(--color-chart-4)", "var(--color-chart-5)", "var(--color-chart-6)",
];

const modules = [
  { key: "revenue", label: "Revenue" },
  { key: "sales", label: "Sales" },
  { key: "customer", label: "Customer" },
  { key: "product", label: "Product" },
  { key: "order", label: "Order" },
  { key: "payment", label: "Payment" },
  { key: "b2b", label: "B2B" },
  { key: "sample", label: "Sample" },
  { key: "newcol", label: "New Collection" },
  { key: "arx", label: "ARRHENIUX" },
];

function AnalyticsPage() {
  return (
    <>
      <Topbar title="Analytics" subtitle="Deep dives across every dimension of the business" />
      <main className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
        <Tabs defaultValue="revenue">
          <TabsList className="h-11 flex-wrap gap-1 rounded-full bg-muted p-1">
            {modules.map((m) => (
              <TabsTrigger key={m.key} value={m.key} className="h-9 rounded-full px-4 text-xs">{m.label}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="revenue" className="mt-6 grid gap-6 lg:grid-cols-2">
            <SectionCard title="Revenue over 12 months" subtitle="Current vs previous year">
              <ChartBox>
                <LineChart data={revenueMonthly}>
                  <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={inr} width={60} />
                  <Tooltip formatter={(v: number) => inr(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="current" stroke="var(--color-primary)" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="previous" stroke="var(--color-chart-2)" strokeWidth={2.5} strokeDasharray="4 4" />
                </LineChart>
              </ChartBox>
            </SectionCard>

            <SectionCard title="Revenue by category" subtitle="Share of total booking value">
              <ChartBox>
                <BarChart data={categorySales} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={inr} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={140} />
                  <Tooltip formatter={(v: number) => inr(v)} />
                  <Bar dataKey="value" fill="var(--color-primary)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ChartBox>
            </SectionCard>
          </TabsContent>

          <TabsContent value="sales" className="mt-6 grid gap-6 lg:grid-cols-2">
            <SectionCard title="Top selling products">
              <ChartBox>
                <BarChart data={topProducts.map((p) => ({ name: p.name.split(" — ")[0], v: p.orders }))}>
                  <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={70} interval={0} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="v" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartBox>
            </SectionCard>
            <SectionCard title="Channel mix (radar)">
              <ChartBox>
                <RadarChart data={orderTypeBreakdown}>
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis tick={{ fontSize: 10 }} />
                  <Radar dataKey="value" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.35} />
                </RadarChart>
              </ChartBox>
            </SectionCard>
          </TabsContent>

          <TabsContent value="customer" className="mt-6">
            <SectionCard title="Customer growth" subtitle="Monthly new registrations">
              <ChartBox height={360}>
                <LineChart data={customerGrowth}>
                  <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="customers" stroke="var(--color-chart-5)" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ChartBox>
            </SectionCard>
          </TabsContent>

          <TabsContent value="product" className="mt-6 grid gap-6 lg:grid-cols-2">
            <SectionCard title="Category share">
              <PieCard data={categorySales} />
            </SectionCard>
            <SectionCard title="Top SKUs">
              <ChartBox>
                <BarChart data={topProducts.slice(0, 6).map((p) => ({ name: p.code, v: p.orders * p.price }))}>
                  <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={inr} width={60} />
                  <Tooltip formatter={(v: number) => inr(v)} />
                  <Bar dataKey="v" fill="var(--color-chart-4)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartBox>
            </SectionCard>
          </TabsContent>

          <TabsContent value="order" className="mt-6"><SectionCard title="Order status breakdown"><PieCard data={orderStatusBreakdown} /></SectionCard></TabsContent>
          <TabsContent value="payment" className="mt-6"><SectionCard title="Payment status breakdown"><PieCard data={paymentStatusBreakdown} /></SectionCard></TabsContent>
          <TabsContent value="b2b" className="mt-6"><SectionCard title="B2B channel"><PieCard data={orderTypeBreakdown} /></SectionCard></TabsContent>
          <TabsContent value="sample" className="mt-6"><SectionCard title="Sample orders"><PieCard data={orderTypeBreakdown} /></SectionCard></TabsContent>
          <TabsContent value="newcol" className="mt-6"><SectionCard title="New collection performance"><PieCard data={categorySales.slice(0, 4)} /></SectionCard></TabsContent>
          <TabsContent value="arx" className="mt-6"><SectionCard title="ARRHENIUX signature line"><PieCard data={categorySales.slice(0, 5)} /></SectionCard></TabsContent>
        </Tabs>
      </main>
    </>
  );
}

function ChartBox({ children, height = 320 }: { children: React.ReactElement; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
    </div>
  );
}
function PieCard({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ChartBox>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={110} paddingAngle={3}>
          {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Pie>
        <Tooltip />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ChartBox>
  );
}
