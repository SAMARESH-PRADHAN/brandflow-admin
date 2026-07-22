import { useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { PageShell } from "@/components/admin/page-shell";
import { SectionCard } from "@/components/admin/section-card";
// import { StatusBadge } from "@/components/admin/status-badge";
import { Input } from "@/components/ui/input";
// import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, type Review } from "@/lib/store";


function ReviewsPage() {
  const { data } = useCollection<Review>("reviews");
  // const [tab, setTab] = useState<"All" | Review["status"]>("All");
  const [q, setQ] = useState("");

  const filtered = useMemo(
  () =>
    data.filter(
      (r) =>
        !q ||
        r.customer.toLowerCase().includes(q.toLowerCase()) ||
        r.product.toLowerCase().includes(q.toLowerCase())
    ),
  [data, q]
);

  const avg = data.reduce((a, r) => a + r.rating, 0) / (data.length || 1);
  const dist = [5, 4, 3, 2, 1].map((s) => ({ star: `${s}★`, count: data.filter((r) => r.rating === s).length }));

  return (
    <PageShell title="Reviews" subtitle="Moderate customer feedback and product reviews">
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Average Rating" className="lg:col-span-1">
          <div className="grid place-items-center py-4">
            <div className="font-display text-6xl num">{avg.toFixed(1)}</div>
            <div className="mt-2 text-warning text-xl">{"★".repeat(Math.round(avg))}<span className="text-muted-foreground">{"★".repeat(5 - Math.round(avg))}</span></div>
            <div className="mt-2 text-xs text-muted-foreground">{data.length} reviews</div>
          </div>
        </SectionCard>
        <SectionCard title="Rating Distribution" className="lg:col-span-2">
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={dist} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 90%)" />
                <XAxis type="number" stroke="hsl(0 0% 45%)" fontSize={11} />
                <YAxis dataKey="star" type="category" stroke="hsl(0 0% 45%)" fontSize={11} width={40} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(354 78% 47%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <SectionCard
  title="Latest Reviews"
  subtitle={`${filtered.length} shown`}
        actions={
          <>
            <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="w-52" />
            {/* <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList>
                <TabsTrigger value="All">All</TabsTrigger>
                <TabsTrigger value="Pending">Pending</TabsTrigger>
                <TabsTrigger value="Approved">Approved</TabsTrigger>
                <TabsTrigger value="Rejected">Rejected</TabsTrigger>
              </TabsList>
            </Tabs> */}
          </>
        }
      >
        <div className="space-y-3">
          {filtered.slice(0, 20).map((r) => (
            <div key={r.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {r.customer}
                    {r.verified && <span className="rounded-full bg-info/10 px-2 py-0.5 text-[10px] font-semibold text-info">Verified</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{r.product} • {r.orderId} • {r.date}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-warning">{"★".repeat(r.rating)}<span className="text-muted">{"★".repeat(5 - r.rating)}</span></span>
                  {/* <StatusBadge value={r.status} /> */}
                </div>
              </div>
              <p className="mt-2 text-sm">{r.comment}</p>
            </div>
          ))}
          {filtered.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No reviews match your filter</div>}
        </div>
      </SectionCard>
    </PageShell>
  );
}

export default ReviewsPage;
