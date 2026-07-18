import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Eye, ExternalLink } from "lucide-react";
import { PageShell } from "@/components/admin/page-shell";
import { SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCollection, inrFull, type Order, type OrderStatus } from "@/lib/store";
import { toast } from "sonner";

const STATUSES: OrderStatus[] = ["Placed", "Confirmed", "In Production", "Shipped", "Delivered"];
const COLORS: Record<OrderStatus, string> = {
  "Placed": "bg-muted-foreground/20 text-foreground border-muted",
  "Confirmed": "bg-info/10 text-info border-info/30",
  "In Production": "bg-warning/15 text-warning border-warning/30",
  "Shipped": "bg-chart-5/10 text-chart-5 border-chart-5/30",
  "Delivered": "bg-success/10 text-success border-success/30",
};

function KanbanPage() {
  const { data, update } = useCollection<Order>("orders");
  const [preview, setPreview] = useState<Order | null>(null);

  const grouped = useMemo(() => {
    const m: Record<OrderStatus, Order[]> = { Placed: [], Confirmed: [], "In Production": [], Shipped: [], Delivered: [] };
    for (const o of data) m[o.status].push(o);
    return m;
  }, [data]);

  const advance = (o: Order) => {
    const idx = STATUSES.indexOf(o.status);
    if (idx >= STATUSES.length - 1) { toast("Already Delivered"); return; }
    const next = STATUSES[idx + 1]!;
    update(o.id, {
      status: next,
      timeline: [...o.timeline, { status: next, at: new Date().toISOString().slice(0, 10) }],
    });
    toast.success(`${o.id} → ${next}`);
  };

  return (
    <PageShell title="Order Updation" subtitle="Kanban flow — click a card to preview details">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {STATUSES.map((s) => (
          <div key={s} className="flex min-h-[400px] flex-col rounded-2xl border border-border bg-secondary/30 p-3">
            <div className={`mb-3 inline-flex items-center justify-between rounded-xl border px-3 py-2 ${COLORS[s]}`}>
              <span className="text-xs font-bold uppercase tracking-wider">{s}</span>
              <span className="num text-xs font-bold">{grouped[s].length}</span>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto scroll-thin">
              {grouped[s].slice(0, 12).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setPreview(o)}
                  className="w-full rounded-xl border border-border bg-card p-3 text-left shadow-[var(--shadow-soft)] transition hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-mono text-muted-foreground">{o.id}</div>
                      <div className="truncate text-sm font-semibold">{o.customer}</div>
                    </div>
                    <span className="num text-xs font-semibold">{inrFull(o.qty * o.unitPrice)}</span>
                  </div>
                  <div className="mt-1 truncate text-[11px] text-muted-foreground">{o.productName}</div>
                  {s !== "Delivered" && (
                    <Button
                      size="sm" variant="outline" className="mt-2 w-full"
                      onClick={(e) => { e.stopPropagation(); advance(o); }}
                    >
                      Advance <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  )}
                </button>
              ))}
              {grouped[s].length === 0 && <div className="py-6 text-center text-xs text-muted-foreground">No orders</div>}
            </div>
          </div>
        ))}
      </div>

      <SectionCard title="Status legend" subtitle="Every status has its own semantic color">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <span key={s} className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${COLORS[s]}`}>{s}</span>
          ))}
        </div>
      </SectionCard>

      <Dialog open={!!preview} onOpenChange={(v) => !v && setPreview(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {preview?.id}
              {preview && <StatusBadge value={preview.status} />}
              {preview && <StatusBadge value={preview.paymentStatus} />}
            </DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border p-3">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Customer</div>
                  <div className="text-sm font-semibold">{preview.customer}</div>
                  <div className="text-xs text-muted-foreground">{preview.phone}</div>
                  <div className="text-xs text-muted-foreground">{preview.email}</div>
                  <div className="mt-1 text-xs">{preview.address}</div>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Order Info</div>
                  <Info k="Type" v={preview.type} />
                  <Info k="Date" v={preview.date} />
                  <Info k="Payment" v={`${preview.paymentStatus} • ${preview.paymentMethod}`} />
                  <Info k="Amount" v={inrFull(preview.qty * preview.unitPrice)} />
                </div>
              </div>
              <div className="rounded-xl border border-border p-3">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Product</div>
                <div className="text-sm font-semibold">{preview.productCode} — {preview.productName}</div>
                <div className="text-xs text-muted-foreground">{preview.category} • {preview.subCategory} • {preview.material}</div>
                <div className="mt-1 text-xs">Qty <b>{preview.qty}</b> • {preview.printType} @ {preview.printLocation}</div>
              </div>
              {preview.uploadedLogo && (
                <div className="rounded-xl border border-border p-3">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Customer Artwork</div>
                  <img src={preview.uploadedLogo} alt="artwork" className="max-h-40 rounded-lg border border-border object-contain" />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button asChild variant="outline"><Link to={`/orders/${preview.id}`}><ExternalLink className="mr-1 h-4 w-4" /> Full details</Link></Button>
                {preview.status !== "Delivered" && (
                  <Button onClick={() => { advance(preview); setPreview(null); }}>
                    Advance status <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>;
}

// keep Eye unused-imports friendly
void Eye;

export default KanbanPage;
