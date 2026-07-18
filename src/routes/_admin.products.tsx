import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Eye, Filter } from "lucide-react";
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
import { useCollection, inrFull, type Product, type ProductVisibility } from "@/lib/store";
import { ImageUploader } from "@/components/admin/image-uploader";
import { BulletListInput } from "@/components/admin/bullet-list-input";
import { ProductViewDialog } from "@/components/admin/product-view-dialog";
import { toast } from "sonner";

const CATEGORIES = ["Corporate Shirts", "Polo T-Shirts", "Formal Trousers", "Blazers", "Hoodies", "Caps", "Aprons", "Bags"];
const SUBCATS = ["Oxford", "Slim Fit", "Pique", "Dry-Fit", "Bomber", "Pullover", "Classic", "Executive"];
const TYPES = ["Regular", "Premium", "Others"] as const;
const VISIBILITIES: ProductVisibility[] = ["Category", "Bulk", "Both"];

function ProductsPage() {
  const { data, add, update, remove } = useCollection<Product>("products");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [viewing, setViewing] = useState<Product | null>(null);

  const [fCat, setFCat] = useState("All");
  const [fType, setFType] = useState("All");
  const [fSub, setFSub] = useState("All");
  const [fVis, setFVis] = useState("All");

  const filtered = useMemo(() => data.filter((p) =>
    (fCat === "All" || p.category === fCat) &&
    (fType === "All" || p.type === fType) &&
    (fSub === "All" || p.subCategory === fSub) &&
    (fVis === "All" || (p.visibility ?? "Both") === fVis)
  ), [data, fCat, fType, fSub, fVis]);

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setOpen(true); };

  const cols: Column<Product>[] = [
    { key: "code", header: "Code", render: (p) => <span className="font-mono text-xs">{p.code}</span>, sortable: true, getValue: (p) => p.code },
    { key: "name", header: "Product", render: (p) => (
      <div className="flex items-center gap-3">
        {(p.images?.[0] || p.image) && (
          <img src={p.images?.[0] || p.image} alt={p.name} className="h-10 w-10 rounded-lg border border-border object-cover" />
        )}
        <div>
          <div className="text-sm font-semibold">{p.name}</div>
          <div className="text-[11px] text-muted-foreground">{p.subCategory} • {p.material}</div>
        </div>
      </div>
    ), sortable: true, getValue: (p) => p.name },
    { key: "category", header: "Category", render: (p) => <span className="text-sm">{p.category}</span> },
    { key: "type", header: "Type", render: (p) => <StatusBadge value={p.type} /> },
    { key: "visibility", header: "Available In", render: (p) => (
      <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
        {p.visibility ?? "Both"}
      </span>
    )},
    { key: "price", header: "Price", render: (p) => <span className="num text-sm font-semibold">{inrFull(p.originalPrice)}</span>, sortable: true, getValue: (p) => p.originalPrice, className: "text-right" },
    { key: "status", header: "Status", render: (p) => <StatusBadge value={p.status} /> },
    { key: "actions", header: "", render: (p) => (
      <div className="flex justify-end gap-1">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewing(p)}><Eye className="h-4 w-4" /></Button>
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
      title="Products" subtitle="Manage main catalog"
      actions={<Button onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Add Product</Button>}
    >
      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-secondary/30 p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Filter className="h-4 w-4" /> Filters</div>
        <FilterSelect label="Category" value={fCat} onChange={setFCat} options={["All", ...CATEGORIES]} />
        <FilterSelect label="Type" value={fType} onChange={setFType} options={["All", ...TYPES]} />
        <FilterSelect label="Sub Category" value={fSub} onChange={setFSub} options={["All", ...SUBCATS]} />
        <FilterSelect label="Available In" value={fVis} onChange={setFVis} options={["All", ...VISIBILITIES]} />
        {(fCat !== "All" || fType !== "All" || fSub !== "All" || fVis !== "All") && (
          <Button size="sm" variant="ghost" onClick={() => { setFCat("All"); setFType("All"); setFSub("All"); setFVis("All"); }}>Clear</Button>
        )}
      </div>

      <DataTable
        rows={filtered} columns={cols} pageSize={10}
        searchKeys={["code", "name", "category", "subCategory", "material"]}
        onExport={() => {
          exportCsv("arreniux-products.csv", filtered.map(({ colors, images, ...rest }) => ({
            ...rest, visibility: rest.visibility ?? "Both",
          })));
          toast.success("Exported filtered rows");
        }}
      />

      <ProductDialog
        open={open} onOpenChange={setOpen} editing={editing}
        onSubmit={(v) => {
          if (editing) { update(editing.id, v); toast.success("Product updated"); }
          else { add({ ...v, stock: 100, orders: 0, rating: 4.5, colors: [], createdAt: new Date().toISOString().slice(0, 10) } as any); toast.success("Product added"); }
          setOpen(false);
        }}
      />

      <ProductViewDialog product={viewing} onClose={() => setViewing(null)} />
    </PageShell>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: readonly string[] }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select>
    </div>
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
    overview: "", specifications: [] as string[], designGuidelines: [] as string[], washCare: [] as string[],
    samplePrice: 499, originalPrice: 1999, status: "Active" as const, image: "", images: [] as string[],
    visibility: "Both" as ProductVisibility,
  };
  const normalize = (p: Product) => ({
    ...p,
    images: p.images ?? (p.image ? [p.image] : []),
    overview: p.overview ?? "",
    specifications: p.specifications ?? [],
    designGuidelines: p.designGuidelines ?? [],
    washCare: p.washCare ?? [],
    visibility: (p.visibility ?? "Both") as ProductVisibility,
  });
  const [f, setF] = useState<any>(editing ? normalize(editing) : empty);
  const set = (k: string, v: any) => setF((s: any) => ({ ...s, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (v) setF(editing ? normalize(editing) : empty); }}>
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
          <Field label="Available In">
            <Select value={f.visibility} onValueChange={(v) => set("visibility", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Category">Only Category section</SelectItem>
                <SelectItem value="Bulk">Only Bulk Order section</SelectItem>
                <SelectItem value="Both">Both sections</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Product Images (up to 6)">
              <ImageUploader
                images={f.images ?? []}
                onChange={(imgs) => setF((s: any) => ({ ...s, images: imgs, image: imgs[0] ?? "" }))}
              />
            </Field>
          </div>
        </div>

        <Field label="Product Overview"><Textarea rows={2} value={f.overview} onChange={(e) => set("overview", e.target.value)} placeholder="Short marketing overview shown on the product page" /></Field>
        <Field label="Description"><Textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>

        <Tabs defaultValue="spec" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="spec">Specifications</TabsTrigger>
            <TabsTrigger value="guide">Design Guidelines</TabsTrigger>
            <TabsTrigger value="wash">Wash Care</TabsTrigger>
          </TabsList>
          <TabsContent value="spec" className="mt-3">
            <BulletListInput items={f.specifications} onChange={(v) => set("specifications", v)} placeholder="e.g., Fabric weight — 180 GSM" />
          </TabsContent>
          <TabsContent value="guide" className="mt-3">
            <BulletListInput items={f.designGuidelines} onChange={(v) => set("designGuidelines", v)} placeholder="e.g., Logo max 4in on left chest" />
          </TabsContent>
          <TabsContent value="wash" className="mt-3">
            <BulletListInput items={f.washCare} onChange={(v) => set("washCare", v)} placeholder="e.g., Machine wash cold, gentle cycle" />
          </TabsContent>
        </Tabs>

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
