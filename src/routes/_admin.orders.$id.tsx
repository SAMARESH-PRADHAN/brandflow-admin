import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowLeft, Download, Printer, CheckCircle2, Circle } from "lucide-react";
import { PageShell } from "@/components/admin/page-shell";
import { SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { useCollection, inrFull, type Order, type OrderStatus } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/orders/$id")({
  head: () => ({ meta: [{ title: "Order Details — Arreniux Admin" }] }),
  component: OrderDetail,
});

const STATUS_FLOW: OrderStatus[] = ["Placed", "Confirmed", "In Production", "Shipped", "Delivered"];

function OrderDetail() {
  const { id } = useParams({ from: "/_admin/orders/$id" });
  const { data: orders } = useCollection<Order>("orders");
  const { data: samples } = useCollection<Order>("sampleOrders");
  const order = useMemo(() => [...orders, ...samples].find((o) => o.id === id), [orders, samples, id]);

  if (!order) {
    return (
      <PageShell title="Order not found">
        <SectionCard><div className="py-8 text-center text-sm text-muted-foreground">
          Order <b>{id}</b> does not exist.
          <div className="mt-4"><Button asChild variant="outline"><Link to="/orders"><ArrowLeft className="mr-1 h-4 w-4" /> Back to orders</Link></Button></div>
        </div></SectionCard>
      </PageShell>
    );
  }

  const subtotal = order.qty * order.unitPrice;
  const gst = subtotal * (order.gstPct / 100);
  const grand = subtotal + gst + order.shipping;

  return (
    <PageShell
      title={`Order ${order.id}`} subtitle={`${order.type}${order.isSample ? " • Sample" : ""} • ${order.date}`}
      actions={<>
        <Button variant="outline" onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" /> Print</Button>
        <Button onClick={() => { window.print(); toast.success("PDF ready — use browser Save as PDF"); }}><Download className="mr-1 h-4 w-4" /> Download PDF</Button>
        <Button asChild variant="outline"><Link to="/orders"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Link></Button>
      </>}
    >
      <div className="print-area grid gap-4 lg:grid-cols-3">
        <SectionCard title="Customer" className="lg:col-span-1">
          <div className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Name: </span><b>{order.customer}</b></div>
            <div><span className="text-muted-foreground">Phone: </span>{order.phone}</div>
            <div><span className="text-muted-foreground">Email: </span>{order.email}</div>
            <div><span className="text-muted-foreground">Address: </span>{order.address}</div>
          </div>
        </SectionCard>

        <SectionCard title="Product" className="lg:col-span-2">
          <div className="grid gap-3 md:grid-cols-2 text-sm">
            <Row label="Product Code" value={order.productCode} />
            <Row label="Product Name" value={order.productName} />
            <Row label="Category" value={order.category} />
            <Row label="Product Type" value={order.productType} />
            <Row label="Sub Category" value={order.subCategory} />
            <Row label="Material" value={order.material} />
            <Row label="Print Type" value={order.printType} />
            <Row label="Print Location" value={order.printLocation} />
          </div>
          <div className="mt-3 rounded-lg bg-secondary/40 p-3 text-xs">{order.description}</div>
          {order.uploadedLogo && (
            <div className="mt-3">
              <div className="mb-1 text-xs font-semibold text-muted-foreground">Uploaded Logo</div>
              <img src={order.uploadedLogo} alt="logo" className="max-h-24 rounded-lg border border-border" />
            </div>
          )}
        </SectionCard>

        <SectionCard title="Size breakdown" className="lg:col-span-2">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {["S", "M", "L", "XL", "XXL"].map((s) => (
              <div key={s} className="rounded-xl border border-border p-3 text-center">
                <div className="text-[11px] font-semibold uppercase text-muted-foreground">{s}</div>
                <div className="font-display text-xl num">{order.sizes?.[s] ?? 0}</div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Invoice">
          <div className="space-y-2 text-sm">
            <Line k="Quantity" v={order.qty.toString()} />
            <Line k="Unit Price" v={inrFull(order.unitPrice)} />
            <Line k="Subtotal" v={inrFull(subtotal)} />
            <Line k={`GST (${order.gstPct}%)`} v={inrFull(gst)} />
            <Line k="Shipping" v={inrFull(order.shipping)} />
            <div className="mt-2 border-t border-border pt-2">
              <Line k="Grand Total" v={inrFull(grand)} bold />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge value={order.paymentStatus} />
              <StatusBadge value={order.status} />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Timeline" className="lg:col-span-3">
          <div className="grid gap-3 md:grid-cols-5">
            {STATUS_FLOW.map((s, i) => {
              const idx = STATUS_FLOW.indexOf(order.status);
              const active = i <= idx;
              return (
                <div key={s} className={`rounded-xl border p-3 ${active ? "border-success/40 bg-success/5" : "border-border bg-secondary/30"}`}>
                  <div className={`flex items-center gap-2 ${active ? "text-success" : "text-muted-foreground"}`}>
                    {active ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    <span className="text-xs font-semibold uppercase tracking-wider">{s}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {order.timeline.find((t) => t.status === s)?.at ?? "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div><span className="text-muted-foreground">{label}: </span><b>{value}</b></div>;
}
function Line({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return <div className="flex items-center justify-between"><span className="text-muted-foreground">{k}</span><span className={`num ${bold ? "font-display text-lg" : ""}`}>{v}</span></div>;
}
