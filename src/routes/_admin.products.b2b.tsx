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
import { useCollection, inrFull, type B2BProduct } from "@/lib/store";
import { ImageUploader } from "@/components/admin/image-uploader";
import { ProductViewDialog } from "@/components/admin/product-view-dialog";
import { toast } from "sonner";

const SUBS = ["Hospitality", "Corporate", "Healthcare", "Education", "Retail"];

function B2BPage() {
  const { data, add, update, remove } = useCollection<B2BProduct>("b2bProducts");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<B2BProduct | null>(null);
  const [viewing, setViewing] = useState<B2BProduct | null>(null);
  const [f, setF] = useState<any>({});

  const openNew = () => { setEditing(null); setF({ code: "", name: "", subCategory: SUBS[0], material: "100% Cotton", description: "", samplePrice: 299, originalPrice: 1499, status: "Active", image: "", images: [] }); setOpen(true); };
  const openEdit = (p: B2BProduct) => { setEditing(p); setF({ ...p, images: p.images ?? (p.image ? [p.image] : []) }); setOpen(true); };

  const cols: Column<B2BProduct>[] = [
    { key: "code", header: "Code", render: (p) => <span className="font-mono text-xs">{p.code}</span>, sortable: true, getValue: (p) => p.code },
    { key: "name", header: "Product Name", render: (p) => (
      <div className="flex items-center gap-3">
        {(p.images?.[0] || p.image) && <img src={p.images?.[0] || p.image} alt={p.name} className="h-10 w-10 rounded-lg border border-border object-cover" />}
        <span className="text-sm font-semibold">{p.name}</span>
      </div>
    ), sortable: true, getValue: (p) => p.name },
    { key: "sub", header: "B2B Sub Category", render: (p) => <span className="text-sm">{p.subCategory}</span> },
    { key: "material", header: "Material", render: (p) => <span className="text-xs text-muted-foreground">{p.material}</span> },
    { key: "sample", header: "Sample", render: (p) => <span className="num text-sm">{inrFull(p.samplePrice)}</span>, className: "text-right" },
    { key: "price", header: "Original", render: (p) => <span className="num text-sm font-semibold">{inrFull(p.originalPrice)}</span>, className: "text-right" },
    { key: "status", header: "Status", render: (p) => <StatusBadge value={p.status} /> },
    { key: "actions", header: "", render: (p) => (
      <div className="flex justify-end gap-1">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewing(p)}><Eye className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
        <ConfirmButton
          trigger={<Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
          onConfirm={() => { remove(p.id); toast.success("Deleted"); }}
        />
      </div>
    ), className: "text-right" },
  ];

  return (
    <PageShell
      title="B2B Shop Products" subtitle="Bulk & B2B catalog management"
      actions={<Button onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Add B2B Product</Button>}
    >
      <DataTable rows={data} columns={cols} searchKeys={["code", "name", "subCategory", "material"]}
        onExport={() => { exportCsv("arreniux-b2b.csv", data); toast.success("Exported"); }} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit B2B Product" : "Add B2B Product"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <F label="Code"><Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></F>
            <F label="Name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></F>
            <F label="Sub Category">
              <Select value={f.subCategory} onValueChange={(v) => setF({ ...f, subCategory: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SUBS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </F>
            <F label="Material"><Input value={f.material} onChange={(e) => setF({ ...f, material: e.target.value })} /></F>
            <F label="Sample Price"><Input type="number" value={f.samplePrice} onChange={(e) => setF({ ...f, samplePrice: +e.target.value })} /></F>
            <F label="Original Price"><Input type="number" value={f.originalPrice} onChange={(e) => setF({ ...f, originalPrice: +e.target.value })} /></F>
            <F label="Status">
              <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
              </Select>
            </F>
          </div>
          <F label="Product Images (up to 6)">
            <ImageUploader images={f.images ?? []} max={4} onChange={(imgs) => setF({ ...f, images: imgs, image: imgs[0] ?? "" })} />
          </F>
          <F label="Description"><Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></F>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (editing) { update(editing.id, f); toast.success("Updated"); }
              else { add({ ...f, createdAt: new Date().toISOString().slice(0, 10) } as any); toast.success("Added"); }
              setOpen(false);
            }}>{editing ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProductViewDialog product={viewing as any} onClose={() => setViewing(null)} />
    </PageShell>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}

export default B2BPage;
