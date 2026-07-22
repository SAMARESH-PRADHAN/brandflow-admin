import { useCallback, useEffect, useState } from "react";
import {
  createItem,
  deleteItem,
  listCollection,
  markAllNotificationsRead,
  updateItem,
} from "./api";

// ============ Types ============
export type ProductVisibility = "Category" | "Bulk" | "Both";
export type Product = {
  id: string;
  code: string;
  name: string;
  category: string;
  type: "Regular" | "Premium" | "Others";
  subCategory: string;
  material: string;
  description: string;
  overview?: string;
  specifications?: string[];
  designGuidelines?: string[];
  washCare?: string[];
  samplePrice: number;
  originalPrice: number;
  status: "Active" | "Inactive";
  image: string;
  images?: string[];
  stock: number;
  orders: number;
  rating: number;
  visibility: ProductVisibility;
  colors: { name: string; hex: string; showInCategory: boolean; showInBulk: boolean }[];
  createdAt: string;
};
export type B2BProduct = {
  id: string;
  code: string;
  name: string;
  subCategory: string;
  material: string;
  description: string;
  samplePrice: number;
  originalPrice: number;
  status: "Active" | "Inactive";
  image: string;
  images?: string[];
  createdAt: string;
  overview?: string;
  specifications?: string[];
  designGuidelines?: string[];
  washCare?: string[];
};
export type NewCollectionProduct = {
  id: string;
  code: string;
  name: string;
  material: string;
  description: string;
  samplePrice: number;
  originalPrice: number;
  status: "Active" | "Inactive";
  image: string;
  images?: string[];
  createdAt: string;
  overview?: string;
  specifications?: string[];
  designGuidelines?: string[];
  washCare?: string[];
};
export type WelcomeKitItem = {
  id: string;
  name: string;
  price: number;
  enabled: boolean;
  image: string;
  images?: string[];
  description: string;
};
export type OrderStatus = "Placed" | "Confirmed" | "In Production" | "Shipped" | "Delivered";
export type OrderType = "Normal" | "Bulk" | "B2B" | "New Collection";
export type Order = {
  id: string;
  customerId: string;
  customer: string;
  phone: string;
  email: string;
  address: string;
  productId: string;
  productCode: string;
  productName: string;
  category: string;
  productType: string;
  subCategory: string;
  material: string;
  description: string;
  printType: string;
  printLocation: string;
  uploadedLogo: string;
  sizes: Record<string, number>;
  qty: number;
  unitPrice: number;
  gstPct: number;
  shipping: number;
  type: OrderType;
  status: OrderStatus;
  paymentStatus: "Paid" | "Pending" | "Partial" | "Failed" | "Refunded";
  paymentMethod: "UPI" | "Credit Card" | "Net Banking" | "COD" | "Wallet";
  isSample: boolean;
  date: string;
  timeline: { status: OrderStatus; at: string }[];
};
export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  totalOrders: number;
  totalSpend: number;
  joinDate: string;
  status: "Active" | "Inactive";
};
export type Agent = {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  status: "Active" | "Inactive";
  joinDate: string;
  company?: string;
  commissionPct?: number;
  assignedCustomers?: number;
};
export type AgentVisit = {
  id: string;
  agentId: string;
  agentName: string;
  agentCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  companyName: string;
  address: string;
  city: string;
  gstNumber: string;
  visitDate: string;
  nextFollowUp: string;
  outcome: "Interested" | "Follow-up" | "Not Interested" | "Converted" | "Sample Requested";
  requirement: string;
  notes: string;
  createdAt: string;
};
export type Notification = {
  id: string;
  type: "order" | "payment" | "review" | "stock" | "agent" | "system";
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
};
export type Payment = {
  id: string;
  orderId: string;
  customer: string;
  amount: number;
  method: Order["paymentMethod"];
  status: Order["paymentStatus"];
  date: string;
};
export type Review = {
  id: string;
  customer: string;
  product: string;
  productId: string;
  orderId: string;
  rating: number;
  comment: string;
  image: string;
  date: string;
  status: "Approved" | "Pending" | "Rejected";
  verified: boolean;
};
export type Settings = {
  brand: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  theme: "light" | "dark";
};

export const KEYS = {
  products: "products",
  b2bProducts: "b2bProducts",
  newCollection: "newCollection",
  welcomeKits: "welcomeKits",
  orders: "orders",
  sampleOrders: "sampleOrders",
  customers: "customers",
  agents: "agents",
  agentVisits: "agentVisits",
  notifications: "notifications",
  payments: "payments",
  reviews: "reviews",
  settings: "settings",
} as const;

// ============ Hook ============
export function useCollection<T extends { id: string }>(key: string): {
  data: T[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  setAll: (v: T[]) => void;
  add: (v: Omit<T, "id"> & { id?: string }) => Promise<T>;
  update: (id: string, patch: Partial<T>) => Promise<void>;
  remove: (id: string) => Promise<void>;
} {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const items = await listCollection<T>(key);
      setData(items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    reload();
  }, [reload]);

  const setAll = useCallback(
    (v: T[]) => {
      if (key === KEYS.notifications && v.every((item) => (item as unknown as Notification).read)) {
        markAllNotificationsRead<T>()
          .then(setData)
          .catch((err) => setError(err instanceof Error ? err.message : "Failed to update notifications"));
        return;
      }
      setData(v);
    },
    [key],
  );

  const add = useCallback(
    async (v: Omit<T, "id"> & { id?: string }) => {
      const item = await createItem<T>(key, v);
      setData((prev) => [item, ...prev]);
      return item;
    },
    [key],
  );

  const update = useCallback(
    async (id: string, patch: Partial<T>) => {
      const item = await updateItem<T>(key, id, patch);
      setData((prev) => prev.map((x) => (x.id === id ? item : x)));
    },
    [key],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteItem(key, id);
      setData((prev) => prev.filter((x) => x.id !== id));
    },
    [key],
  );

  return { data, loading, error, reload, setAll, add, update, remove };
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
