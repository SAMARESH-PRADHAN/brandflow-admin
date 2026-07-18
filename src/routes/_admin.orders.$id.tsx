import { Link, useParams } from "react-router-dom";
import { useMemo } from "react";
import { ArrowLeft, Download, FileDown, Image as ImageIcon, CheckCircle2, Circle } from "lucide-react";
import { PageShell } from "@/components/admin/page-shell";
import { SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { useCollection, inrFull, type Order, type OrderStatus } from "@/lib/store";
import { generateOrderPDF, downloadOrderLogo } from "@/lib/pdf";
import { toast } from "sonner";

const STATUS_FLOW: OrderStatus[] = ["Placed", "Confirmed", "In Production", "Shipped", "Delivered"];

function OrderDetail() {
  const { id } = useParams();
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
        <Button onClick={() => { generateOrderPDF(order); toast.success("PDF downloaded"); }}>
          <FileDown className="mr-1 h-4 w-4" /> Download PDF
        </Button>
        {order.uploadedLogo && (
          <Button variant="outline" onClick={() => { downloadOrderLogo(order); toast.success("Artwork downloaded"); }}>
            <Download className="mr-1 h-4 w-4" /> Download Artwork
          </Button>
        )}
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
        </SectionCard>

        <SectionCard title="Customer Artwork / Logo" className="lg:col-span-3">
          {order.uploadedLogo ? (
            <div className="flex flex-wrap items-center gap-4">
              <img src={order.uploadedLogo} alt="Customer artwork" className="max-h-56 rounded-lg border border-border bg-secondary/30 object-contain" />
              <div className="flex flex-col gap-2">
                <div className="text-sm text-muted-foreground">Uploaded by the customer for print/embroidery reference.</div>
                <Button variant="outline" size="sm" onClick={() => { downloadOrderLogo(order); toast.success("Downloaded original file"); }}>
                  <Download className="mr-1 h-4 w-4" /> Download original clarity
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
              <ImageIcon className="h-4 w-4" /> No artwork uploaded by the customer.
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

export default OrderDetail;
