import jsPDF from "jspdf";
import type { Order } from "@/lib/store";
import { loadLogo } from "./pdfLogo.ts";

// jsPDF's built-in Helvetica cannot render the ₹ glyph — fall back to "Rs."
const rs = (n: number) => `Rs. ${(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

// Simple invoice PDF with Arreniux header + optional customer logo/artwork.
export async function generateOrderPDF(
  order: Order,
  opts?: { brand?: string; download?: boolean },
) {
  const brand = opts?.brand ?? "ARRENIUX";
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const logo = await loadLogo();
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  doc.setDrawColor(220);
  doc.setLineWidth(1);

  doc.rect(15, 15, W - 30, H - 30);
  let y = 40;
  doc.saveGraphicsState();

  (doc as any).setGState(
    new (doc as any).GState({
      opacity: 0.08,
    }),
  );

  doc.addImage(logo, "PNG", 120, 180, 350, 350);

  doc.restoreGraphicsState();
  // Header band
  doc.setFillColor(28, 53, 94);
  doc.roundedRect(35, y - 14, W - 70, 24, 4, 4, "F");
  // White header background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, 70, "F");

  // Blue accent line at the bottom
  doc.setFillColor(34, 102, 170);
  doc.rect(0, 66, W, 4, "F");
  doc.setTextColor(30, 30, 30);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.addImage(logo, "PNG", 28, 12, 48, 48);

  doc.text(brand, 82, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Custom Uniforms & Corporate Merchandise", 82, 58);
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
  doc.setDrawColor(210);
  doc.line(40, y, W - 40, y);
  y += 16;
  // doc.rect(
  //     15,
  //     15,
  //     W-30,
  //     doc.internal.pageSize.getHeight()-30
  // );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const cust = [order.customer, order.phone, order.email, order.address];
  cust.forEach((line, i) => doc.text(String(line || ""), 40, y + i * 14, { maxWidth: 240 }));

  const info: [string, string][] = [
    ["Type", order.type],
    ["Status", order.status],
    ["Payment", `${order.paymentStatus} • ${order.paymentMethod}`],
    ["Print", `${order.printType} @ ${order.printLocation}`],
  ];
  let infoY = y;

info.forEach(([k, v]) => {
  doc.setFont("helvetica", "bold");
  doc.text(k, W / 2 + 20, infoY);

  doc.setFont("helvetica", "normal");

  // Automatically wrap long text
  const wrapped = doc.splitTextToSize(String(v), 160);

  doc.text(wrapped, W / 2 + 90, infoY);

  // Move according to wrapped height
  infoY += wrapped.length * 14;
});

// Make customer section and order info finish together
y = Math.max(
  y + cust.length * 14,
  infoY
);
  y += 14 * 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Product", 40, y);
  y += 6;
  doc.line(40, y, W - 40, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${order.productCode} — ${order.productName}`, 40, y);
  y += 14;
  doc.text(`${order.category} • ${order.subCategory} • ${order.material}`, 40, y);
  y += 14;
  const sizesLine = Object.entries(order.sizes || {})
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${k}:${v}`)
    .join("  ");
  if (sizesLine) {
    doc.text(`Sizes: ${sizesLine}`, 40, y);
    y += 14;
  }

  // Uploaded logo/artwork block
  if (order.uploadedLogo) {
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Customer Artwork / Logo", 40, y);
    y += 6;
    doc.line(40, y, W - 40, y);
    y += 12;
    try {
      // Try direct add; SVG data URLs won't embed — jsPDF supports PNG/JPEG.
      const isSvg = order.uploadedLogo.startsWith("data:image/svg");
      if (!isSvg) {
        doc.addImage(order.uploadedLogo, "PNG", 40, y, 160, 100, undefined, "FAST");
      } else {
        doc.setDrawColor(180);
        doc.rect(40, y, 160, 100);
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text("[SVG artwork attached — download separately]", 50, y + 55);
        doc.setTextColor(20);
      }
    } catch {
      doc.setDrawColor(180);
      doc.rect(40, y, 160, 100);
    }
    y += 116;
  }

  // Totals
  const subtotal = order.qty * order.unitPrice;
  const printingTotal = order.printingPrice ?? 0;
  const discountAmt = order.discountAmt ?? 0;
  const taxable = subtotal + printingTotal - discountAmt + order.shipping;
  const gst = taxable * (order.gstPct / 100);
  const grand = order.totalAmount > 0 ? order.totalAmount : taxable + gst;
  y += 10;
  doc.setFont("helvetica", "bold"); doc.setFontSize(12);
  doc.text("Invoice", 40, y);
  y += 6; doc.line(40, y, W - 40, y); y += 16;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  const labelX = 40;
const valueX = W - 40;
const rsX = W - 95;
const line = (
    label: string,
    value: string,
    bold = false
) => {

    doc.setFont("helvetica", bold ? "bold" : "normal");

    doc.text(label, labelX, y);

    const amount = value.replace("Rs. ", "");

    doc.text("Rs.", rsX, y, {
        align: "right",
    });

    doc.text(amount, valueX, y, {
        align: "right",
    });

    y += 18;
};
  line("Quantity", String(order.qty));
  line("Unit Price", rs(order.unitPrice));
  line("Subtotal", rs(subtotal));
  line("Printing Price", rs(printingTotal));
  if (discountAmt > 0) line(`Discount (${order.discountPct}%)`, `-${rs(discountAmt)}`);
  line(`GST (${order.gstPct}%)`, rs(gst));
  line("Shipping", rs(order.shipping));
  doc.line(40, y, W - 40, y); y += 20;
  line("Grand Total", rs(grand), true);
  const paid = order.paidAmount > 0 ? order.paidAmount : grand;
  line("Amount Paid", rs(paid));
  if (order.paidAmount > 0 && order.paidAmount < grand) {
    line("Balance Due", rs(grand - order.paidAmount));
  }
  
  doc.line(40, y, W - 40, y);
  y += 12;
  doc.setFillColor(34, 102, 170);
  doc.setTextColor(20, 20, 20);
doc.roundedRect(35, y - 16, W - 70, 34, 4, 4, "F");
  doc.setFontSize(13);
  doc.setTextColor(255);

doc.text("Grand Total", 50, y + 6);

doc.text(
    rs(grand),
    W - 50,
    y + 6,
    {
        align: "right",
    }
);

  y += 40;
  doc.setTextColor(20);
  doc.setFontSize(10);
  // const H = doc.internal.pageSize.getHeight();

  // Draw a line above the footer
  doc.setDrawColor(220);
  doc.line(40, H - 38, W - 40, H - 38);

  // Footer text
  doc.setFontSize(8);
  doc.setTextColor(120);

  // Left side
  doc.text("Thank you for choosing ARRENIUX", 40, H - 22);

  // Right side
  doc.text(`Generated: ${new Date().toLocaleString()}`, W - 40, H - 22, { align: "right" });
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
  document.body.appendChild(a);
  a.click();
  a.remove();
}
