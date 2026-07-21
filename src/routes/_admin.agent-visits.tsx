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
import { useCollection, type AgentVisit, type Agent } from "@/lib/store";
import { toast } from "sonner";

const OUTCOMES = ["Interested", "Follow-up", "Not Interested", "Converted", "Sample Requested"] as const;

export default function AgentVisitsPage() {
  const { data, add, update, remove } = useCollection<AgentVisit>("agentVisits");
  const { data: agents } = useCollection<Agent>("agents");
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<AgentVisit | null>(null);
  const [editing, setEditing] = useState<AgentVisit | null>(null);
  const [f, setF] = useState<any>({});

  const openNew = () => {
    const a = agents[0];
    setEditing(null);
    setF({
      agentId: a?.id ?? "", agentName: a?.name ?? "", agentCode: a?.code ?? "",
      customerName: "", customerPhone: "", customerEmail: "",
      companyName: "", address: "", city: "", gstNumber: "",
      visitDate: new Date().toISOString().slice(0, 10),
      nextFollowUp: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      outcome: "Interested", requirement: "", notes: "",
    });
    setOpen(true);
  };
  const openEdit = (v: AgentVisit) => { setEditing(v); setF(v); setOpen(true); };

  const cols: Column<AgentVisit>[] = [
    { key: "date", header: "Visit Date", render: (v) => <span className="text-xs">{v.visitDate}</span>, sortable: true, getValue: (v) => v.visitDate },
    { key: "agent", header: "Agent", render: (v) => (
      <div><div className="text-sm font-semibold">{v.agentName}</div><div className="text-[11px] font-mono text-muted-foreground">{v.agentCode}</div></div>
    ) },
    { key: "customer", header: "Customer Name", render: (v) => <span className="text-sm font-semibold">{v.customerName}</span> },
    { key: "mobile", header: "Mobile No", render: (v) => <span className="text-xs">{v.customerPhone}</span> },
    { key: "address", header: "Address", render: (v) => <span className="line-clamp-1 max-w-[260px] text-xs">{v.address}, {v.city}</span> },
    { key: "gst", header: "GST Number", render: (v) => <span className="font-mono text-xs">{v.gstNumber || "—"}</span> },
    { key: "actions", header: "", render: (v) => (
      <div className="flex justify-end gap-1">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewing(v)}><Eye className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(v)}><Pencil className="h-4 w-4" /></Button>
        <ConfirmButton trigger={<Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
          onConfirm={() => { remove(v.id); toast.success("Visit removed"); }} />
      </div>
    ), className: "text-right" },
  ];

  return (
    <PageShell
      title="Agent Visited Customer Details"
      subtitle="Track every B2B agent visit"
      actions={<Button onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Log Visit</Button>}
    >
      <DataTable rows={data} columns={cols} pageSize={10}
        searchKeys={["agentName", "agentCode", "customerName", "companyName", "city", "customerPhone", "gstNumber"]}
        onExport={() => { exportCsv("arreniux-agent-visits.csv", data); toast.success("Exported"); }} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Visit" : "Log Agent Visit"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <F label="Agent">
              <Select value={f.agentId} onValueChange={(v) => {
                const a = agents.find((x) => x.id === v);
                setF({ ...f, agentId: v, agentName: a?.name ?? "", agentCode: a?.code ?? "" });
              }}>
                <SelectTrigger><SelectValue placeholder="Select agent" /></SelectTrigger>
                <SelectContent>{agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} • {a.code}</SelectItem>)}</SelectContent>
              </Select>
            </F>
            <F label="Visit Date"><Input type="date" value={f.visitDate} onChange={(e) => setF({ ...f, visitDate: e.target.value })} /></F>
            <F label="Customer Name"><Input value={f.customerName} onChange={(e) => setF({ ...f, customerName: e.target.value })} /></F>
            <F label="Mobile No"><Input value={f.customerPhone} onChange={(e) => setF({ ...f, customerPhone: e.target.value })} /></F>
            <F label="Customer Email"><Input type="email" value={f.customerEmail} onChange={(e) => setF({ ...f, customerEmail: e.target.value })} /></F>
            <F label="Company Name"><Input value={f.companyName} onChange={(e) => setF({ ...f, companyName: e.target.value })} /></F>
            <F label="City"><Input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></F>
            <F label="GST Number"><Input value={f.gstNumber} onChange={(e) => setF({ ...f, gstNumber: e.target.value })} placeholder="27AABCU9603R1ZM" /></F>
            <F label="Next Follow-up"><Input type="date" value={f.nextFollowUp} onChange={(e) => setF({ ...f, nextFollowUp: e.target.value })} /></F>
            <F label="Outcome">
              <Select value={f.outcome} onValueChange={(v) => setF({ ...f, outcome: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{OUTCOMES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </F>
            <div className="md:col-span-2"><F label="Address"><Textarea rows={2} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></F></div>
            <div className="md:col-span-2"><F label="Requirement"><Input value={f.requirement} onChange={(e) => setF({ ...f, requirement: e.target.value })} placeholder="e.g., 500 corporate polo t-shirts" /></F></div>
            <div className="md:col-span-2"><F label="Notes"><Textarea rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></F></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!f.agentId || !f.customerName) { toast.error("Agent and customer name required"); return; }
              if (editing) { update(editing.id, f); toast.success("Visit updated"); }
              else { add({ ...f, createdAt: new Date().toISOString() } as any); toast.success("Visit logged"); }
              setOpen(false);
            }}>{editing ? "Save" : "Log Visit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Visit Details</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-2 text-sm">
              <RowV k="Agent" v={`${viewing.agentName} (${viewing.agentCode})`} />
              <RowV k="Customer" v={viewing.customerName} />
              <RowV k="Mobile" v={viewing.customerPhone} />
              <RowV k="Email" v={viewing.customerEmail} />
              <RowV k="Company" v={viewing.companyName} />
              <RowV k="Address" v={`${viewing.address}, ${viewing.city}`} />
              <RowV k="GST Number" v={viewing.gstNumber || "—"} />
              <RowV k="Visit Date" v={viewing.visitDate} />
              <RowV k="Follow-up" v={viewing.nextFollowUp} />
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Outcome</span><StatusBadge value={viewing.outcome} /></div>
              <div className="rounded-lg bg-secondary/40 p-3 text-xs"><b>Requirement:</b> {viewing.requirement}</div>
              <div className="rounded-lg bg-secondary/40 p-3 text-xs"><b>Notes:</b> {viewing.notes}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
function RowV({ k, v }: { k: string; v: string }) {
  return <div className="flex items-start justify-between gap-3"><span className="text-muted-foreground">{k}</span><span className="text-right font-medium">{v}</span></div>;
}
