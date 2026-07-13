import { createFileRoute } from "@tanstack/react-router";
import { Check, X, Trash2, MessageCircleReply, Star } from "lucide-react";
import { PageShell } from "@/components/admin/page-shell";
import { SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { reviews } from "@/lib/demo-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/reviews")({
  head: () => ({
    meta: [
      { title: "Reviews — ARRHENIUX ERP" },
      { name: "description", content: "Moderate product and company reviews across every channel." },
    ],
  }),
  component: ReviewsPage,
});

const tabs = [
  { value: "all", label: "All", count: reviews.length },
  { value: "Product", label: "Product Reviews", count: reviews.filter((r) => r.type === "Product").length },
  { value: "Company", label: "Company Reviews", count: reviews.filter((r) => r.type === "Company").length },
];

function ReviewsPage() {
  return (
    <PageShell title="Reviews" subtitle="Voice of customer — product and company" tabs={tabs}>
      {(tab, q) => {
        const rows = reviews.filter((r) => {
          if (tab !== "all" && r.type !== tab) return false;
          if (q && !r.customer.toLowerCase().includes(q.toLowerCase()) && !r.product.toLowerCase().includes(q.toLowerCase())) return false;
          return true;
        });
        return (
          <SectionCard title={`${rows.length} reviews`} subtitle="Approve, reject, or reply">
            <ul className="grid gap-4 md:grid-cols-2">
              {rows.map((r) => (
                <li key={r.id} className="rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{r.avatar}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold">{r.customer}</div>
                        <StatusBadge value={r.status} />
                        <StatusBadge value={r.type} />
                        <span className="ml-auto text-[11px] text-muted-foreground">{r.date}</span>
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{r.product}</div>
                      <div className="mt-1 flex gap-0.5 text-warning">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-current" : "opacity-25"}`} />
                        ))}
                      </div>
                      <p className="mt-2 text-sm">{r.text}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-success" onClick={() => toast.success("Review approved")}>
                          <Check className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => toast("Reply drafted")}>
                          <MessageCircleReply className="h-3.5 w-3.5" /> Reply
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-destructive" onClick={() => toast.error("Review rejected")}>
                          <X className="h-3.5 w-3.5" /> Reject
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-destructive">
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        );
      }}
    </PageShell>
  );
}
