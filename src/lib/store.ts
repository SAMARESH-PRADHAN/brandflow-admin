// Arreniux frontend-only data store. Backed by localStorage with seeded demo data.
// SSR-safe: all reads guarded by typeof window checks; useCollection hooks hydrate on mount.

import { useCallback, useEffect, useState } from "react";

const PREFIX = "arreniux:";
const CHANGE_EVENT = "arreniux:change";

// Seeded PRNG for deterministic demo data
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
const r = rng(20260715);
const pick = <T,>(a: T[]): T => a[Math.floor(r() * a.length)]!;
const between = (a: number, b: number) => Math.floor(r() * (b - a + 1)) + a;

// ============ Types ============
export type Product = {
  id: string; code: string; name: string; category: string; type: "Regular" | "Premium" | "Others";
  subCategory: string; material: string; description: string;
  samplePrice: number; originalPrice: number; status: "Active" | "Inactive";
  image: string; stock: number; orders: number; rating: number;
  colors: { name: string; hex: string; showInCategory: boolean; showInBulk: boolean }[];
  createdAt: string;
};
export type B2BProduct = {
  id: string; code: string; name: string; subCategory: string; material: string;
  description: string; samplePrice: number; originalPrice: number;
  status: "Active" | "Inactive"; image: string; createdAt: string;
};
export type NewCollectionProduct = {
  id: string; code: string; name: string; material: string; description: string;
  samplePrice: number; originalPrice: number; status: "Active" | "Inactive"; image: string; createdAt: string;
};
export type WelcomeKitItem = {
  id: string; name: string; price: number; enabled: boolean; image: string; description: string;
};
export type OrderStatus = "Placed" | "Confirmed" | "In Production" | "Shipped" | "Delivered";
export type OrderType = "Normal" | "Bulk" | "B2B" | "New Collection";
export type Order = {
  id: string; customerId: string; customer: string; phone: string; email: string; address: string;
  productId: string; productCode: string; productName: string; category: string;
  productType: string; subCategory: string; material: string; description: string;
  printType: string; printLocation: string; uploadedLogo: string;
  sizes: Record<string, number>;
  qty: number; unitPrice: number; gstPct: number; shipping: number;
  type: OrderType; status: OrderStatus;
  paymentStatus: "Paid" | "Pending" | "Partial" | "Failed" | "Refunded";
  paymentMethod: "UPI" | "Credit Card" | "Net Banking" | "COD" | "Wallet";
  isSample: boolean;
  date: string; timeline: { status: OrderStatus; at: string }[];
};
export type Customer = {
  id: string; name: string; phone: string; email: string; address: string;
  totalOrders: number; totalSpend: number; joinDate: string; status: "Active" | "Inactive";
};
export type Agent = {
  id: string; name: string; phone: string; email: string; company: string;
  commissionPct: number; status: "Active" | "Inactive"; assignedCustomers: number; joinDate: string;
};
export type Payment = {
  id: string; orderId: string; customer: string; amount: number;
  method: Order["paymentMethod"]; status: Order["paymentStatus"]; date: string;
};
export type Review = {
  id: string; customer: string; product: string; productId: string; orderId: string;
  rating: number; comment: string; image: string; date: string;
  status: "Approved" | "Pending" | "Rejected"; verified: boolean;
};
export type Settings = {
  brand: string; email: string; phone: string; address: string; currency: string; theme: "light" | "dark";
};

// ============ Seed generators ============
const CATEGORIES = ["Corporate Shirts", "Polo T-Shirts", "Formal Trousers", "Blazers", "Hoodies", "Caps", "Aprons", "Bags"];
const SUBCATS = ["Oxford", "Slim Fit", "Pique", "Dry-Fit", "Bomber", "Pullover", "Classic", "Executive"];
const MATERIALS = ["100% Cotton", "Cotton-Poly Blend", "Merino Wool", "Performance Poly", "Linen Blend"];
const COLORS_ALL = [
  { name: "Black", hex: "#111" }, { name: "White", hex: "#f8f8f8" }, { name: "Blue", hex: "#2563eb" },
  { name: "Red", hex: "#dc2626" }, { name: "Green", hex: "#16a34a" }, { name: "Yellow", hex: "#facc15" },
  { name: "Orange", hex: "#f97316" }, { name: "Grey", hex: "#6b7280" }, { name: "Pink", hex: "#ec4899" },
  { name: "Navy", hex: "#1e3a8a" },
];
const PRINT_TYPES = ["Embroidery", "Screen Print", "DTG", "Sublimation", "Heat Transfer"];
const PRINT_LOCATIONS = ["Left Chest", "Right Chest", "Back", "Sleeve", "Full Front"];
const FIRST = ["Aarav", "Vivaan", "Ananya", "Ishaan", "Diya", "Kabir", "Meera", "Rohan", "Sana", "Aditya", "Priya", "Arjun", "Kavya", "Vihaan", "Zara", "Rahul", "Neha", "Karan", "Simran", "Aryan"];
const LAST = ["Sharma", "Patel", "Iyer", "Kapoor", "Menon", "Reddy", "Bose", "Nair", "Khan", "Verma", "Malhotra", "Rao"];
const COMPANIES = ["TCS Consulting", "Infosys Labs", "Zomato Corp", "Swiggy Inc", "Byju's Ltd", "Paytm Fintech", "Ola Mobility", "Flipkart Retail", "Reliance Group", "Wipro Digital"];
const CITIES = ["Mumbai", "Bangalore", "Delhi", "Pune", "Hyderabad", "Chennai", "Kolkata"];
const STREETS = ["MG Road", "Brigade Rd", "Powai", "Cyber Hub", "Andheri West", "Koregaon Park", "Sector 21"];

function isoDate(daysAgo: number) {
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}
function isoNow() { return new Date().toISOString(); }

function seedProducts(): Product[] {
  return Array.from({ length: 50 }, (_, i) => {
    const cat = pick(CATEGORIES);
    const colorCount = between(3, 8);
    const shuffled = [...COLORS_ALL].sort(() => r() - 0.5).slice(0, colorCount);
    return {
      id: `PRD-${1000 + i}`,
      code: `ARX-${(2400 + i).toString().padStart(4, "0")}`,
      name: `${pick(["Executive", "Heritage", "Signature", "Premium", "Classic"])} ${cat.split(" ")[0]} ${between(1, 99)}`,
      category: cat,
      type: pick(["Regular", "Premium", "Others"] as const),
      subCategory: pick(SUBCATS),
      material: pick(MATERIALS),
      description: "Premium quality garment crafted for corporate and bulk merchandising needs. Soft-touch finish, wash-durable.",
      samplePrice: between(299, 1499),
      originalPrice: between(1500, 4999),
      status: r() > 0.1 ? "Active" : "Inactive",
      image: "",
      stock: between(0, 480),
      orders: between(0, 320),
      rating: Number((3.5 + r() * 1.5).toFixed(1)),
      colors: shuffled.map((c) => ({
        ...c, showInCategory: r() > 0.3, showInBulk: r() > 0.2,
      })),
      createdAt: isoDate(between(0, 240)),
    };
  });
}
function seedB2B(): B2BProduct[] {
  return Array.from({ length: 20 }, (_, i) => ({
    id: `B2B-${3000 + i}`,
    code: `ARXB-${(400 + i).toString().padStart(4, "0")}`,
    name: `B2B ${pick(["Uniform Kit", "Corporate Pack", "Bulk Polo", "Executive Shirt"])} ${between(1, 99)}`,
    subCategory: pick(["Hospitality", "Corporate", "Healthcare", "Education", "Retail"]),
    material: pick(MATERIALS),
    description: "Optimized for bulk B2B orders with negotiated pricing tiers.",
    samplePrice: between(199, 999),
    originalPrice: between(1000, 3999),
    status: r() > 0.1 ? "Active" : "Inactive",
    image: "",
    createdAt: isoDate(between(0, 180)),
  }));
}
function seedNewCollection(): NewCollectionProduct[] {
  return Array.from({ length: 15 }, (_, i) => ({
    id: `NEW-${4000 + i}`,
    code: `ARXN-${(500 + i).toString().padStart(4, "0")}`,
    name: `New Season ${pick(["Bomber", "Overshirt", "Crewneck", "Trench", "Puffer"])} ${between(1, 50)}`,
    material: pick(MATERIALS),
    description: "Freshly launched collection piece — limited seasonal drop.",
    samplePrice: between(499, 1999),
    originalPrice: between(2000, 5999),
    status: r() > 0.05 ? "Active" : "Inactive",
    image: "",
    createdAt: isoDate(between(0, 60)),
  }));
}
function seedWelcomeKits(): WelcomeKitItem[] {
  const items = ["T-shirt", "Notebook", "Bottle", "Pen", "Bag", "Keychain", "Mug", "Diary", "Cap", "Lanyard"];
  return items.map((name, i) => ({
    id: `KIT-${5000 + i}`,
    name,
    price: between(99, 899),
    enabled: r() > 0.1,
    image: "",
    description: `Premium branded ${name.toLowerCase()} included in the corporate welcome kit.`,
  }));
}
function seedCustomers(): Customer[] {
  return Array.from({ length: 50 }, (_, i) => {
    const first = pick(FIRST), last = pick(LAST);
    return {
      id: `CUS-${6000 + i}`,
      name: `${first} ${last}`,
      phone: `+91 9${between(100000000, 999999999)}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@mail.com`,
      address: `${between(1, 999)}, ${pick(STREETS)}, ${pick(CITIES)}`,
      totalOrders: between(1, 40),
      totalSpend: between(2500, 480000),
      joinDate: isoDate(between(10, 730)),
      status: r() > 0.1 ? "Active" : "Inactive",
    };
  });
}
function seedAgents(): Agent[] {
  return Array.from({ length: 20 }, (_, i) => {
    const first = pick(FIRST), last = pick(LAST);
    return {
      id: `AGT-${7000 + i}`,
      name: `${first} ${last}`,
      phone: `+91 9${between(100000000, 999999999)}`,
      email: `${first.toLowerCase()}@${pick(COMPANIES).split(" ")[0]!.toLowerCase()}.com`,
      company: pick(COMPANIES),
      commissionPct: between(3, 15),
      status: r() > 0.1 ? "Active" : "Inactive",
      assignedCustomers: between(2, 40),
      joinDate: isoDate(between(30, 900)),
    };
  });
}
function seedOrders(products: Product[], customers: Customer[]): Order[] {
  return Array.from({ length: 100 }, (_, i) => {
    const c = pick(customers);
    const p = pick(products);
    const type = pick(["Normal", "Bulk", "B2B", "New Collection"] as const);
    const qty = type === "Bulk" || type === "B2B" ? between(50, 500) : between(1, 8);
    const gstPct = 5;
    const shipping = type === "Bulk" ? 0 : between(49, 199);
    const status = pick(["Placed", "Confirmed", "In Production", "Shipped", "Delivered"] as const);
    const statusOrder: OrderStatus[] = ["Placed", "Confirmed", "In Production", "Shipped", "Delivered"];
    const idx = statusOrder.indexOf(status);
    const daysAgo = between(0, 90);
    return {
      id: `ORD-${20250 + i}`,
      customerId: c.id, customer: c.name, phone: c.phone, email: c.email, address: c.address,
      productId: p.id, productCode: p.code, productName: p.name, category: p.category,
      productType: p.type, subCategory: p.subCategory, material: p.material, description: p.description,
      printType: pick(PRINT_TYPES), printLocation: pick(PRINT_LOCATIONS), uploadedLogo: "",
      sizes: { S: between(0, qty / 4), M: between(0, qty / 3), L: between(0, qty / 3), XL: between(0, qty / 4), XXL: between(0, qty / 6) },
      qty, unitPrice: p.originalPrice, gstPct, shipping,
      type, status,
      paymentStatus: pick(["Paid", "Pending", "Partial", "Failed", "Refunded"] as const),
      paymentMethod: pick(["UPI", "Credit Card", "Net Banking", "COD", "Wallet"] as const),
      isSample: false,
      date: isoDate(daysAgo),
      timeline: statusOrder.slice(0, idx + 1).map((s, si) => ({
        status: s, at: isoDate(daysAgo - si * 2),
      })),
    };
  });
}
function seedSampleOrders(products: Product[], customers: Customer[]): Order[] {
  return Array.from({ length: 25 }, (_, i) => {
    const c = pick(customers); const p = pick(products);
    const type = pick(["Normal", "Bulk", "B2B", "New Collection"] as const);
    const status = pick(["Placed", "Confirmed", "In Production", "Shipped", "Delivered"] as const);
    const statusOrder: OrderStatus[] = ["Placed", "Confirmed", "In Production", "Shipped", "Delivered"];
    const idx = statusOrder.indexOf(status);
    const daysAgo = between(0, 60);
    return {
      id: `SMP-${30250 + i}`,
      customerId: c.id, customer: c.name, phone: c.phone, email: c.email, address: c.address,
      productId: p.id, productCode: p.code, productName: p.name, category: p.category,
      productType: p.type, subCategory: p.subCategory, material: p.material, description: p.description,
      printType: pick(PRINT_TYPES), printLocation: pick(PRINT_LOCATIONS), uploadedLogo: "",
      sizes: { M: 1 },
      qty: 1, unitPrice: p.samplePrice, gstPct: 5, shipping: 99,
      type, status,
      paymentStatus: pick(["Paid", "Pending", "Partial"] as const),
      paymentMethod: pick(["UPI", "Credit Card", "Net Banking", "COD", "Wallet"] as const),
      isSample: true,
      date: isoDate(daysAgo),
      timeline: statusOrder.slice(0, idx + 1).map((s, si) => ({ status: s, at: isoDate(daysAgo - si * 2) })),
    };
  });
}
function seedPayments(orders: Order[]): Payment[] {
  return orders.slice(0, 120).map((o, i) => ({
    id: `TXN-${90000 + i}`, orderId: o.id, customer: o.customer,
    amount: o.qty * o.unitPrice + o.shipping,
    method: o.paymentMethod, status: o.paymentStatus, date: o.date,
  }));
}
function seedReviews(products: Product[], customers: Customer[]): Review[] {
  const comments = [
    "Excellent stitching and fabric — exceeded expectations for our team kit.",
    "Colors were slightly off from swatch but overall quality is superb.",
    "Bulk order was delivered on time and every uniform fit perfectly.",
    "Premium finish. Will reorder for our next hiring drive.",
    "Great product, packaging could be improved.",
    "Fabric feels luxurious. Received many compliments.",
  ];
  return Array.from({ length: 80 }, (_, i) => {
    const c = pick(customers); const p = pick(products);
    return {
      id: `REV-${8000 + i}`, customer: c.name, product: p.name, productId: p.id,
      orderId: `ORD-${20250 + between(0, 99)}`,
      rating: between(3, 5), comment: pick(comments), image: "",
      date: isoDate(between(0, 120)),
      status: pick(["Approved", "Pending", "Rejected"] as const),
      verified: r() > 0.2,
    };
  });
}
function seedSettings(): Settings {
  return {
    brand: "Arreniux", email: "hello@arreniux.com", phone: "+91 9812345678",
    address: "Bandra West, Mumbai, India", currency: "INR", theme: "light",
  };
}

// ============ Core storage helpers ============
function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try { const raw = localStorage.getItem(PREFIX + key); return raw ? (JSON.parse(raw) as T) : null; }
  catch { return null; }
}
function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key } }));
}

export const KEYS = {
  products: "products", b2bProducts: "b2bProducts", newCollection: "newCollection",
  welcomeKits: "welcomeKits", orders: "orders", sampleOrders: "sampleOrders",
  customers: "customers", agents: "agents", payments: "payments", reviews: "reviews",
  settings: "settings",
} as const;

export function initDemoData(force = false) {
  if (typeof window === "undefined") return;
  const has = localStorage.getItem(PREFIX + KEYS.products);
  if (has && !force) return;
  const products = seedProducts();
  const customers = seedCustomers();
  const orders = seedOrders(products, customers);
  const samples = seedSampleOrders(products, customers);
  write(KEYS.products, products);
  write(KEYS.b2bProducts, seedB2B());
  write(KEYS.newCollection, seedNewCollection());
  write(KEYS.welcomeKits, seedWelcomeKits());
  write(KEYS.customers, customers);
  write(KEYS.agents, seedAgents());
  write(KEYS.orders, orders);
  write(KEYS.sampleOrders, samples);
  write(KEYS.payments, seedPayments(orders));
  write(KEYS.reviews, seedReviews(products, customers));
  if (!read(KEYS.settings)) write(KEYS.settings, seedSettings());
}

export function resetDemoData() {
  if (typeof window === "undefined") return;
  Object.values(KEYS).forEach((k) => localStorage.removeItem(PREFIX + k));
  initDemoData(true);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key: "*" } }));
}

// ============ Hook ============
export function useCollection<T extends { id: string }>(key: string): {
  data: T[]; setAll: (v: T[]) => void; add: (v: Omit<T, "id"> & { id?: string }) => T;
  update: (id: string, patch: Partial<T>) => void; remove: (id: string) => void;
} {
  const [data, setData] = useState<T[]>([]);

  useEffect(() => {
    initDemoData();
    const load = () => setData((read<T[]>(key) ?? []) as T[]);
    load();
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.key === key || detail.key === "*") load();
    };
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", load);
    };
  }, [key]);

  const setAll = useCallback((v: T[]) => { write(key, v); setData(v); }, [key]);
  const add = useCallback((v: Omit<T, "id"> & { id?: string }) => {
    const id = v.id ?? `${key.toUpperCase().slice(0, 3)}-${Date.now()}`;
    const item = { ...v, id } as T;
    const next = [item, ...data];
    write(key, next); setData(next);
    return item;
  }, [key, data]);
  const update = useCallback((id: string, patch: Partial<T>) => {
    const next = data.map((x) => (x.id === id ? { ...x, ...patch } : x));
    write(key, next); setData(next);
  }, [key, data]);
  const remove = useCallback((id: string) => {
    const next = data.filter((x) => x.id !== id);
    write(key, next); setData(next);
  }, [key, data]);

  return { data, setAll, add, update, remove };
}

// Read-only snapshot (for aggregates that don't need reactivity beyond change events)
export function readCollection<T>(key: string): T[] {
  return (read<T[]>(key) ?? []) as T[];
}

// ============ Format helpers ============
export function inr(n: number) {
  if (n == null || isNaN(n)) return "₹0";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}
export function inrFull(n: number) {
  return `₹${(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
