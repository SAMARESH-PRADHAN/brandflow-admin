import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageShell } from "@/components/admin/page-shell";
import { DataTable, exportCsv, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCollection, inrFull, type Customer } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/customers")({
  head: () => ({ meta: [{ title: "Customers — Arreniux Admin" }] }),
  component: CustomersPage,
});

function CustomersPage() {
  const { data, add, update, remove } = useCollection<Customer>("customers");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [f, setF] = useState<any>({});
  const [tab, setTab] = useState<"All" | "Active" | "Inactive">("All");

  const filtered = tab === "All" ? data : data.filter((c) => c.status === tab);
  const openNew = () => { setEditing(null); setF({ name: "", phone: "", email: "", address: "", status: "Active", totalOrders: 0, totalSpend: 0, joinDate: new Date().toISOString().slice(0, 10) }); setOpen(true); };
  const openEdit = (c: Customer) => { setEditing(c); setF(c); setOpen(true); };

  const cols: Column<Customer>[] = [
    { key: "name", header: "Customer", render: (c) => (
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{c.name.split(" ").map(x => x[0]).join("")}</div>
        <div><div className="text-sm font-semibold">{c.name}</div><div className="text-[11px] text-muted-foreground">{c.id}</div></div>
      </div>
    ), sortable: true, getValue: (c) => c.name },
    { key: "contact", header: "Contact", render: (c) => (<div><div className="text-xs">{c.email}</div><div className="text-[11px] text-muted-foreground">{c.phone}</div></div>) },
    { key: "address", header: "Address", render: (c) => <span className="line-clamp-1 max-w-[220px] text-xs">{c.address}</span> },
    { key: "orders", header: "Orders", render: (c) => <span className="num text-sm">{c.totalOrders}</span>, className: "text-right", sortable: true, getValue: (c) => c.totalOrders },
    { key: "spend", header: "Total Spend", render: (c) => <span className="num text-sm font-semibold">{inrFull(c.totalSpend)}</span>, className: "text-right", sortable: true, getValue: (c) => c.totalSpend },
    { key: "join", header: "Join Date", render: (c) => <span className="text-xs text-muted-foreground">{c.joinDate}</span> },
    { key: "status", header: "Status", render: (c) => <StatusBadge value={c.status} /> },
    { key: "actions", header: "", render: (c) => (
      <div className="flex justify-end gap-1">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
        <ConfirmButton trigger={<Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
          onConfirm={() => { remove(c.id); toast.success("Deleted"); }} />
      </div>
    ), className: "text-right" },
  ];

  return (
    <PageShell title="Customers" subtitle="Retail buyer directory"
      actions={<Button onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Add Customer</Button>}>
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="All">All ({data.length})</TabsTrigger>
          <TabsTrigger value="Active">Active</TabsTrigger>
          <TabsTrigger value="Inactive">Inactive</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <DataTable rows={filtered} columns={cols} searchKeys={["name", "email", "phone", "address"]}
            onExport={() => { exportCsv("arreniux-customers.csv", filtered); toast.success("Exported"); }} />
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Customer" : "Add Customer"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5"><Label className="text-xs">Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
            <div className="space-y-1.5 md:col-span-2"><Label className="text-xs">Email</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
            <div className="space-y-1.5 md:col-span-2"><Label className="text-xs">Address</Label><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Status</Label>
              <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!f.name || !f.email) { toast.error("Name and email required"); return; }
              if (editing) { update(editing.id, f); toast.success("Updated"); }
              else { add(f); toast.success("Added"); }
              setOpen(false);
            }}>{editing ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
