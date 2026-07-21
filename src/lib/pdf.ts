import jsPDF from "jspdf";
import type { Order } from "@/lib/store";

// jsPDF's built-in Helvetica cannot render the ₹ glyph — fall back to "Rs."
const rs = (n: number) => `Rs. ${(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

// Simple invoice PDF with Arreniux header + optional customer logo/artwork.
export function generateOrderPDF(order: Order, opts?: { brand?: string; download?: boolean }) {
  const brand = opts?.brand ?? "ARRENIUX";
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 40;

  // Header band
  doc.setFillColor(20, 20, 20);
  doc.rect(0, 0, W, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(brand, 40, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Custom Uniforms & Corporate Merchandise", 40, 58);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`ORDER ${order.id}`, W - 40, 42, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(order.date, W - 40, 58, { align: "right" });

  y = 100;
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Customer", 40, y);
  doc.text("Order Info", W / 2 + 20, y);
  y += 6;
  doc.setDrawColor(200); doc.line(40, y, W - 40, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const cust = [
    order.customer,
    order.phone,
    order.email,
    order.address,
  ];
  cust.forEach((line, i) => doc.text(String(line || ""), 40, y + i * 14, { maxWidth: 240 }));

  const info: [string, string][] = [
    ["Type", order.type],
    ["Status", order.status],
    ["Payment", `${order.paymentStatus} • ${order.paymentMethod}`],
    ["Print", `${order.printType} @ ${order.printLocation}`],
  ];
  info.forEach(([k, v], i) => {
    doc.setFont("helvetica", "bold"); doc.text(k, W / 2 + 20, y + i * 14);
    doc.setFont("helvetica", "normal"); doc.text(String(v), W / 2 + 90, y + i * 14);
  });

  y += 14 * 5;
  doc.setFont("helvetica", "bold"); doc.setFontSize(12);
  doc.text("Product", 40, y);
  y += 6; doc.line(40, y, W - 40, y); y += 16;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  doc.text(`${order.productCode} — ${order.productName}`, 40, y); y += 14;
  doc.text(`${order.category} • ${order.subCategory} • ${order.material}`, 40, y); y += 14;
  const sizesLine = Object.entries(order.sizes || {}).filter(([, v]) => v > 0).map(([k, v]) => `${k}:${v}`).join("  ");
  if (sizesLine) { doc.text(`Sizes: ${sizesLine}`, 40, y); y += 14; }

  // Uploaded logo/artwork block
  if (order.uploadedLogo) {
    y += 8;
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text("Customer Artwork / Logo", 40, y);
    y += 6; doc.line(40, y, W - 40, y); y += 12;
    try {
      // Try direct add; SVG data URLs won't embed — jsPDF supports PNG/JPEG.
      const isSvg = order.uploadedLogo.startsWith("data:image/svg");
      if (!isSvg) {
        doc.addImage(order.uploadedLogo, "PNG", 40, y, 160, 100, undefined, "FAST");
      } else {
        doc.setDrawColor(180); doc.rect(40, y, 160, 100);
        doc.setFontSize(9); doc.setTextColor(100);
        doc.text("[SVG artwork attached — download separately]", 50, y + 55);
        doc.setTextColor(20);
      }
    } catch {
      doc.setDrawColor(180); doc.rect(40, y, 160, 100);
    }
    y += 116;
  }

  // Totals
  const subtotal = order.qty * order.unitPrice;
  const gst = subtotal * (order.gstPct / 100);
  const grand = subtotal + gst + order.shipping;
  y += 10;
  doc.setFont("helvetica", "bold"); doc.setFontSize(12);
  doc.text("Invoice", 40, y);
  y += 6; doc.line(40, y, W - 40, y); y += 16;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  const line = (k: string, v: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(k, 40, y); doc.text(v, W - 40, y, { align: "right" });
    y += 14;
  };
  line("Quantity", String(order.qty));
  line("Unit Price", inrFull(order.unitPrice));
  line("Subtotal", inrFull(subtotal));
  line(`GST (${order.gstPct}%)`, inrFull(gst));
  line("Shipping", inrFull(order.shipping));
  doc.line(40, y, W - 40, y); y += 6;
  line("Grand Total", inrFull(grand), true);

  doc.setFontSize(8); doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString()} • ${brand} Admin Panel (demo)`, 40, doc.internal.pageSize.getHeight() - 24);

  if (opts?.download !== false) doc.save(`${order.id}.pdf`);
  return doc;
}

// Download uploaded logo/artwork as a standalone file at original clarity.
export function downloadOrderLogo(order: Order) {
  if (!order.uploadedLogo) return;
  const src = order.uploadedLogo;
  const a = document.createElement("a");
  a.href = src;
  // Guess extension
  const m = /^data:image\/([a-z+]+);/i.exec(src);
  const ext = m ? m[1].replace("+xml", "") : "png";
  a.download = `${order.id}-artwork.${ext}`;
  document.body.appendChild(a); a.click(); a.remove();
}
