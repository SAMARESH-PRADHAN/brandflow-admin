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
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCollection, inrFull, type Product } from "@/lib/store";
import { ImageUploader } from "@/components/admin/image-uploader";
import { toast } from "sonner";


const CATEGORIES = ["Corporate Shirts", "Polo T-Shirts", "Formal Trousers", "Blazers", "Hoodies", "Caps", "Aprons", "Bags"];
const SUBCATS = ["Oxford", "Slim Fit", "Pique", "Dry-Fit", "Bomber", "Pullover", "Classic", "Executive"];
const COLORS_ALL = [
  { name: "Black", hex: "#111" }, { name: "White", hex: "#f8f8f8" }, { name: "Blue", hex: "#2563eb" },
  { name: "Red", hex: "#dc2626" }, { name: "Green", hex: "#16a34a" }, { name: "Yellow", hex: "#facc15" },
  { name: "Orange", hex: "#f97316" }, { name: "Grey", hex: "#6b7280" }, { name: "Pink", hex: "#ec4899" },
  { name: "Navy", hex: "#1e3a8a" },
];

function ProductsPage() {
  const { data, add, update, remove } = useCollection<Product>("products");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setOpen(true); };

  const cols: Column<Product>[] = [
    { key: "code", header: "Code", render: (p) => <span className="font-mono text-xs">{p.code}</span>, sortable: true, getValue: (p) => p.code },
    { key: "name", header: "Product", render: (p) => (
      <div>
        <div className="text-sm font-semibold">{p.name}</div>
        <div className="text-[11px] text-muted-foreground">{p.subCategory} • {p.material}</div>
      </div>
    ), sortable: true, getValue: (p) => p.name },
    { key: "category", header: "Category", render: (p) => <span className="text-sm">{p.category}</span> },
    { key: "type", header: "Type", render: (p) => <StatusBadge value={p.type} /> },
    { key: "colors", header: "Colors", render: (p) => (
      <div className="flex -space-x-1">
        {p.colors.slice(0, 6).map((c) => (
          <span key={c.name} title={`${c.name} • Cat:${c.showInCategory?"Y":"N"} Bulk:${c.showInBulk?"Y":"N"}`}
            className="h-5 w-5 rounded-full border-2 border-card" style={{ background: c.hex }} />
        ))}
      </div>
    )},
    { key: "price", header: "Price", render: (p) => <span className="num text-sm font-semibold">{inrFull(p.originalPrice)}</span>, sortable: true, getValue: (p) => p.originalPrice, className: "text-right" },
    { key: "stock", header: "Stock", render: (p) => <span className="num text-sm">{p.stock}</span>, sortable: true, getValue: (p) => p.stock, className: "text-right" },
    { key: "status", header: "Status", render: (p) => <StatusBadge value={p.status} /> },
    { key: "actions", header: "", render: (p) => (
      <div className="flex justify-end gap-1">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toast(`${p.name}`, { description: p.description })}><Eye className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
        <ConfirmButton
          trigger={<Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
          title="Delete product?" description={`This will permanently delete ${p.name}.`}
          onConfirm={() => { remove(p.id); toast.success("Product deleted"); }}
        />
      </div>
    ), className: "text-right" },
  ];

  return (
    <PageShell
      title="Products" subtitle="Manage main catalog with color visibility"
      actions={<Button onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Add Product</Button>}
    >
      <DataTable
        rows={data} columns={cols} pageSize={10}
        searchKeys={["code", "name", "category", "subCategory", "material"]}
        onExport={() => { exportCsv("arreniux-products.csv", data.map(({ colors, ...rest }) => ({ ...rest, colors: colors.map(c => c.name).join("|") }))); toast.success("Exported to CSV"); }}
      />

      <ProductDialog
        open={open} onOpenChange={setOpen} editing={editing}
        onSubmit={(v) => {
          if (editing) { update(editing.id, v); toast.success("Product updated"); }
          else { add({ ...v, stock: 100, orders: 0, rating: 4.5, createdAt: new Date().toISOString().slice(0, 10) } as any); toast.success("Product added"); }
          setOpen(false);
        }}
      />
    </PageShell>
  );
}

function ProductDialog({
  open, onOpenChange, editing, onSubmit,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; editing: Product | null;
  onSubmit: (v: Partial<Product>) => void;
}) {
  const empty = {
    code: "", name: "", category: CATEGORIES[0]!, type: "Regular" as const,
    subCategory: SUBCATS[0]!, material: "100% Cotton", description: "",
    samplePrice: 499, originalPrice: 1999, status: "Active" as const, image: "",
    colors: COLORS_ALL.slice(0, 4).map(c => ({ ...c, showInCategory: true, showInBulk: true })),
  };
  const [f, setF] = useState<any>(editing ?? empty);
  // re-init on open
  useState(() => f);
  const set = (k: string, v: any) => setF((s: any) => ({ ...s, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (v) setF(editing ?? empty); }}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Product Code"><Input value={f.code} onChange={(e) => set("code", e.target.value)} placeholder="ARX-0001" /></Field>
          <Field label="Product Name"><Input value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Category">
            <Select value={f.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Product Type">
            <Select value={f.type} onValueChange={(v) => set("type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Regular">Regular</SelectItem>
                <SelectItem value="Premium">Premium</SelectItem>
                <SelectItem value="Others">Others</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Sub Category">
            <Select value={f.subCategory} onValueChange={(v) => set("subCategory", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SUBCATS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Material"><Input value={f.material} onChange={(e) => set("material", e.target.value)} /></Field>
          <Field label="Sample Price"><Input type="number" value={f.samplePrice} onChange={(e) => set("samplePrice", Number(e.target.value))} /></Field>
          <Field label="Original Price"><Input type="number" value={f.originalPrice} onChange={(e) => set("originalPrice", Number(e.target.value))} /></Field>
          <Field label="Status">
            <Select value={f.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
            </Select>
          </Field>
          <Field label="Product Image (demo)">
            <Input type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0]; if (!file) return;
              const reader = new FileReader();
              reader.onload = () => set("image", reader.result as string);
              reader.readAsDataURL(file);
            }} />
          </Field>
        </div>

        <Field label="Description"><Textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>

        <div>
          <Label className="mb-2 block">Color Variants — visibility toggles</Label>
          <div className="rounded-lg border border-border">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 border-b border-border bg-secondary/50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Color</span><span>In Category</span><span>In Bulk</span><span>Remove</span>
            </div>
            {f.colors.map((c: any, i: number) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 border-b border-border px-3 py-2 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full border" style={{ background: c.hex }} />
                  <span className="text-sm">{c.name}</span>
                </div>
                <Switch checked={c.showInCategory} onCheckedChange={(v) => {
                  const cs = [...f.colors]; cs[i] = { ...cs[i], showInCategory: v }; set("colors", cs);
                }} />
                <Switch checked={c.showInBulk} onCheckedChange={(v) => {
                  const cs = [...f.colors]; cs[i] = { ...cs[i], showInBulk: v }; set("colors", cs);
                }} />
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => set("colors", f.colors.filter((_: any, j: number) => j !== i))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {COLORS_ALL.filter((c) => !f.colors.find((x: any) => x.name === c.name)).map((c) => (
              <Button key={c.name} size="sm" variant="outline" onClick={() => set("colors", [...f.colors, { ...c, showInCategory: true, showInBulk: true }])}>
                <span className="mr-1 h-3 w-3 rounded-full" style={{ background: c.hex }} /> {c.name}
              </Button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSubmit(f)}>{editing ? "Save changes" : "Add product"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}

export default ProductsPage;
