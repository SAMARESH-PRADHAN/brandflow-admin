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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCollection, inrFull, type NewCollectionProduct } from "@/lib/store";
import { ImageUploader } from "@/components/admin/image-uploader";
import { BulletListInput } from "@/components/admin/bullet-list-input";
import { ProductViewDialog } from "@/components/admin/product-view-dialog";
import { toast } from "sonner";

function NewColl() {
  const { data, add, update, remove } = useCollection<NewCollectionProduct>("newCollection");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NewCollectionProduct | null>(null);
  const [viewing, setViewing] = useState<NewCollectionProduct | null>(null);
  const [f, setF] = useState<any>({});

  const empty = () => ({ code: "", name: "", material: "100% Cotton", description: "", overview: "", specifications: [] as string[], designGuidelines: [] as string[], washCare: [] as string[], samplePrice: 499, originalPrice: 2499, status: "Active", image: "", images: [] as string[] });
  const openNew = () => { setEditing(null); setF(empty()); setOpen(true); };
  const openEdit = (p: NewCollectionProduct) => {
    setEditing(p);
    setF({ ...empty(), ...p, images: p.images ?? (p.image ? [p.image] : []) });
    setOpen(true);
  };

  const cols: Column<NewCollectionProduct>[] = [
    { key: "code", header: "Code", render: (p) => <span className="font-mono text-xs">{p.code}</span> },
    { key: "name", header: "Name", render: (p) => (
      <div className="flex items-center gap-3">
        {(p.images?.[0] || p.image) && (
          <img src={p.images?.[0] || p.image} alt={p.name} className="h-10 w-10 rounded-lg border border-border object-cover" />
        )}
        <span className="text-sm font-semibold">{p.name}</span>
      </div>
    ), sortable: true, getValue: (p) => p.name },
    { key: "material", header: "Material", render: (p) => <span className="text-sm">{p.material}</span> },
    { key: "sample", header: "Sample", render: (p) => <span className="num text-sm">{inrFull(p.samplePrice)}</span>, className: "text-right" },
    { key: "price", header: "Original", render: (p) => <span className="num text-sm font-semibold">{inrFull(p.originalPrice)}</span>, className: "text-right" },
    { key: "status", header: "Status", render: (p) => <StatusBadge value={p.status} /> },
    { key: "actions", header: "", render: (p) => (
      <div className="flex justify-end gap-1">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewing(p)}><Eye className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
        <ConfirmButton trigger={<Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
          onConfirm={() => { remove(p.id); toast.success("Deleted"); }} />
      </div>
    ), className: "text-right" },
  ];

  return (
    <PageShell title="New Collection" subtitle="Seasonal drops & fresh launches"
      actions={<Button onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Add Item</Button>}>
      <DataTable rows={data} columns={cols} searchKeys={["code", "name", "material"]}
        onExport={() => { exportCsv("arreniux-new-collection.csv", data); toast.success("Exported"); }} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} New Collection Item</DialogTitle></DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <F label="Code"><Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></F>
            <F label="Name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></F>
            <F label="Material"><Input value={f.material} onChange={(e) => setF({ ...f, material: e.target.value })} /></F>
            <F label="Status">
              <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
              </Select>
            </F>
            <F label="Sample Price"><Input type="number" value={f.samplePrice} onChange={(e) => setF({ ...f, samplePrice: +e.target.value })} /></F>
            <F label="Original Price"><Input type="number" value={f.originalPrice} onChange={(e) => setF({ ...f, originalPrice: +e.target.value })} /></F>
          </div>
          <F label="Product Images (up to 6)">
            <ImageUploader images={f.images ?? []} onChange={(imgs) => setF({ ...f, images: imgs, image: imgs[0] ?? "" })} />
          </F>
          <F label="Product Overview"><Textarea rows={2} value={f.overview} onChange={(e) => setF({ ...f, overview: e.target.value })} placeholder="Short marketing summary" /></F>
          <F label="Description"><Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></F>

          <Tabs defaultValue="spec" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="spec">Product Specification</TabsTrigger>
              <TabsTrigger value="guide">Design Guidelines</TabsTrigger>
              <TabsTrigger value="wash">Wash Care Instructions</TabsTrigger>
            </TabsList>
            <TabsContent value="spec" className="mt-3">
              <BulletListInput items={f.specifications ?? []} onChange={(v) => setF({ ...f, specifications: v })} placeholder="e.g., 220 GSM heavyweight fleece" />
            </TabsContent>
            <TabsContent value="guide" className="mt-3">
              <BulletListInput items={f.designGuidelines ?? []} onChange={(v) => setF({ ...f, designGuidelines: v })} placeholder="e.g., Embroidery on left chest only" />
            </TabsContent>
            <TabsContent value="wash" className="mt-3">
              <BulletListInput items={f.washCare ?? []} onChange={(v) => setF({ ...f, washCare: v })} placeholder="e.g., Machine wash cold, do not bleach" />
            </TabsContent>
          </Tabs>

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

export default NewColl;
