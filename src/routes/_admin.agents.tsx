import { useState } from "react";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { PageShell } from "@/components/admin/page-shell";
import { DataTable, exportCsv, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCollection, type Agent } from "@/lib/store";
import { toast } from "sonner";


function AgentsPage() {
  const { data, add, update, remove } = useCollection<Agent>("agents");
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<Agent | null>(null);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [f, setF] = useState<any>({});

  const openNew = () => { setEditing(null); setF({ code: "", name: "", phone: "", email: "", address: "", status: "Active", joinDate: new Date().toISOString().slice(0, 10) }); setOpen(true); };
  const openEdit = (a: Agent) => { setEditing(a); setF(a); setOpen(true); };

  const cols: Column<Agent>[] = [
    { key: "name", header: "Agent", render: (a) => (
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{a.name.split(" ").map(x => x[0]).join("").slice(0,2)}</div>
        <div><div className="text-sm font-semibold">{a.name}</div><div className="text-[11px] text-muted-foreground">{a.code}</div></div>
      </div>
    ), sortable: true, getValue: (a) => a.name },
    { key: "code", header: "Agent Code", render: (a) => <span className="font-mono text-xs">{a.code}</span>, sortable: true, getValue: (a) => a.code },
    { key: "contact", header: "Contact", render: (a) => (<div><div className="text-xs">{a.email}</div><div className="text-[11px] text-muted-foreground">{a.phone}</div></div>) },
    { key: "address", header: "Address", render: (a) => <span className="line-clamp-1 max-w-[260px] text-xs">{a.address}</span> },
    { key: "join", header: "Joined", render: (a) => <span className="text-xs text-muted-foreground">{a.joinDate}</span> },
    { key: "status", header: "Status", render: (a) => <StatusBadge value={a.status} /> },
    { key: "actions", header: "", render: (a) => (
      <div className="flex justify-end gap-1">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewing(a)}><Eye className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
        <ConfirmButton trigger={<Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
          onConfirm={() => { remove(a.id); toast.success("Deleted"); }} />
      </div>
    ), className: "text-right" },
  ];

  return (
    <PageShell title="B2B Agents" subtitle="Field agents responsible for on-ground B2B outreach"
      actions={<Button onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Add Agent</Button>}>
      <DataTable rows={data} columns={cols} searchKeys={["name", "address", "email", "phone"]}
        onExport={() => { exportCsv("arreniux-agents.csv", data.map(({ company, commissionPct, assignedCustomers, ...rest }) => rest)); toast.success("Exported"); }} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Agent" : "Add Agent"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5"><Label className="text-xs">Agent Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
            <div className="space-y-1.5 md:col-span-2"><Label className="text-xs">Email</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
            <div className="space-y-1.5 md:col-span-2"><Label className="text-xs">Address</Label><Textarea rows={2} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Join Date</Label><Input type="date" value={f.joinDate} onChange={(e) => setF({ ...f, joinDate: e.target.value })} /></div>
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
              if (!f.name) { toast.error("Name required"); return; }
              if (editing) { update(editing.id, f); toast.success("Updated"); }
              else { add(f); toast.success("Added"); }
              setOpen(false);
            }}>{editing ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Agent Details</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground font-bold">{viewing.name.split(" ").map(x=>x[0]).join("").slice(0,2)}</div>
                <div>
                  <div className="font-display text-lg">{viewing.name}</div>
                  <div className="text-xs text-muted-foreground">{viewing.id}</div>
                </div>
              </div>
              <Row k="Email" v={viewing.email} />
              <Row k="Phone" v={viewing.phone} />
              <Row k="Address" v={viewing.address} />
              <Row k="Joined" v={viewing.joinDate} />
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Status</span><StatusBadge value={viewing.status} /></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex items-start justify-between gap-3"><span className="text-muted-foreground">{k}</span><span className="text-right font-medium">{v}</span></div>;
}

export default AgentsPage;
