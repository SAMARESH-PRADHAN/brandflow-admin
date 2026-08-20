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
  // doc.setFont("helvetica", "normal");
  // doc.setFontSize(10);
  // const cust = [
  //   order.customer,
  //   order.phone,
  //   order.email,
  //   order.address,
  //   order.companyName ? `Company: ${order.companyName}` : "",
  //   order.gstNumber ? `GST: ${order.gstNumber}` : "",
  // ].filter(Boolean);
  // cust.forEach((line, i) => doc.text(String(line || ""), 40, y + i * 14, { maxWidth: 240 }));

  // // later, if notes exist:
  // if (order.notes?.trim()) {
  //   y += 20; // adjust
  //   doc.setFont("helvetica", "bold");
  //   doc.text("Notes", 40, y);
  //   y += 14;
  //   doc.setFont("helvetica", "normal");
  //   doc.text(order.notes, 40, y, { maxWidth: W - 80 });
  // }
  // const info: [string, string][] = [
  //   ["Type", order.type],
  //   ["Status", order.status],
  //   ["Payment", `${order.paymentStatus} • ${order.paymentMethod}`],
  //   ["Print", `${order.printType} @ ${order.printLocation}`],
  // ];
  // let infoY = y;

  // info.forEach(([k, v]) => {
  //   doc.setFont("helvetica", "bold");
  //   doc.text(k, W / 2 + 20, infoY);

  //   doc.setFont("helvetica", "normal");

  //   // Automatically wrap long text
  //   const wrapped = doc.splitTextToSize(String(v), 160);

  //   doc.text(wrapped, W / 2 + 90, infoY);

  //   // Move according to wrapped height
  //   infoY += wrapped.length * 14;
  // });

  // // Make customer section and order info finish together
  // y = Math.max(y + cust.length * 14, infoY);
  // y += 14 * 5;

    doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  // ---- LEFT COLUMN: Customer details ----
  const custItems: string[] = [
    order.customer,
    order.phone,
    order.email,
    order.address,
  ].filter(Boolean) as string[];

 if (order.companyName) custItems.push(`Company: ${order.companyName}`);
  if (order.gstNumber) custItems.push(`GST: ${order.gstNumber}`);

  let custY = y;
  custItems.forEach((item) => {
    const wrapped = doc.splitTextToSize(String(item), 240);
    doc.text(wrapped, 40, custY);
    custY += wrapped.length * 14;
  });

  // ---- RIGHT: Order Info ----
  const info: [string, string][] = [
    ["Type", order.type],
    ["Status", order.status],
    ["Payment", `${order.paymentStatus} • ${order.paymentMethod}`],
    ["Print", `${order.printType || "—"}`],
  ];

  let infoY = y;
  info.forEach(([k, v]) => {
    doc.setFont("helvetica", "bold");
    doc.text(k, W / 2 + 20, infoY);
    doc.setFont("helvetica", "normal");
    const wrapped = doc.splitTextToSize(String(v), 160);
    doc.text(wrapped, W / 2 + 90, infoY);
    infoY += wrapped.length * 14;
  });

  // Align bottom of both columns
  y = Math.max(custY, infoY) + 12;

  

 // ---- Optional Notes (full width, no overlap) ----
  if (order.notes?.trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Notes", 40, y);
    y += 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(order.notes, W - 80);
    doc.text(noteLines, 40, y);
    y += noteLines.length * 12 + 10;
  }

  y += 8;

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
  if (order.description && order.description.trim()) {
    const safeDescription = order.description.replace(/₹/g, "Rs.");
    const descLines = doc.splitTextToSize(safeDescription, W - 80);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(90);
    doc.text(descLines, 40, y);
    doc.setTextColor(20, 20, 20);
    y += descLines.length * 12 + 4;
  }
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
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Invoice", 40, y);
  y += 6;
  doc.line(40, y, W - 40, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const labelX = 40;
  const valueX = W - 40;
  const rsX = W - 95;
  const line = (label: string, value: string, bold = false) => {
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
  doc.line(40, y, W - 40, y);
  y += 20;
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

  doc.text(rs(grand), W - 50, y + 6, {
    align: "right",
  });

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





// Shipping label — mirrors a courier-style shipping slip (Ship To / package info /
// Shipped By / product table), without a barcode, using our own brand logo.
export async function generateShippingSlipPDF(
  order: Order,
  opts?: {
    brand?: string;
    brandAddressLines?: string[];
    brandGSTIN?: string;
    brandPhone?: string;
    courierName?: string; // e.g. "Standard Surface Shipping"
    download?: boolean;
  },
) {
  const brand = opts?.brand ?? "ARRHENIUX";

  // ⬇️ EDIT THIS: your real company return address, shown in "Shipped By".
  const brandAddressLines = opts?.brandAddressLines ?? [
    "Q.No F34/6, Near the Maa Mangala Flyash Bricks,",
    "Tarini Vihar, Bhubaneswar",
    "Bhubaneswar, Odisha, India",
    "751031",
  ];
  // ⬇️ EDIT THIS: your real GSTIN.
  const brandGSTIN = opts?.brandGSTIN ?? "21AHNPJ5720C1ZU";
  // ⬇️ EDIT THIS: your real support/contact phone.
  const brandPhone = opts?.brandPhone ?? "9937864993";

  const courierName = opts?.courierName ?? "Standard Surface Shipping";

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const logo = await loadLogo();
  const W = doc.internal.pageSize.getWidth();
  const M = 25;

  const subtotal = order.qty * order.unitPrice;
  const printingTotal = order.printingPrice ?? 0;
  const discountAmt = order.discountAmt ?? 0;
  const gst = (subtotal + printingTotal - discountAmt + order.shipping) * (order.gstPct / 100);
  const grand = order.totalAmount > 0 ? order.totalAmount : subtotal + printingTotal - discountAmt + order.shipping + gst;

  const paymentLabel = order.paymentStatus === "Paid" ? "PREPAID" : order.paymentMethod === "COD" ? "COD" : order.paymentStatus.toUpperCase();

  const sizesLine = Object.entries(order.sizes ?? {})
    .filter(([, qty]) => qty > 0)
    .map(([s, qty]) => `${s}:${qty}`)
    .join("  ");

  // Outer border
  doc.setDrawColor(0);
  doc.setLineWidth(1.2);
  doc.rect(M, M, W - 2 * M, 1010);

  let y = M;
  const left = M + 12;
  const right = W - M - 12;

  // ---------- Section 1: Ship To ----------
  const sec1H = 190;
  doc.line(M, y + sec1H, W - M, y + sec1H);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Ship To", left, y + 26);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const shipLines = [
    order.customer,
    order.address,
    order.companyName ? `Company: ${order.companyName}` : "",
        order.gstNumber ? `GSTIN: ${order.gstNumber}` : "",
    `Phone No.: ${order.phone}`,
  ].filter(Boolean) as string[];

  let sy = y + 48;
  shipLines.forEach((line) => {
    const wrapped = doc.splitTextToSize(String(line), 420);
    doc.text(wrapped, left, sy);
    sy += wrapped.length * 16;
  });

  try {
    doc.addImage(logo, "PNG", right - 90, y + 20, 80, 80);
  } catch {
    /* ignore logo failures */
  }

  y += sec1H;

  // ---------- Section 2: Package / payment info ----------
  const sec2H = 120;
  doc.line(M, y + sec2H, W - M, y + sec2H);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const infoLeft: [string, string][] = [
    // ["Dimensions:", "N/A"],
    ["Payment:", paymentLabel],
    ["ORDER TOTAL:", `${grand.toFixed(2)} INR`],
    // ["Weight:", "N/A"],
  ];
  let iy = y + 26;
  infoLeft.forEach(([k, v]) => {
    doc.setFont("helvetica", "normal");
    doc.text(k, left, iy);
    doc.setFont("helvetica", "bold");
    doc.text(v, left + 90, iy);
    iy += 20;
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.text(courierName, right, y + 34, { align: "right" });

  y += sec2H;

  // ---------- Section 3: Shipped By ----------
  const sec3H = 150;
  doc.line(M, y + sec3H, W - M, y + sec3H);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Shipped By", left, y + 22);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.text("(If undelivered, return to)", left + 78, y + 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  let by = y + 42;
  const brandLines = [brand, ...brandAddressLines];
  brandLines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, 280);
    doc.text(wrapped, left, by);
    by += wrapped.length * 15;
  });
  if (brandGSTIN) {
    doc.text(`GSTIN: ${brandGSTIN}`, left, by);
    by += 15;
  }
  if (brandPhone) {
    doc.text(`Phone No.: ${brandPhone}`, left, by);
    by += 15;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Order #: ${order.id}`, right, y + 42, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text(`Invoice No.: ${order.id}`, right, y + 66, { align: "right" });
  doc.text(`Invoice Date: ${order.date}`, right, y + 84, { align: "right" });

  y += sec3H;

  // ---------- Section 4: Product details table ----------
  const headH = 24;
  const rowH = 150;

  // Column widths (must sum to right - left)
  const usable = right - left;
  const colW = {
    details: 220,
    qty: 40,
    unit: 55,
    print: 55,
    discount: 55,
    gst: 45,
    total: usable - (220 + 40 + 55 + 55 + 55 + 45), // remainder, keeps columns from conflicting
  };

  const x0 = left;
  const x1 = x0 + colW.details; // qty col start
  const x2 = x1 + colW.qty; // unit price col start
  const x3 = x2 + colW.unit; // print price col start
  const x4 = x3 + colW.print; // discount col start
  const x5 = x4 + colW.discount; // gst col start
  const x6 = x5 + colW.gst; // total col start
  const x7 = right; // right edge

  doc.setDrawColor(0);
  doc.line(M, y + headH, W - M, y + headH);
  doc.line(M, y + headH + rowH, W - M, y + headH + rowH);
  [x1, x2, x3, x4, x5, x6].forEach((x) => {
    doc.line(x, y, x, y + headH + rowH);
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Product Details", x0 + 4, y + 16);
  doc.text("Qty", x2 - 4, y + 16, { align: "right" });
  doc.text("Unit Price", x3 - 4, y + 16, { align: "right" });
  doc.text("Print Price", x4 - 4, y + 16, { align: "right" });
  doc.text("Discount", x5 - 4, y + 16, { align: "right" });
  doc.text("GST", x6 - 4, y + 16, { align: "right" });
  doc.text("Total", x7 - 4, y + 16, { align: "right" });

  // Product details cell — name, code, category, type, sub-category, material, sizes, print type
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const detailLines: string[] = [
    order.productName,
    `Code: ${order.productCode}`,
    `Category: ${order.category}`,
    `Type: ${order.productType}`,
    `Sub-category: ${order.subCategory}`,
    `Material: ${order.material}`,
    sizesLine ? `Sizes: ${sizesLine}` : "",
    order.printType ? `Print: ${order.printType}` : "",
  ].filter(Boolean);

  let dy = y + headH + 14;
  const maxDetailWidth = colW.details - 8;
  detailLines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, maxDetailWidth);
    doc.text(wrapped, x0 + 4, dy);
    dy += wrapped.length * 11;
  });

  // Numeric columns — vertically aligned near the top of the row, no overlap with details
  const numY = y + headH + 16;
  doc.setFontSize(9);
  doc.text(String(order.qty), x2 - 4, numY, { align: "right" });
  doc.text(order.unitPrice.toFixed(2), x3 - 4, numY, { align: "right" });
  doc.text(printingTotal.toFixed(2), x4 - 4, numY, { align: "right" });
  doc.text(discountAmt > 0 ? `-${discountAmt.toFixed(2)}` : "0.00", x5 - 4, numY, { align: "right" });
  doc.text(gst.toFixed(2), x6 - 4, numY, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text(grand.toFixed(2), x7 - 4, numY, { align: "right" });

  y += headH + rowH;

  // ---------- Section 5: disputes note ----------
  const sec5H = 50;
  doc.line(M, y + sec5H, W - M, y + sec5H);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const disputeText = doc.splitTextToSize(
    "All disputes are subject to local jurisdiction only. Goods once sold will only be taken back or exchanged as per the store's exchange/return policy.",
    W - 2 * M - 24,
  );
  doc.text(disputeText, left, y + 20);

  y += sec5H;

  // ---------- Section 6: footer ----------
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("THIS IS AN AUTO-GENERATED LABEL AND DOES NOT NEED SIGNATURE.", left, y + 26);
  doc.setFont("helvetica", "bold");
  doc.text(`Powered By: ${brand}`, right, y + 26, { align: "right" });

  if (opts?.download !== false) doc.save(`${order.id}-shipping-slip.pdf`);
  return doc;
}