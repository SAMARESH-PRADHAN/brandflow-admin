// Deterministic demo data for the ARRHENIUX ERP shell.
// Uses a seeded PRNG so every render produces identical numbers.

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]!;
const between = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

export const categories = [
  { id: "cat-1", name: "Corporate Shirts", slug: "corporate-shirts", products: 42, image: "👔" },
  { id: "cat-2", name: "Polo T-Shirts", slug: "polo-tshirts", products: 38, image: "👕" },
  { id: "cat-3", name: "Formal Trousers", slug: "trousers", products: 24, image: "👖" },
  { id: "cat-4", name: "Blazers & Jackets", slug: "blazers", products: 18, image: "🧥" },
  { id: "cat-5", name: "Hoodies & Sweatshirts", slug: "hoodies", products: 31, image: "🧣" },
  { id: "cat-6", name: "Caps & Accessories", slug: "caps", products: 27, image: "🧢" },
  { id: "cat-7", name: "Aprons & Uniforms", slug: "aprons", products: 15, image: "🥼" },
  { id: "cat-8", name: "Bags & Totes", slug: "bags", products: 22, image: "🎒" },
];

export const subcategories = [
  { id: "sub-1", category: "Corporate Shirts", name: "Oxford Long Sleeve", products: 12 },
  { id: "sub-2", category: "Corporate Shirts", name: "Slim Fit Executive", products: 8 },
  { id: "sub-3", category: "Polo T-Shirts", name: "Pique Cotton", products: 15 },
  { id: "sub-4", category: "Polo T-Shirts", name: "Performance Dry-Fit", products: 11 },
  { id: "sub-5", category: "Blazers & Jackets", name: "Bomber Jackets", products: 6 },
  { id: "sub-6", category: "Hoodies & Sweatshirts", name: "Pullover Hoodies", products: 14 },
];

const productNames = [
  "Executive Oxford Shirt", "Heritage Pique Polo", "Merino Blend Blazer",
  "Signature Chino Trouser", "Windproof Bomber", "Weekender Hoodie",
  "Artisan Barista Apron", "Corporate Softshell", "Boardroom Blouse",
  "Tailored Waistcoat", "Field Cap Classic", "Weekend Tote",
  "Performance Polo", "Formal Dress Shirt", "Utility Cargo Pant",
  "Premium Crewneck", "Puffer Vest Pro", "Bespoke Suit Jacket",
];

const colors = ["Charcoal", "Navy", "Ivory", "Bronze", "Forest", "Slate", "Bone", "Rust"];

function makeVisibility() {
  const r = rand();
  return {
    inCategories: r < 0.85,
    inBulk: r > 0.35,
    inB2B: r > 0.55,
    inNewCollection: r > 0.75,
    inArrheniux: r > 0.9,
    inCorporateKits: r > 0.7,
  };
}

export const products = Array.from({ length: 48 }, (_, i) => {
  const name = productNames[i % productNames.length]!;
  const cat = pick(categories);
  return {
    id: `PRD-${1000 + i}`,
    code: `ARX-${(2400 + i).toString().padStart(4, "0")}`,
    name: `${name} — ${pick(colors)}`,
    category: cat.name,
    subcategory: pick(subcategories).name,
    tier: rand() > 0.6 ? "Premium" : "Regular",
    material: pick(["100% Cotton", "Cotton-Poly Blend", "Merino Wool", "Performance Poly", "Linen Blend"]),
    gsm: between(140, 320),
    price: between(499, 4999),
    gst: 5,
    stock: between(0, 480),
    orders: between(0, 320),
    rating: (3.5 + rand() * 1.5).toFixed(1),
    active: rand() > 0.08,
    sampleAvailable: rand() > 0.4,
    logoUpload: rand() > 0.3,
    printTypes: ["Embroidery", "Screen Print", "DTG", "Sublimation"].filter(() => rand() > 0.4),
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"].filter(() => rand() > 0.2),
    image: cat.image,
    visibility: makeVisibility(),
    createdAt: `2025-${String(between(1, 12)).padStart(2, "0")}-${String(between(1, 28)).padStart(2, "0")}`,
  };
});

const customerFirstNames = ["Aarav", "Vivaan", "Ananya", "Ishaan", "Diya", "Kabir", "Meera", "Rohan", "Sana", "Aditya", "Priya", "Arjun", "Kavya", "Vihaan", "Zara"];
const customerLastNames = ["Sharma", "Patel", "Iyer", "Kapoor", "Menon", "Reddy", "Bose", "Nair", "Khan", "Verma", "Malhotra", "Rao"];
const companies = ["TCS Consulting", "Infosys Labs", "Zomato Corp", "Swiggy Inc", "Byju's Ltd", "Paytm Fintech", "Ola Mobility", "Flipkart Retail", "Reliance Group", "Wipro Digital", "HCL Studios", "Freshworks"];

export const customers = Array.from({ length: 36 }, (_, i) => {
  const first = customerFirstNames[i % customerFirstNames.length]!;
  const last = pick(customerLastNames);
  const isB2B = rand() > 0.55;
  return {
    id: `CUS-${5000 + i}`,
    name: `${first} ${last}`,
    company: isB2B ? pick(companies) : "—",
    email: `${first.toLowerCase()}.${last.toLowerCase()}@${isB2B ? "corp" : "mail"}.com`,
    phone: `+91 9${between(100000000, 999999999)}`,
    address: `${between(1, 999)}, ${pick(["MG Road", "Brigade Rd", "Powai", "Cyber Hub", "Andheri West", "Koregaon Park"])}, ${pick(["Mumbai", "Bangalore", "Delhi", "Pune", "Hyderabad", "Chennai"])}`,
    type: isB2B ? "B2B Agent" : "Retail",
    totalOrders: between(1, 84),
    totalSpend: between(2500, 480000),
    active: rand() > 0.08,
    registered: `2024-${String(between(1, 12)).padStart(2, "0")}-${String(between(1, 28)).padStart(2, "0")}`,
    avatar: `${first[0]}${last[0]}`,
  };
});

const orderTypes = ["Categories", "Bulk", "Sample", "B2B", "New Collection"] as const;
const orderStatuses = ["Pending", "Processing", "Completed", "Delivered", "Cancelled"] as const;
const paymentStatuses = ["Paid", "Pending", "Partial", "Failed"] as const;
const paymentMethods = ["UPI", "Credit Card", "Net Banking", "Bank Transfer", "Wallet"];

export const orders = Array.from({ length: 64 }, (_, i) => {
  const cust = pick(customers);
  const prod = pick(products);
  const qty = between(1, 250);
  const amount = qty * prod.price;
  return {
    id: `ORD-${20250 + i}`,
    customer: cust.name,
    customerId: cust.id,
    company: cust.company,
    product: prod.name,
    productId: prod.id,
    qty,
    amount,
    type: pick([...orderTypes]),
    status: pick([...orderStatuses]),
    paymentStatus: pick([...paymentStatuses]),
    paymentMethod: pick(paymentMethods),
    date: `2025-${String(between(1, 12)).padStart(2, "0")}-${String(between(1, 28)).padStart(2, "0")}`,
  };
});

export const payments = orders.slice(0, 40).map((o, i) => ({
  id: `TXN-${90000 + i}`,
  orderId: o.id,
  customer: o.customer,
  amount: o.amount,
  method: o.paymentMethod,
  status: o.paymentStatus,
  date: o.date,
}));

export const reviews = Array.from({ length: 28 }, (_, i) => {
  const cust = pick(customers);
  const prod = pick(products);
  return {
    id: `REV-${7000 + i}`,
    customer: cust.name,
    avatar: cust.avatar,
    product: prod.name,
    rating: between(3, 5),
    text: pick([
      "Excellent stitching and fabric — exceeded expectations for our team kit.",
      "Colors were slightly off from swatch but overall quality is superb.",
      "Bulk order was delivered on time and every uniform fit perfectly.",
      "Premium finish. Will reorder for our next hiring drive.",
      "Great product, packaging could be improved.",
    ]),
    status: pick(["Approved", "Pending", "Rejected"]),
    type: rand() > 0.5 ? "Product" : "Company",
    date: `2025-${String(between(1, 12)).padStart(2, "0")}-${String(between(1, 28)).padStart(2, "0")}`,
  };
});

// KPI / Chart helpers
export const revenueDaily = Array.from({ length: 30 }, (_, i) => ({
  label: `D${i + 1}`,
  revenue: between(120000, 380000),
  orders: between(24, 96),
}));

export const revenueMonthly = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
].map((m) => ({
  label: m,
  current: between(1800000, 4600000),
  previous: between(1500000, 4200000),
}));

export const customerGrowth = revenueMonthly.map((m) => ({
  label: m.label,
  customers: between(40, 260),
}));

export const topProducts = [...products]
  .sort((a, b) => b.orders - a.orders)
  .slice(0, 8);

export const lowProducts = [...products]
  .sort((a, b) => a.orders - b.orders)
  .slice(0, 6);

export const categorySales = categories.map((c) => ({
  name: c.name,
  value: between(180000, 1200000),
}));

export const orderStatusBreakdown = orderStatuses.map((s) => ({
  name: s,
  value: orders.filter((o) => o.status === s).length,
}));

export const paymentStatusBreakdown = paymentStatuses.map((s) => ({
  name: s,
  value: payments.filter((p) => p.status === s).length,
}));

export const orderTypeBreakdown = orderTypes.map((t) => ({
  name: t,
  value: orders.filter((o) => o.type === t).length,
}));

function sum<T>(list: T[], f: (x: T) => number) {
  return list.reduce((a, b) => a + f(b), 0);
}

const totalRevenue = sum(orders, (o) => o.amount);
const paidAmount = sum(payments.filter((p) => p.status === "Paid"), (p) => p.amount);
const pendingAmount = sum(payments.filter((p) => p.status === "Pending"), (p) => p.amount);
const partialAmount = sum(payments.filter((p) => p.status === "Partial"), (p) => p.amount);

export const kpis = {
  todayRevenue: 486320,
  weeklyRevenue: 3284650,
  monthlyRevenue: 14680420,
  yearlyRevenue: 168420900,
  totalRevenue,
  receivedAmount: paidAmount,
  pendingAmount,
  partialAmount,
  todayOrders: 48,
  pendingOrders: orders.filter((o) => o.status === "Pending").length,
  processingOrders: orders.filter((o) => o.status === "Processing").length,
  completedOrders: orders.filter((o) => o.status === "Completed").length,
  deliveredOrders: orders.filter((o) => o.status === "Delivered").length,
  cancelledOrders: orders.filter((o) => o.status === "Cancelled").length,
  sampleOrders: orders.filter((o) => o.type === "Sample").length,
  bulkOrders: orders.filter((o) => o.type === "Bulk").length,
  b2bOrders: orders.filter((o) => o.type === "B2B").length,
  newCollectionOrders: orders.filter((o) => o.type === "New Collection").length,
  totalCustomers: customers.filter((c) => c.type === "Retail").length,
  totalB2B: customers.filter((c) => c.type === "B2B Agent").length,
  totalCategories: categories.length,
  totalProducts: products.length,
  totalReviews: reviews.length,
};

export function inr(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

export function sparkline(seed: number, len = 12) {
  const r = mulberry32(seed);
  return Array.from({ length: len }, (_, i) => ({ i, v: 30 + r() * 70 }));
}
