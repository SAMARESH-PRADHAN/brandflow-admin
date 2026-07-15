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
import { useCollection, type Agent } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/agents")({
  head: () => ({ meta: [{ title: "B2B Agents — Arreniux Admin" }] }),
  component: AgentsPage,
});

function AgentsPage() {
  const { data, add, update, remove } = useCollection<Agent>("agents");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [f, setF] = useState<any>({});

  const openNew = () => { setEditing(null); setF({ name: "", phone: "", email: "", company: "", commissionPct: 8, status: "Active", assignedCustomers: 0, joinDate: new Date().toISOString().slice(0, 10) }); setOpen(true); };
  const openEdit = (a: Agent) => { setEditing(a); setF(a); setOpen(true); };

  const cols: Column<Agent>[] = [
    { key: "name", header: "Agent", render: (a) => (
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{a.name.split(" ").map(x => x[0]).join("")}</div>
        <div><div className="text-sm font-semibold">{a.name}</div><div className="text-[11px] text-muted-foreground">{a.id}</div></div>
      </div>
    ), sortable: true, getValue: (a) => a.name },
    { key: "company", header: "Company", render: (a) => <span className="text-sm">{a.company}</span> },
    { key: "contact", header: "Contact", render: (a) => (<div><div className="text-xs">{a.email}</div><div className="text-[11px] text-muted-foreground">{a.phone}</div></div>) },
    { key: "commission", header: "Commission", render: (a) => <span className="num text-sm font-semibold">{a.commissionPct}%</span>, className: "text-right", sortable: true, getValue: (a) => a.commissionPct },
    { key: "customers", header: "Assigned", render: (a) => <span className="num text-sm">{a.assignedCustomers}</span>, className: "text-right" },
    { key: "join", header: "Joined", render: (a) => <span className="text-xs text-muted-foreground">{a.joinDate}</span> },
    { key: "status", header: "Status", render: (a) => <StatusBadge value={a.status} /> },
    { key: "actions", header: "", render: (a) => (
      <div className="flex justify-end gap-1">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
        <ConfirmButton trigger={<Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
          onConfirm={() => { remove(a.id); toast.success("Deleted"); }} />
      </div>
    ), className: "text-right" },
  ];

  return (
    <PageShell title="B2B Agents" subtitle="Channel partners and their commission structure"
      actions={<Button onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Add Agent</Button>}>
      <DataTable rows={data} columns={cols} searchKeys={["name", "company", "email", "phone"]}
        onExport={() => { exportCsv("arreniux-agents.csv", data); toast.success("Exported"); }} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Agent" : "Add Agent"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5"><Label className="text-xs">Agent Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Company</Label><Input value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Commission %</Label><Input type="number" value={f.commissionPct} onChange={(e) => setF({ ...f, commissionPct: +e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Assigned Customers</Label><Input type="number" value={f.assignedCustomers} onChange={(e) => setF({ ...f, assignedCustomers: +e.target.value })} /></div>
            <div className="space-y-1.5 md:col-span-2"><Label className="text-xs">Status</Label>
              <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!f.name) { toast.error("Name required"); return; }
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
