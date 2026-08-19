const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";

const PATHS: Record<string, string> = {
  products: "products",
  b2bProducts: "b2b-products",
  newCollection: "new-collection",
  welcomeKits: "welcome-kits",
  customers: "customers",
  agents: "agents",
  agentVisits: "agent-visits",
  orders: "orders",
  sampleOrders: "sample-orders",
  payments: "payments",
  reviews: "reviews",
  notifications: "notifications",
   moqSettings: "moq-settings",
   discountTiers: "discount-tiers",
   printSettings: "print-settings",
};

export type DiscountTier = {
  id: string;
  category: string;
  subCategory: string | null;
  minQty: number;
  maxQty: number | null;
  discountPct: number;
  isBulk: boolean;
};

export async function fetchDiscountTiers(): Promise<DiscountTier[]> {
  return request<DiscountTier[]>("discount-tiers");
}

export async function saveDiscountTiers(input: {
  category: string;
  subCategory?: string | null;
  tiers: Array<{ minQty: number; maxQty: number | null; discountPct: number; isBulk?: boolean }>;
}): Promise<DiscountTier[]> {
  return request<DiscountTier[]>("discount-tiers", { method: "PUT", body: JSON.stringify(input) });
}

function pathFor(key: string) {
  const segment = PATHS[key];
  if (!segment) throw new Error(`Unknown collection key: ${key}`);
  return segment;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/${url.replace(/^\//, "")}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error ?? "Request failed");
  }

  return res.json() as Promise<T>;
}

export async function listCollection<T>(key: string, queryParams?: Record<string, any>): Promise<{ data: T[]; pagination?: { page: number; limit: number; total: number } }> {
  let qs = "";
  if (queryParams) {
    const cleaned = Object.entries(queryParams).filter(([_, v]) => v !== undefined);
    if (cleaned.length > 0) {
      qs = "?" + new URLSearchParams(cleaned as any).toString();
    }
  }
  const res = await request<T[] | { data: T[]; pagination?: any }>(pathFor(key) + qs);
  if (Array.isArray(res)) return { data: res };
  return res as any;
}

export async function createItem<T>(key: string, body: unknown): Promise<T> {
  return request<T>(pathFor(key), { method: "POST", body: JSON.stringify(body) });
}

export async function updateItem<T>(key: string, id: string, body: unknown): Promise<T> {
  return request<T>(`${pathFor(key)}/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deleteItem(key: string, id: string): Promise<void> {
  await request(`${pathFor(key)}/${id}`, { method: "DELETE" });
}

export async function markAllNotificationsRead<T>(): Promise<T[]> {
  return request<T[]>("notifications/read-all", { method: "PATCH" });
}

export async function uploadImage(
  image: string,
  folder = "uploads",
  options?: { id?: string; index?: number },
): Promise<{ url: string; key: string }> {
  return request("uploads", {
    method: "POST",
    body: JSON.stringify({ image, folder, ...options }),
  });
}

export async function deleteUploadedImage(urlOrKey: string): Promise<void> {
  const body = urlOrKey.includes("://") ? { url: urlOrKey } : { key: urlOrKey };
  await request("uploads", { method: "DELETE", body: JSON.stringify(body) });
}



export type MoqSetting = {
  id: string;
  category: string;
  subCategory: string | null;
  minQty: number;
};

export async function fetchMoqSettings(): Promise<MoqSetting[]> {
  return request<MoqSetting[]>("moq-settings");
}

export async function upsertMoqSetting(input: {
  category: string;
  subCategory?: string | null;
  minQty: number;
}): Promise<MoqSetting> {
  return request<MoqSetting>("moq-settings", { method: "PUT", body: JSON.stringify(input) });
}


export type PrintOptionDto = { id: string; label: string; pricePerPc: number };
export type PrintMethodDto = {
  id: string;
  label: string;
  note?: string;
  options: PrintOptionDto[];
};
export type PrintConfigDto =
  | { kind: "none" }
  | { kind: "free"; label: string }
  | { kind: "custom"; methods: PrintMethodDto[] };

export type PrintSetting = {
  id: string;
  category: string;
  productType: string | null; // "Regular" | "Premium" | null
  subCategory: string | null;
  config: PrintConfigDto;
};

export async function fetchPrintSettings(): Promise<PrintSetting[]> {
  return request<PrintSetting[]>("print-settings");
}

export async function upsertPrintSetting(input: {
  category: string;
  productType?: string | null;
  subCategory?: string | null;
  config: PrintConfigDto;
}): Promise<PrintSetting> {
  return request<PrintSetting>("print-settings", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deletePrintSetting(id: string): Promise<void> {
  await request(`print-settings/${id}`, { method: "DELETE" });
}