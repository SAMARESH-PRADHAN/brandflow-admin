import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { Eye, Filter } from "lucide-react";
import { PageShell } from "@/components/admin/page-shell";
import { DataTable, exportCsv, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { DateRangeFilter, inRange, type DateRange } from "@/components/admin/date-range-filter";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCollection, inrFull, type Order, type OrderStatus } from "@/lib/store";
import { toast } from "sonner";
import { GenerateInvoiceDialog } from "@/components/admin/generate-invoice-dialog";

const STATUSES: (OrderStatus | "All")[] = [
  "All",
  "Placed",
  "Confirmed",
  "In Production",
  "Shipped",
  "Delivered",
];

function OrdersPage() {
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<"All" | Order["type"]>("All");
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });
  const [status, setStatus] = useState<"All" | OrderStatus>("All");
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const { data, loading, pagination, update } = useCollection<Order>("orders", {
    page,
    limit: 100,
    type: tab === "All" ? undefined : tab,
    status: status === "All" ? undefined : status,
    from: range.from || undefined,
    to: range.to || undefined,
  });

  const filtered = useMemo(() => {
    if (pagination) return data; // if paginated, filtering is done server-side
    return data.filter(
      (o) =>
        (tab === "All" || o.type === tab) &&
        (status === "All" || o.status === status) &&
        inRange(o.date, range),
    );
  }, [data, tab, range, status, pagination]);
  const agentOrders = useMemo(() => filtered.filter((o) => o.type === "Sales Agent"), [filtered]);
  const agentSalesTotal = useMemo(
    () => agentOrders.reduce((s, o) => s + Number(o.totalAmount || o.qty * o.unitPrice || 0), 0),
    [agentOrders],
  );
  const agentEarningsTotal = useMemo(
    () => agentOrders.reduce((s, o) => s + Number(o.agentEarning ?? 0), 0),
    [agentOrders],
  );

  function OrderSourceBadge({ type }: { type: string }) {
    const t = type || "Normal";
    const styles: Record<string, string> = {
      Normal: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
      Bulk: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
      B2B: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
      "New Collection": "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
      "Sales Agent": "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
    };
    return (
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${styles[t] ?? styles.Normal}`}
      >
        {t}
      </span>
    );
  }

  // const cols: Column<Order>[] = [
  //   {
  //     key: "id",
  //     header: "Order ID",
  //     render: (o) => <span className="font-mono text-xs">{o.id}</span>,
  //     sortable: true,
  //     getValue: (o) => o.id,
  //   },
  //   {
  //     key: "customer",
  //     header: "Customer",
  //     render: (o) => (
  //       <div>
  //         <div className="text-sm font-semibold">{o.customer}</div>
  //         <div className="text-[11px] text-muted-foreground">{o.phone}</div>
  //       </div>
  //     ),
  //   },
  //   { key: "type", header: "Type", render: (o) => <StatusBadge value={o.type} /> },
  //   {
  //     key: "agent",
  //     header: "Agent",
  //     render: (o) =>
  //       o.type === "Sales Agent" ? (
  //         <div>
  //           <div className="text-sm font-medium">{o.salesAgentName || "—"}</div>
  //           <div className="font-mono text-[11px] text-muted-foreground">
  //             {o.salesAgentCode || ""}
  //           </div>
  //         </div>
  //       ) : (
  //         <span className="text-[11px] text-muted-foreground">—</span>
  //       ),
  //   },
  //   {
  //     key: "agentEarning",
  //     header: "Agent Earn",
  //     className: "text-right",
  //     sortable: true,
  //     getValue: (o) => o.agentEarning ?? 0,
  //     render: (o) =>
  //       o.type === "Sales Agent" ? (
  //         <span className="num text-sm font-medium text-emerald-700">
  //           {inrFull(o.agentEarning ?? 0)}
  //         </span>
  //       ) : (
  //         <span className="text-[11px] text-muted-foreground">—</span>
  //       ),
  //   },
  //   {
  //     key: "agentPayout",
  //     header: "Agent Payout",
  //     render: (o) => {
  //       if (o.type !== "Sales Agent") {
  //         return <span className="text-[11px] text-muted-foreground">—</span>;
  //       }
  //       const paid = o.agentPayoutStatus === "Paid";
  //       return (
  //         <Button
  //           size="sm"
  //           variant={paid ? "default" : "outline"}
  //           className="h-8 text-xs"
  //           onClick={async () => {
  //             const next = paid ? "Pending" : "Paid";
  //             try {
  //               // Option A — generic patch:
  //               await update(o.id, { agentPayoutStatus: next });
  //               // Option B — if you use dedicated route, replace with fetch (see below)
  //               toast.success(next === "Paid" ? "Agent payout marked Paid" : "Marked Pending");
  //             } catch (err) {
  //               toast.error("Failed to update agent payout");
  //             }
  //           }}
  //         >
  //           {paid ? "Paid" : "Pending"}
  //         </Button>
  //       );
  //     },
  //   },
  //   {
  //     key: "date",
  //     header: "Date",
  //     render: (o) => <span className="text-xs text-muted-foreground">{o.date}</span>,
  //     sortable: true,
  //     getValue: (o) => o.date,
  //   },
  //   {
  //     key: "amount",
  //     header: "Amount",
  //     render: (o) => (
  //       <span className="num text-sm font-semibold">
  //         {inrFull(o.totalAmount > 0 ? o.totalAmount : o.qty * o.unitPrice)}
  //       </span>
  //     ),
  //     sortable: true,
  //     getValue: (o) => (o.totalAmount > 0 ? o.totalAmount : o.qty * o.unitPrice),
  //     className: "text-right",
  //   },
  //   {
  //     key: "paid",
  //     header: "Paid",
  //     render: (o) => <span className="num text-sm">{inrFull(o.paidAmount)}</span>,
  //     className: "text-right",
  //   },
  //   // {
  //   //   key: "type",
  //   //   header: "Source",
  //   //   sortable: true,
  //   //   getValue: (o) => o.type,
  //   //   render: (o) => <OrderSourceBadge type={o.type} />,
  //   // },
  //   // {
  //   //   key: "agent",
  //   //   header: "Agent",
  //   //   render: (o) =>
  //   //     o.type === "Sales Agent" ? (
  //   //       <div className="text-xs">
  //   //         <div className="font-medium">{o.salesAgentName || "—"}</div>
  //   //         <div className="font-mono text-[11px] text-muted-foreground">{o.salesAgentCode || ""}</div>
  //   //       </div>
  //   //     ) : (
  //   //       <span className="text-xs text-muted-foreground">—</span>
  //   //     ),
  //   // },
  //   // {
  //   //   key: "agentEarning",
  //   //   header: "Agent Earn",
  //   //   sortable: true,
  //   //   getValue: (o) => o.agentEarning ?? 0,
  //   //   render: (o) =>
  //   //     o.type === "Sales Agent" ? (
  //   //       <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
  //   //         ₹{Number(o.agentEarning ?? 0).toLocaleString("en-IN")}
  //   //       </span>
  //   //     ) : (
  //   //       <span className="text-xs text-muted-foreground">—</span>
  //   //     ),
  //   // },
  //   {
  //     key: "due",
  //     header: "Due",
  //     render: (o) => (
  //       <span className="num text-sm text-destructive">
  //         {inrFull(Math.max(0, (o.totalAmount || o.qty * o.unitPrice) - o.paidAmount))}
  //       </span>
  //     ),
  //     className: "text-right",
  //   },
  //   { key: "payment", header: "Payment", render: (o) => <StatusBadge value={o.paymentStatus} /> },

  //   { key: "status", header: "Status", render: (o) => <StatusBadge value={o.status} /> },
  //   {
  //     key: "logo",
  //     header: "Artwork",
  //     render: (o) =>
  //       o.uploadedLogo ? (
  //         <img
  //           loading="lazy"
  //           src={o.uploadedLogo}
  //           alt="artwork"
  //           className="h-8 w-12 rounded border border-border object-cover"
  //         />
  //       ) : (
  //         <span className="text-[10px] text-muted-foreground">—</span>
  //       ),
  //   },
  //   {
  //     key: "actions",
  //     header: "",
  //     render: (o) => (
  //       <div className="flex items-center justify-end gap-1.5">
  //         <Button size="sm" variant="outline" onClick={() => setInvoiceOrder(o)}>
  //           Generate Invoice
  //         </Button>
  //         <Button asChild size="sm" variant="outline">
  //           <Link to={`/orders/${o.id}`}>
  //             <Eye className="mr-1 h-3.5 w-3.5" /> Details
  //           </Link>
  //         </Button>
  //       </div>
  //     ),
  //     className: "text-right",
  //   },
  // ];
const cols: Column<Order>[] = [
  // 1. ORDER ID
  {
    key: "id",
    header: "Order ID",
    render: (o) => (
      <span className="font-mono text-xs font-medium whitespace-nowrap">
        {o.id}
      </span>
    ),
    sortable: true,
    getValue: (o) => o.id,
  },

  // 2. CUSTOMER = NAME + PHONE
  {
    key: "customer",
    header: "Customer",
    render: (o) => (
      <div className="min-w-[150px]">
        <div className="text-sm font-semibold truncate">
          {o.customer}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {o.phone}
        </div>
      </div>
    ),
    getValue: (o) => `${o.customer} ${o.phone}`,
  },

  // 3. TYPE
  {
    key: "type",
    header: "Type",
    render: (o) => (
      <StatusBadge value={o.type} />
    ),
    getValue: (o) => o.type,
  },

  // 4. AGENT = NAME + CODE
  {
    key: "agent",
    header: "Agent",
    render: (o) =>
      o.type === "Sales Agent" ? (
        <div className="min-w-[120px]">
          <div className="text-sm font-medium truncate">
            {o.salesAgentName || "—"}
          </div>

          <div className="font-mono text-[11px] text-muted-foreground">
            {o.salesAgentCode || "—"}
          </div>
        </div>
      ) : (
        <span className="text-[11px] text-muted-foreground">
          —
        </span>
      ),

    getValue: (o) =>
      `${o.salesAgentName || ""} ${o.salesAgentCode || ""}`,
  },

  // 5. AGENT EARN = EARNING + PAID/PENDING
  {
    key: "agentEarning",
    header: "Agent Earn",
    render: (o) => {
      if (o.type !== "Sales Agent") {
        return (
          <span className="text-[11px] text-muted-foreground">
            —
          </span>
        );
      }

      const paid = o.agentPayoutStatus === "Paid";

      return (
        <div className="flex min-w-[120px] flex-col items-start gap-1.5">
          <span className="num text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {inrFull(o.agentEarning ?? 0)}
          </span>

          <Button
            size="sm"
            variant={paid ? "default" : "outline"}
            className="h-7 px-2 text-[11px]"
            onClick={async () => {
              const next = paid ? "Pending" : "Paid";

              try {
                await update(o.id, {
                  agentPayoutStatus: next,
                });

                toast.success(
                  next === "Paid"
                    ? "Agent payout marked Paid"
                    : "Marked Pending"
                );
              } catch (err) {
                toast.error("Failed to update agent payout");
              }
            }}
          >
            {paid ? "Paid" : "Pending"}
          </Button>
        </div>
      );
    },

    sortable: true,

    getValue: (o) => o.agentEarning ?? 0,
  },

  // 6. DATE
  {
    key: "date",
    header: "Date",
    render: (o) => (
      <span className="whitespace-nowrap text-xs text-muted-foreground">
        {o.date}
      </span>
    ),
    sortable: true,
    getValue: (o) => o.date,
  },

  // 7. TOTAL AMOUNT = TOTAL + PAID + DUE
  {
    key: "amount",
    header: "Total Amount",
    render: (o) => {
      const total =
        o.totalAmount > 0
          ? o.totalAmount
          : o.qty * o.unitPrice;

      const paid = Number(o.paidAmount || 0);

      const due = Math.max(0, total - paid);

      return (
        <div className="min-w-[140px] space-y-1">
          <div className="num text-sm font-bold">
            {inrFull(total)}
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-emerald-700 dark:text-emerald-400">
              Paid: {inrFull(paid)}
            </span>

            <span className="text-destructive">
              Due: {inrFull(due)}
            </span>
          </div>
        </div>
      );
    },

    sortable: true,

    getValue: (o) =>
      o.totalAmount > 0
        ? o.totalAmount
        : o.qty * o.unitPrice,

    className: "text-left",
  },

  // 8. PAYMENT STATUS
  {
    key: "payment",
    header: "Payment Status",
    render: (o) => (
      <StatusBadge value={o.paymentStatus} />
    ),
    getValue: (o) => o.paymentStatus,
  },

  // 9. ORDER STATUS
  {
    key: "status",
    header: "Order Status",
    render: (o) => (
      <StatusBadge value={o.status} />
    ),
    getValue: (o) => o.status,
  },

  // 10. ACTIONS = INVOICE + DETAILS
  {
    key: "actions",
    header: "Action",
    render: (o) => (
      <div className="flex min-w-[180px] items-center justify-end gap-1.5">
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs whitespace-nowrap"
          onClick={() => setInvoiceOrder(o)}
        >
          Generate Invoice
        </Button>

        <Button
          asChild
          size="sm"
          variant="outline"
          className="h-8 text-xs whitespace-nowrap"
        >
          <Link to={`/orders/${o.id}`}>
            <Eye className="mr-1 h-3.5 w-3.5" />
            Details
          </Link>
        </Button>
      </div>
    ),

    className: "text-right",
  },
];

  return (
    <PageShell title="All Orders" subtitle="Normal, B2B, New Collection and Sales Agent orders">
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="All">All ({data.length})</TabsTrigger>
          <TabsTrigger value="Normal">
            Normal ({data.filter((o) => o.type === "Normal").length})
          </TabsTrigger>
          {/* <TabsTrigger value="Bulk">Bulk ({data.filter((o) => o.type === "Bulk").length})</TabsTrigger> */}
          <TabsTrigger value="B2B">B2B ({data.filter((o) => o.type === "B2B").length})</TabsTrigger>
          <TabsTrigger value="New Collection">
            New Collection ({data.filter((o) => o.type === "New Collection").length})
          </TabsTrigger>
          <TabsTrigger value="Sales Agent">
            Sales Agent ({data.filter((o) => o.type === "Sales Agent").length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <DateRangeFilter value={range} onChange={setRange} label="Order date" />
        <div className="flex items-end gap-2 rounded-xl border border-border bg-secondary/30 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Filter className="h-4 w-4" /> Status
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Status
            </Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg border p-3 text-sm">
          <div className="text-xs text-muted-foreground">Sales Agent orders (this view)</div>
          <div className="text-lg font-semibold">{agentOrders.length}</div>
        </div>
        <div className="rounded-lg border p-3 text-sm">
          <div className="text-xs text-muted-foreground">Agent channel sales</div>
          <div className="text-lg font-semibold">{inrFull(agentSalesTotal)}</div>
        </div>
        <div className="rounded-lg border p-3 text-sm">
          <div className="text-xs text-muted-foreground">Total agent earnings</div>
          <div className="text-lg font-semibold text-emerald-700">
            {inrFull(agentEarningsTotal)}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <DataTable
          rows={filtered}
          columns={cols}
          pageSize={10}
          loading={loading}
          searchKeys={["id", "customer", "phone", "productName"]}
          serverSide={!!pagination}
          serverTotalPages={pagination ? Math.ceil(pagination.total / pagination.limit) : 1}
          currentPage={page}
          onPageChange={setPage}
          onExport={() => {
            exportCsv(
              `arreniux-orders-${tab.toLowerCase()}.csv`,
              filtered.map((o) => ({
                id: o.id,
                customer: o.customer,
                phone: o.phone,
                type: o.type,
                date: o.date,
                qty: o.qty,
                amount: o.qty * o.unitPrice,
                payment: o.paymentStatus,
                status: o.status,
              })),
            );
            toast.success("Exported filtered rows");
          }}
        />
      </div>
      <GenerateInvoiceDialog
        order={invoiceOrder}
        open={!!invoiceOrder}
        onOpenChange={(v) => !v && setInvoiceOrder(null)}
        onSave={async (id, invoiceNumber, date) => {
          await update(id, { invoiceNumber, date });
        }}
      />
    </PageShell>
  );
}

export default OrdersPage;
