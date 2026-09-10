import jsPDF from "jspdf";
import type { Order } from "@/lib/store";
import { loadLogo } from "./pdfLogo";

// ---------------------------------------------------------------------------
// Brand palette — SAME AS CUSTOMER INVOICE
// ---------------------------------------------------------------------------
const INK: [number, number, number] = [17, 17, 17];
const PRIMARY: [number, number, number] = [26, 90, 56];
const ACCENT: [number, number, number] = [201, 122, 74];
const CREAM: [number, number, number] = [250, 247, 240];
const GRAY_LIGHT: [number, number, number] = [244, 244, 242];
const GRAY_LINE: [number, number, number] = [222, 220, 214];
const GRAY_TEXT: [number, number, number] = [110, 110, 108];
const RED: [number, number, number] = [190, 45, 45];
const GREEN_OK: [number, number, number] = [26, 122, 66];
const AMBER: [number, number, number] = [176, 120, 20];

// ---------------------------------------------------------------------------
// Company information
// ---------------------------------------------------------------------------
const COMPANY = {
  name: "ARRHENIUX",
  legal: "Arrheniux Enterprises",
  tagline: "Factory-Direct Custom Apparel",
  address: "Plot No. 88 Niladrivihar, Chandrasekharapur, Bhubaneswar, Odisha, 751016",
  email: "arrheniuxofficial@gmail.com",
  phone: " +91 97776 24205",
  gstin: "21BLBPB7509J1ZI",
  headaddress: "Bhubaneswar, Odisha, 751016",
};

// ---------------------------------------------------------------------------
// Formatting helper
// ---------------------------------------------------------------------------
const fmt = (n: number) => `Rs ${Math.round(n || 0).toLocaleString("en-IN")}`;

// ---------------------------------------------------------------------------
// Number to words — Indian numbering system
// ---------------------------------------------------------------------------
function numberToWords(num: number): string {
  if (!Number.isFinite(num) || num === 0) {
    return "Zero Rupees Only";
  }

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const convert = (n: number): string => {
    if (n < 20) {
      return ones[n];
    }

    if (n < 100) {
      return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    }

    if (n < 1000) {
      return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convert(n % 100) : "");
    }

    if (n < 100000) {
      return (
        convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "")
      );
    }

    if (n < 10000000) {
      return (
        convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "")
      );
    }

    return (
      convert(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 ? " " + convert(n % 10000000) : "")
    );
  };

  const safeNum = Math.max(0, num);

  const rupees = Math.floor(safeNum);
  const paise = Math.round((safeNum - rupees) * 100);

  let result = convert(rupees) + " Rupees";

  if (paise > 0) {
    result += " and " + convert(paise) + " Paise";
  }

  return result + " Only";
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------
const KIND_LABEL: Record<string, string> = {
  Normal: "Retail Order",
  Bulk: "Bulk Order",
  B2B: "B2B Order",
  "New Collection": "New Collection",
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  Paid: "Paid",
  Pending: "Payment Pending",
  Partial: "Partially Paid",
  Failed: "Payment Failed",
  Refunded: "Refunded",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  UPI: "UPI",
  "Credit Card": "Credit Card",
  "Net Banking": "Net Banking",
  COD: "Cash on Delivery",
  Wallet: "Wallet",
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export async function downloadTaxInvoice(order: Order, opts?: { invoiceNumber?: string }) {
  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
  });

  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  const M = 14;
  const contentW = W - M * 2;

  // -------------------------------------------------------------------------
  // ADMIN ORDER -> CUSTOMER INVOICE DATA MAPPING
  // -------------------------------------------------------------------------

  // Invoice number comes FIRST.
  // If an invoice number was assigned, use it.
  // Otherwise generate a fallback.
  const invoiceNo =
    (opts?.invoiceNumber || order.invoiceNumber || "").trim() || `ARR-${order.id.toUpperCase()}`;

  // Order ID is ALWAYS the actual admin order ID.
  const ordId = `ARR-${order.id.toUpperCase()}`;

  const orderDate = new Date(order.date);

  // -------------------------------------------------------------------------
  // Delivery date
  // -------------------------------------------------------------------------

  const deliveredTimeline = order.timeline?.find((item) => item.status === "Delivered");

  const deliveredDate = deliveredTimeline ? new Date(deliveredTimeline.at) : null;

  const expected = new Date(orderDate.getTime() + 10 * 24 * 60 * 60 * 1000);

  // -------------------------------------------------------------------------
  // Amount calculations
  // -------------------------------------------------------------------------

  const productSubtotal = Math.max(0, (order.qty || 0) * (order.unitPrice || 0));

  const printingPrice = Math.max(0, order.printingPrice || 0);

  const discountAmt = Math.max(0, order.discountAmt || 0);

  const discountPct = Math.max(0, order.discountPct || 0);

  const shipping = Math.max(0, order.shipping || 0);

  const gstPct = Math.max(0, order.gstPct ?? 5);

  // Same basic calculation used by the customer invoice.
  const taxableAmount = Math.max(0, productSubtotal + printingPrice - discountAmt + shipping);

  // Admin totalAmount is the source of truth.
  const total =
    order.totalAmount > 0 ? order.totalAmount : taxableAmount + (taxableAmount * gstPct) / 100;

  const paid = Math.max(0, order.paidAmount || 0);

  const due = Math.max(0, total - paid);

  // GST is derived so displayed values remain consistent
  // with the final total.
  const gstAmount = Math.max(0, total - (productSubtotal + printingPrice - discountAmt + shipping));

  // -------------------------------------------------------------------------
  // Customer information
  // -------------------------------------------------------------------------

  const customerName = order.customer || "Customer";
  const phone = order.phone || "";
  const email = order.email || "";
  const address = order.address || "";
  const companyName = order.companyName || "";
  const gstNumber = order.gstNumber || "";
  const notes = order.notes || "";

  const kindLabel = KIND_LABEL[order.type] || `${order.type} Order`;

  // -------------------------------------------------------------------------
  // PDF metadata
  // -------------------------------------------------------------------------

  doc.setProperties({
    title: `Invoice ${invoiceNo}`,
    subject: "Tax Invoice",
    author: COMPANY.legal,
    creator: COMPANY.name,
  });

  // -------------------------------------------------------------------------
  // Load logo
  // -------------------------------------------------------------------------

  let logoDataUrl: string | null = null;

  try {
    logoDataUrl = await loadLogo();
  } catch (error) {
    console.warn("Unable to load invoice logo:", error);
  }

  // -------------------------------------------------------------------------
  // Watermark
  // -------------------------------------------------------------------------

  if (logoDataUrl) {
    try {
      const size = 130;

      const GStateConstructor = (
        doc as unknown as {
          GState: new (options: object) => unknown;
        }
      ).GState;

      const setGState = (
        doc as unknown as {
          setGState: (state: unknown) => void;
        }
      ).setGState;

      if (GStateConstructor && setGState) {
        const lightState = new GStateConstructor({
          opacity: 0.05,
        });

        setGState(lightState);
      }

      doc.addImage(logoDataUrl, "PNG", W / 2 - size / 2, H / 2 - size / 2, size, size);

      if (GStateConstructor && setGState) {
        const fullState = new GStateConstructor({
          opacity: 1,
        });

        setGState(fullState);
      }
    } catch (error) {
      console.warn("Unable to add invoice watermark:", error);
    }
  }

  // -------------------------------------------------------------------------
  // Header — SAME POSITION / STYLE AS CUSTOMER INVOICE
  // -------------------------------------------------------------------------

  let y = 16;

  if (logoDataUrl) {
    try {
      const logoW = 24;
      const logoH = 20;

      doc.addImage(logoDataUrl, "PNG", M, y - 4, logoW, logoH);
    } catch (error) {
      console.warn("Unable to add invoice logo:", error);
    }
  }

  const textX = M + 28;

  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(COMPANY.name, textX, y + 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY_TEXT);

  doc.text(COMPANY.tagline, textX, y + 7.5);

  doc.text(COMPANY.headaddress, textX, y + 12);

  if (COMPANY.email || COMPANY.phone) {
    const contactParts = [COMPANY.email, COMPANY.phone].filter(Boolean);

    doc.text(contactParts.join("  |  "), textX, y + 16.5);
  }

  // -------------------------------------------------------------------------
  // TAX INVOICE
  // -------------------------------------------------------------------------

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...INK);

  doc.text("TAX INVOICE", W - M, y + 2, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY_TEXT);

  // IMPORTANT:
  // Order ID FIRST
  doc.text(`ORD ID : ${ordId}`, W - M, y + 8, {
    align: "right",
  });

  // Invoice number SECOND
  doc.text(`Invoice No : ${invoiceNo}`, W - M, y + 13, {
    align: "right",
  });

  // Invoice date THIRD
  doc.text(`Invoice Date: ${orderDate.toLocaleDateString("en-IN")}`, W - M, y + 18, {
    align: "right",
  });

  // -------------------------------------------------------------------------
  // Payment badge
  // -------------------------------------------------------------------------

  const paymentOk = order.paymentStatus === "Paid" || due <= 0;

  const partialPayment = order.paymentStatus === "Partial" || (paid > 0 && due > 0);

  const badgeColor = paymentOk ? GREEN_OK : partialPayment ? AMBER : RED;

  const badgeText = paymentOk
    ? "PAID IN FULL"
    : partialPayment
      ? "PARTIALLY PAID"
      : order.paymentStatus === "Failed"
        ? "PAYMENT FAILED"
        : "PAYMENT PENDING";

  doc.setFillColor(...badgeColor);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);

  const badgeW = doc.getTextWidth(badgeText) + 8;

  doc.roundedRect(W - M - badgeW, y + 20, badgeW, 6.5, 1.5, 1.5, "F");

  doc.setTextColor(255, 255, 255);

  doc.text(badgeText, W - M - badgeW / 2, y + 24.5, {
    align: "center",
  });

  // -------------------------------------------------------------------------
  // Divider
  // -------------------------------------------------------------------------

  y += 34;

  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(1);

  doc.line(M, y, W - M, y);

  y += 8;

  // -------------------------------------------------------------------------
  // BILL FROM / BILL TO
  // -------------------------------------------------------------------------

  const colW = (contentW - 6) / 2;

  const fromLines = [
    COMPANY.legal,
    COMPANY.address,
    COMPANY.email ? `Email: ${COMPANY.email}` : "",
    COMPANY.phone ? `Phone: ${COMPANY.phone}` : "",
    `GSTIN: ${COMPANY.gstin}`,
  ].filter(Boolean);

  const billToLines = [
    customerName,

    companyName ? `Company: ${companyName}` : "",

    gstNumber ? `GST: ${gstNumber}` : "",

    phone ? `Phone: ${phone}` : "",

    email ? `Email: ${email}` : "",

    address,

    notes ? `Notes: ${notes}` : "",
  ].filter(Boolean);

  const maxLines = Math.max(fromLines.length, billToLines.length);

  const boxH = Math.max(34, 10 + maxLines * 5.5);

  const drawInfoBox = (x: number, label: string, lines: string[]) => {
    doc.setFillColor(...GRAY_LIGHT);

    doc.roundedRect(x, y, colW, boxH, 2, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...ACCENT);

    doc.text(label, x + 5, y + 6);

    doc.setTextColor(...INK);

    let ly = y + 12;

    lines.forEach((line, i) => {
      if (!line) return;

      doc.setFont("helvetica", i === 0 ? "bold" : "normal");

      doc.setFontSize(i === 0 ? 10.5 : 8.5);

      const wrapped = doc.splitTextToSize(line, colW - 10);

      wrapped.forEach((wrappedLine: string) => {
        doc.text(wrappedLine, x + 5, ly);

        ly += i === 0 ? 5.5 : 4.2;
      });
    });
  };

  drawInfoBox(M, "BILLED FROM", fromLines);

  drawInfoBox(M + colW + 6, "BILLED TO", billToLines);

  y += boxH + 8;

  // -------------------------------------------------------------------------
  // Order meta strip
  // -------------------------------------------------------------------------

  const isDelivered = order.status === "Delivered";

  const deliveryDateLabel = isDelivered ? "DELIVERED ON" : "EXPECTED DELIVERY";

  const deliveryDateValue =
    isDelivered && deliveredDate
      ? deliveredDate.toLocaleDateString("en-IN")
      : expected.toLocaleDateString("en-IN");

  const metaItems = [
    {
      label: "ORDER ID",
      value: order.id.toUpperCase(),
    },
    {
      label: "ORDER TYPE",
      value: kindLabel,
    },
    {
      label: "PAYMENT MODE",
      value: PAYMENT_METHOD_LABEL[order.paymentMethod] || order.paymentMethod,
    },
    // {
    //   label: "PAYMENT STATUS",
    //   value: PAYMENT_STATUS_LABEL[order.paymentStatus] || order.paymentStatus,
    // },
    {
      label: "DELIVERY STATUS",
      value: order.status,
    },
    {
      label: deliveryDateLabel,
      value: deliveryDateValue,
    },
  ];

  const metaW = contentW / metaItems.length;

  metaItems.forEach((item, i) => {
    const x = M + i * metaW;

    doc.setFont("helvetica", "normal");

    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY_TEXT);

    doc.text(item.label, x, y);

    doc.setFont("helvetica", "bold");

    doc.setFontSize(8.2);
    doc.setTextColor(...INK);

    const valueLines = doc.splitTextToSize(String(item.value), metaW - 7);

    doc.text(valueLines, x, y + 5);

    if (i < metaItems.length - 1) {
      doc.setDrawColor(...GRAY_LINE);
      doc.setLineWidth(0.2);

      doc.line(x + metaW - 4, y - 3, x + metaW - 4, y + 8);
    }
  });

  y += 14;

  doc.setDrawColor(...GRAY_LINE);
  doc.setLineWidth(0.3);

  doc.line(M, y, W - M, y);

  y += 8;

  // -------------------------------------------------------------------------
  // Items table
  // -------------------------------------------------------------------------

  const col = {
    desc: M,
    qty: M + 108,
    price: M + 128,
    amount: M + 156,
  };

  const tableRight = W - M;

  doc.setFillColor(...PRIMARY);

  doc.rect(M, y, contentW, 8, "F");

  doc.setTextColor(255, 255, 255);

  doc.setFont("helvetica", "bold");

  doc.setFontSize(8.5);

  doc.text("ITEM & DESCRIPTION", col.desc + 3, y + 5.3);

  doc.text("QTY", col.qty, y + 5.3, {
    align: "center",
  });

  doc.text("UNIT PRICE", col.price + 12, y + 5.3, {
    align: "right",
  });

  doc.text("AMOUNT", tableRight - 3, y + 5.3, {
    align: "right",
  });

  y += 8;

  // -------------------------------------------------------------------------
  // Sizes
  // -------------------------------------------------------------------------

  const sizesLine = Object.entries(order.sizes || {})
    .filter(([, value]) => value > 0)
    .map(([size, value]) => `${size}×${value}`)
    .join("  ·  ");

  // -------------------------------------------------------------------------
  // Product details
  // -------------------------------------------------------------------------

  const detailLines: string[] = [];

  if (order.productCode) {
    detailLines.push(`Code: ${order.productCode}`);
  }

//   if (order.description) {
//     detailLines.push(order.description.replace(/₹/g, "Rs "));
//   }

  if (order.category) {
    detailLines.push(
      `Category: ${order.category}${order.subCategory ? ` — ${order.subCategory}` : ""}`,
    );
  }

  if (order.material) {
    detailLines.push(`Material: ${order.material}`);
  }

  if (order.printType && order.printType !== "N/A") {
    detailLines.push(
      `Print: ${order.printType}${order.printLocation ? ` — ${order.printLocation}` : ""}`,
    );
  }

  if (sizesLine) {
    detailLines.push(`Sizes: ${sizesLine}`);
  }

//   if (order.productType) {
//     detailLines.push(`Product Type: ${order.productType}`);
//   }

  // -------------------------------------------------------------------------
  // Product row
  // -------------------------------------------------------------------------

  const wrappedDetails = detailLines.flatMap((line) => doc.splitTextToSize(line, 100));

  const rowH = Math.max(16, 8 + wrappedDetails.length * 4.2);

  doc.setDrawColor(...GRAY_LINE);
  doc.setLineWidth(0.2);

  doc.rect(M, y, contentW, rowH, "S");

  doc.setFont("helvetica", "bold");

  doc.setFontSize(9.5);
  doc.setTextColor(...INK);

  doc.text(order.productName || "Product", col.desc + 3, y + 6);

  doc.setFont("helvetica", "normal");

  doc.setFontSize(7.8);
  doc.setTextColor(...GRAY_TEXT);

  let dy = y + 10.5;

  wrappedDetails.forEach((line: string) => {
    doc.text(line, col.desc + 3, dy);

    dy += 4.2;
  });

  doc.setFont("helvetica", "normal");

  doc.setFontSize(9);
  doc.setTextColor(...INK);

  doc.text(String(order.qty), col.qty, y + 6, {
    align: "center",
  });

  doc.text(fmt(order.unitPrice), col.price + 12, y + 6, {
    align: "right",
  });

  doc.setFont("helvetica", "bold");

  doc.text(fmt(productSubtotal), tableRight - 3, y + 6, {
    align: "right",
  });

  y += rowH;

  // -------------------------------------------------------------------------
  // Printing / customization
  // -------------------------------------------------------------------------

  if (printingPrice > 0) {
    const ph = 8;

    doc.setDrawColor(...GRAY_LINE);

    doc.rect(M, y, contentW, ph, "S");

    doc.setFont("helvetica", "italic");

    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY_TEXT);

    doc.text(`Printing / Customization — ${order.printType || ""}`, col.desc + 3, y + 5.3);

    doc.setTextColor(...INK);

    doc.setFont("helvetica", "normal");

    doc.text(fmt(printingPrice), tableRight - 3, y + 5.3, {
      align: "right",
    });

    y += ph;
  }

  y += 6;

  // -------------------------------------------------------------------------
  // Totals summary
  // -------------------------------------------------------------------------

  const sumW = 82;
  const sumX = tableRight - sumW;

  const addRow = (
    label: string,
    value: string,
    options: {
      bold?: boolean;
      color?: [number, number, number];
    } = {},
  ) => {
    doc.setFont("helvetica", options.bold ? "bold" : "normal");

    doc.setFontSize(options.bold ? 10 : 9);

    doc.setTextColor(...(options.color || INK));

    doc.text(label, sumX, y);

    doc.text(value, tableRight - 2, y, {
      align: "right",
    });

    y += options.bold ? 6.5 : 5.5;
  };

  // Same customer invoice structure
  addRow("Subtotal", fmt(productSubtotal + printingPrice));

  if (discountAmt > 0) {
    addRow(`Discount (${discountPct}%)`, `- ${fmt(discountAmt)}`, {
      color: GREEN_OK,
    });
  }

  // Customer-side invoice shows the discounted total here
  const discountTotal = productSubtotal + printingPrice - discountAmt;

  addRow("Total", fmt(discountTotal), {
    bold: true,
  });

  addRow("Courier Charges", shipping > 0 ? fmt(shipping) : "FREE");

  addRow(`GST (${gstPct}%)`, fmt(gstAmount));

  y += 1.5;

  doc.setDrawColor(...INK);
  doc.setLineWidth(0.3);

  doc.line(sumX, y, tableRight, y);

  y += 5;

  // -------------------------------------------------------------------------
  // Grand total
  // -------------------------------------------------------------------------

  doc.setFillColor(...INK);

  doc.rect(sumX - 4, y - 5.5, sumW + 6, 9, "F");

  doc.setTextColor(255, 255, 255);

  doc.setFont("helvetica", "bold");

  doc.setFontSize(11);

  doc.text("GRAND TOTAL", sumX, y);

  doc.text(fmt(total), tableRight - 2, y, {
    align: "right",
  });

  y += 9;

  // -------------------------------------------------------------------------
  // Paid / Due
  // -------------------------------------------------------------------------

  addRow("Amount Paid", fmt(paid), {
    color: GREEN_OK,
  });

  if (due > 0) {
    addRow("Balance Due", fmt(due), {
      bold: true,
      color: RED,
    });
  } else {
    addRow("Balance Due", "Rs 0 (Fully Paid)", {
      color: GREEN_OK,
    });
  }

  // -------------------------------------------------------------------------
  // Amount in words
  // -------------------------------------------------------------------------

  y += 3;

  doc.setFillColor(...CREAM);

  doc.roundedRect(M, y, contentW, 12, 1.5, 1.5, "F");

  doc.setFont("helvetica", "bold");

  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY);

  doc.text("Amount in Words:", M + 4, y + 5);

  doc.setFont("helvetica", "italic");

  doc.setFontSize(10.5);
  doc.setTextColor(...INK);

  const words = numberToWords(total);

  const wrappedWords = doc.splitTextToSize(words, contentW - 55);

  doc.text(wrappedWords, M + 42, y + 5);

  y += 12;
// ---- HSN / SAC Code ------------------------------------------------------
doc.setFillColor(...CREAM);
doc.roundedRect(M, y, contentW, 7, 1.2, 1.2, "F");

doc.setFont("helvetica", "bold");
doc.setFontSize(8);
doc.setTextColor(...PRIMARY);
doc.text("HSN/SAC CODE", M + 4, y + 4.8);

doc.setFont("helvetica", "normal");
doc.setTextColor(...INK);
doc.text("61099010", M + 38, y + 4.8);

y += 9;
  // -------------------------------------------------------------------------
  // Footer — SAME AS CUSTOMER INVOICE
  // -------------------------------------------------------------------------

  const footerY = H - 34;

  doc.setDrawColor(...GRAY_LINE);
  doc.setLineWidth(0.2);

  doc.line(M, footerY, W - M, footerY);

  // Terms
  doc.setFont("helvetica", "bold");

  doc.setFontSize(8.5);
  doc.setTextColor(...PRIMARY);

  doc.text("Terms & Notes", M, footerY + 6);

  doc.setFont("helvetica", "normal");

  doc.setFontSize(7.3);
  doc.setTextColor(...GRAY_TEXT);

  const terms = [
    "• Customized / printed items are non-returnable unless there is a manufacturing defect.",
    "• Please report any issue within 48 hours of delivery with photos for a quick resolution.",
    "• This is a computer-generated invoice and does not require a physical signature.",
  ];

  terms.forEach((term, i) => {
    doc.text(term, M, footerY + 11 + i * 4);
  });

  // Thank you
  doc.setFont("helvetica", "bold");

  doc.setFontSize(9);
  doc.setTextColor(...INK);

  doc.text("Thank you for choosing Arrheniux Enterprises", W - M, footerY + 6, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");

  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY_TEXT);

  if (COMPANY.phone || COMPANY.email) {
    doc.text(
      `${COMPANY.phone}${COMPANY.phone && COMPANY.email ? "  •  " : ""}${COMPANY.email}`,
      W - M,
      footerY + 11,
      {
        align: "right",
      },
    );
  }

  doc.text("Bhubaneswar, Odisha, India", W - M, footerY + 15, {
    align: "right",
  });

  // Page number
  doc.setFontSize(7);
  doc.setTextColor(...GRAY_LINE);

  doc.text("Page 1 of 1", W / 2, H - 8, {
    align: "center",
  });

  // -------------------------------------------------------------------------
  // Save
  // -------------------------------------------------------------------------

  doc.save(`invoice-${invoiceNo}.pdf`);
}
