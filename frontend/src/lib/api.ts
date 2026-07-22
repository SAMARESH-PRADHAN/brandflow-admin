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
};

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

export async function listCollection<T>(key: string): Promise<T[]> {
  return request<T[]>(pathFor(key));
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
