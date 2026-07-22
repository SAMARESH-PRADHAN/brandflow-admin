export function formatDate(value: unknown): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export function formatDateTime(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  return new Date(String(value)).toISOString();
}

export function num(value: unknown): number {
  return Number(value ?? 0);
}

export function jsonArray<T>(value: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export function jsonObject<T extends Record<string, unknown>>(value: unknown, fallback: T): T {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as T;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export function mapProduct(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    code: row.code as string,
    name: row.name as string,
    category: row.category as string,
    type: row.type as "Regular" | "Premium" | "Others",
    subCategory: row.sub_category as string,
    material: row.material as string,
    description: row.description as string,
    overview: (row.overview as string | null) ?? undefined,
    specifications: jsonArray<string>(row.specifications),
    designGuidelines: jsonArray<string>(row.design_guidelines),
    washCare: jsonArray<string>(row.wash_care),
    samplePrice: num(row.sample_price),
    originalPrice: num(row.original_price),
    status: row.status as "Active" | "Inactive",
    image: row.image as string,
    images: jsonArray<string>(row.images),
    stock: num(row.stock),
    orders: num(row.orders_count),
    rating: num(row.rating),
    visibility: row.visibility as "Category" | "Bulk" | "Both",
    colors: jsonArray(row.colors),
    createdAt: formatDate(row.created_at),
  };
}

export function mapB2BProduct(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    code: row.code as string,
    name: row.name as string,
    subCategory: row.sub_category as string,
    material: row.material as string,
    description: row.description as string,
    overview: (row.overview as string | null) ?? undefined,
    specifications: jsonArray<string>(row.specifications),
    designGuidelines: jsonArray<string>(row.design_guidelines),
    washCare: jsonArray<string>(row.wash_care),
    samplePrice: num(row.sample_price),
    originalPrice: num(row.original_price),
    status: row.status as "Active" | "Inactive",
    image: row.image as string,
    images: jsonArray<string>(row.images),
    createdAt: formatDate(row.created_at),
  };
}

export function mapNewCollectionProduct(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    code: row.code as string,
    name: row.name as string,
    material: row.material as string,
    description: row.description as string,
    overview: (row.overview as string | null) ?? undefined,
    specifications: jsonArray<string>(row.specifications),
    designGuidelines: jsonArray<string>(row.design_guidelines),
    washCare: jsonArray<string>(row.wash_care),
    samplePrice: num(row.sample_price),
    originalPrice: num(row.original_price),
    status: row.status as "Active" | "Inactive",
    image: row.image as string,
    images: jsonArray<string>(row.images),
    createdAt: formatDate(row.created_at),
  };
}

export function mapWelcomeKitItem(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: row.name as string,
    price: num(row.price),
    enabled: Boolean(row.enabled),
    image: row.image as string,
    images: jsonArray<string>(row.images),
    description: row.description as string,
  };
}

export function mapCustomer(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: row.name as string,
    phone: row.phone as string,
    email: row.email as string,
    address: row.address as string,
    totalOrders: num(row.total_orders),
    totalSpend: num(row.total_spend),
    joinDate: formatDate(row.join_date),
    status: row.status as "Active" | "Inactive",
  };
}

export function mapAgent(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    code: row.code as string,
    name: row.name as string,
    phone: row.phone as string,
    email: row.email as string,
    address: row.address as string,
    status: row.status as "Active" | "Inactive",
    joinDate: formatDate(row.join_date),
  };
}

export function mapOrder(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    customer: row.customer_name as string,
    phone: row.phone as string,
    email: row.email as string,
    address: row.address as string,
    productId: row.product_id as string,
    productCode: row.product_code as string,
    productName: row.product_name as string,
    category: row.category as string,
    productType: row.product_type as string,
    subCategory: row.sub_category as string,
    material: row.material as string,
    description: row.description as string,
    printType: row.print_type as string,
    printLocation: row.print_location as string,
    uploadedLogo: row.uploaded_logo as string,
    sizes: jsonObject<Record<string, number>>(row.sizes, {}),
    qty: num(row.qty),
    unitPrice: num(row.unit_price),
    gstPct: num(row.gst_pct),
    shipping: num(row.shipping),
    type: row.type as "Normal" | "Bulk" | "B2B" | "New Collection",
    status: row.status as "Placed" | "Confirmed" | "In Production" | "Shipped" | "Delivered",
    paymentStatus: row.payment_status as "Paid" | "Pending" | "Partial" | "Failed" | "Refunded",
    paymentMethod: row.payment_method as "UPI" | "Credit Card" | "Net Banking" | "COD" | "Wallet",
    isSample: Boolean(row.is_sample),
    date: formatDate(row.order_date),
    timeline: jsonArray(row.timeline),
  };
}

export function mapPayment(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    orderId: row.order_id as string,
    customer: row.customer as string,
    amount: num(row.amount),
    method: row.method as "UPI" | "Credit Card" | "Net Banking" | "COD" | "Wallet",
    status: row.status as "Paid" | "Pending" | "Partial" | "Failed" | "Refunded",
    date: formatDate(row.paid_date),
  };
}

export function mapReview(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    customer: row.customer as string,
    product: row.product as string,
    productId: row.product_id as string,
    orderId: row.order_id as string,
    rating: num(row.rating),
    comment: row.comment as string,
    image: row.image as string,
    date: formatDate(row.review_date),
    status: row.status as "Approved" | "Pending" | "Rejected",
    verified: Boolean(row.verified),
  };
}

export function mapAgentVisit(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    agentId: row.agent_id as string,
    agentName: row.agent_name as string,
    agentCode: row.agent_code as string,
    customerName: row.customer_name as string,
    customerPhone: row.customer_phone as string,
    customerEmail: row.customer_email as string,
    companyName: row.company_name as string,
    address: row.address as string,
    city: row.city as string,
    gstNumber: row.gst_number as string,
    visitDate: formatDate(row.visit_date),
    nextFollowUp: formatDate(row.next_follow_up),
    outcome: row.outcome as
      | "Interested"
      | "Follow-up"
      | "Not Interested"
      | "Converted"
      | "Sample Requested",
    requirement: row.requirement as string,
    notes: row.notes as string,
    createdAt: formatDateTime(row.created_at),
  };
}

export function mapNotification(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    type: row.type as "order" | "payment" | "review" | "stock" | "agent" | "system",
    title: row.title as string,
    message: row.message as string,
    link: (row.link as string | null) ?? undefined,
    read: Boolean(row.read),
    createdAt: formatDateTime(row.created_at),
  };
}

export function mapSettings(row: Record<string, unknown>) {
  return {
    brand: row.brand as string,
    email: row.email as string,
    phone: row.phone as string,
    address: row.address as string,
    currency: row.currency as string,
    theme: row.theme as "light" | "dark",
  };
}
