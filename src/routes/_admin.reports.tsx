import { createFileRoute } from "@tanstack/react-router";
import { Download, FileSpreadsheet, FileText, FileType } from "lucide-react";
import { Topbar } from "@/components/admin/topbar";
import { SectionCard } from "@/components/admin/section-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { inr, orders, categorySales } from "@/lib/demo-data";

export const Route = createFileRoute("/_admin/reports")({
  head: () => ({
    meta: [
      { title: "Reports — ARRHENIUX ERP" },
      { name: "description", content: "Professional reports across revenue, sales, GST, and every commerce channel." },
    ],
  }),
  component: ReportsPage,
});

const reportTypes = [
  { key: "revenue", label: "Revenue Report", desc: "Gross & net revenue by day/month" },
  { key: "sales", label: "Sales Report", desc: "Units, AOV, conversion rate" },
  { key: "product", label: "Product Report", desc: "SKU-level performance" },
  { key: "category", label: "Category Report", desc: "Share of revenue by category" },
  { key: "customer", label: "Customer Report", desc: "New / repeat / churn cohorts" },
  { key: "bulk", label: "Bulk Order Report", desc: "Enterprise fulfillment" },
  { key: "sample", label: "Sample Order Report", desc: "Lead-gen sampling" },
  { key: "b2b", label: "B2B Report", desc: "Partner agent performance" },
  { key: "payment", label: "Payment Report", desc: "Collection & aging" },
  { key: "gst", label: "GST Report", desc: "Tax filing ready" },
];

function ReportsPage() {
  return (
    <>
      <Topbar title="Reports" subtitle="Filter, preview, and export professional business reports" />
      <main className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
        <SectionCard title="Filters" subtitle="Refine what your report will contain">
          <div className="flex flex-wrap items-center gap-3">
            <Tabs defaultValue="monthly">
              <TabsList className="h-9 rounded-full bg-muted p-1">
                <TabsTrigger value="today" className="h-7 rounded-full px-3 text-xs">Today</TabsTrigger>
                <TabsTrigger value="weekly" className="h-7 rounded-full px-3 text-xs">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="h-7 rounded-full px-3 text-xs">Monthly</TabsTrigger>
                <TabsTrigger value="yearly" className="h-7 rounded-full px-3 text-xs">Yearly</TabsTrigger>
                <TabsTrigger value="custom" className="h-7 rounded-full px-3 text-xs">Custom range</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.success("Excel export queued")}><FileSpreadsheet className="h-4 w-4" /> Excel</Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.success("CSV export queued")}><FileType className="h-4 w-4" /> CSV</Button>
              <Button size="sm" className="gap-1.5" onClick={() => toast.success("PDF export queued")}><FileText className="h-4 w-4" /> PDF</Button>
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {reportTypes.map((r) => (
            <div key={r.key} className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"><Download className="h-4 w-4" /></Button>
              </div>
              <div className="mt-3 text-sm font-bold">{r.label}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{r.desc}</div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 h-8 text-xs">Preview</Button>
                <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => toast.success(`${r.label} downloaded`)}>Download</Button>
              </div>
            </div>
          ))}
        </div>

        <SectionCard title="Sample: revenue snapshot" subtitle="This month">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Gross revenue</div>
              <div className="mt-1 font-display text-2xl font-bold num">{inr(orders.reduce((a, b) => a + b.amount, 0))}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">GST collected (5%)</div>
              <div className="mt-1 font-display text-2xl font-bold num">{inr(orders.reduce((a, b) => a + b.amount, 0) * 0.05)}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Top category</div>
              <div className="mt-1 font-display text-2xl font-bold">{categorySales.sort((a, b) => b.value - a.value)[0]!.name}</div>
            </div>
          </div>
        </SectionCard>
      </main>
    </>
  );
}
