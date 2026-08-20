import { useMemo, useState ,useEffect } from "react";
import { Plus, Pencil, Trash2, Eye, Filter, Loader2, Copy } from "lucide-react";
import { PageShell } from "@/components/admin/page-shell";
import { DataTable, exportCsv, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCollection, inrFull, type Product, type ProductVisibility } from "@/lib/store";
import { ImageUploader } from "@/components/admin/image-uploader";
import { BulletListInput } from "@/components/admin/bullet-list-input";
import { ProductViewDialog } from "@/components/admin/product-view-dialog";
import { mutationError } from "@/lib/mutation-error";
import { toast } from "sonner";
import { CATEGORY_NAMES, findTaxCategory, getSubOptions, type Tier } from "@/lib/catalog-taxonomy";
import { KitItemsInput } from "@/components/admin/kit-items-input";

const TYPES = ["Regular", "Premium"] as const;
const VISIBILITIES: ProductVisibility[] = ["Category", "Bulk", "Both"];

function ProductsPage() {
  const [page, setPage] = useState(1);
  const [fCat, setFCat] = useState("All");
  const [fType, setFType] = useState("All");
  const [fSub, setFSub] = useState("All");
  const [fVis, setFVis] = useState("All");

  const { data, pagination, add, update, remove, loading } = useCollection<Product>("products", {
    page,
    limit: 10,
    category: fCat === "All" ? undefined : fCat,
    type: fType === "All" ? undefined : fType,
    subCategory: fSub === "All" ? undefined : fSub,
    visibility: fVis === "All" ? undefined : fVis,
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [viewing, setViewing] = useState<Product | null>(null);
  const [copySource, setCopySource] = useState<Product | null>(null);

  // Sub-category filter options depend on the selected category filter.
  const filterSubOptions = useMemo(() => {
    if (fCat === "All") {
      // union of every sub-category across all categories
      const all = new Set<string>();
      CATEGORY_NAMES.forEach((name) => {
        const cat = findTaxCategory(name);
        if (!cat) return;
        if (cat.hasTiers) {
          (cat.regular ?? []).forEach((s) => all.add(s));
          (cat.premium ?? []).forEach((s) => all.add(s));
        } else {
          (cat.items ?? []).forEach((s) => all.add(s));
        }
      });
      return Array.from(all);
    }
    const cat = findTaxCategory(fCat);
    if (!cat) return [];
    if (!cat.hasTiers) return cat.items ?? [];
    return [...new Set([...(cat.regular ?? []), ...(cat.premium ?? [])])];
  }, [fCat]);

  const filtered = useMemo(() => {
    if (pagination) return data;
    return data.filter((p) =>
      (fCat === "All" || p.category === fCat) &&
      (fType === "All" || p.type === fType) &&
      (fSub === "All" || p.subCategory === fSub) &&
      (fVis === "All" || (p.visibility ?? "Both") === fVis)
    );
  }, [data, fCat, fType, fSub, fVis, pagination]);

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setOpen(true); };
  const openCopy = (p: Product) => {
  setEditing(null);        // we're creating a NEW product
  setCopySource(p);        // but pre-fill from this one
  setOpen(true);
};

  const cols: Column<Product>[] = [
    { key: "code", header: "Code", render: (p) => <span className="font-mono text-xs">{p.code}</span>, sortable: true, getValue: (p) => p.code },
    { key: "name", header: "Product", render: (p) => (
      <div className="flex items-center gap-3">
        {(p.images?.[0] || p.image) && (
          <img loading="lazy" src={p.images?.[0] || p.image} alt={p.name} className="h-10 w-10 rounded-lg border border-border object-cover" />
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
 <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openCopy(p)} title="Copy to new product">
      <Copy className="h-4 w-4" />
    </Button>
            <ConfirmButton
          trigger={<Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>}
          title="Delete product?" description={`This will permanently delete ${p.name}.`}
          onConfirm={async () => {
            try {
              await remove(p.id);
              toast.success("Product deleted");
            } catch (err) {
              mutationError(err, "Failed to delete product");
            }
          }}
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
        <FilterSelect
          label="Category"
          value={fCat}
          onChange={(v) => { setFCat(v); setFSub("All"); }}
          options={["All", ...CATEGORY_NAMES]}
        />
        <FilterSelect label="Type" value={fType} onChange={setFType} options={["All", ...TYPES]} />
        <FilterSelect label="Sub Category" value={fSub} onChange={setFSub} options={["All", ...filterSubOptions]} />
        <FilterSelect label="Available In" value={fVis} onChange={setFVis} options={["All", ...VISIBILITIES]} />
        {(fCat !== "All" || fType !== "All" || fSub !== "All" || fVis !== "All") && (
          <Button size="sm" variant="ghost" onClick={() => { setFCat("All"); setFType("All"); setFSub("All"); setFVis("All"); }}>Clear</Button>
        )}
      </div>

      <DataTable
        rows={filtered} columns={cols} pageSize={10} loading={loading}
        searchKeys={["code", "name", "category", "subCategory", "material"]}
        serverSide={!!pagination}
        serverTotalPages={pagination ? Math.ceil(pagination.total / pagination.limit) : 1}
        currentPage={page}
        onPageChange={setPage}
        onExport={() => {
          exportCsv("arreniux-products.csv", filtered.map(({ colors, images, ...rest }) => ({
            ...rest, visibility: rest.visibility ?? "Both",
          })));
          toast.success("Exported filtered rows");
        }}
      />

      <ProductDialog
        open={open}
  onOpenChange={(v) => { setOpen(v); if (!v) setCopySource(null); }}
  editing={editing}
  copySource={copySource}
        existingProducts={data}   // ← add
        onSubmit={async (v) => {
          if (!v.code?.trim() || !v.name?.trim() || v.samplePrice == null || v.originalPrice == null) {
    toast.error("Code, Name, Sample Price and Original Price are required");
    return;
   const dup = data.some(
    (p) => p.code.trim().toLowerCase() === v.code!.trim().toLowerCase() && p.id !== editing?.id
  );
  if (dup) {
    toast.error("Product code already exists");
    return;
  } 
  }
          try {
            if (editing) {
              await update(editing.id, v);
              toast.success("Product updated");
            } else {
              await add({ ...v, stock: 100, orders: 0, rating: 4.5, colors: [], createdAt: new Date().toISOString().slice(0, 10) } as any);
              toast.success("Product added");
            }
            setOpen(false);
          } catch (err) {
            mutationError(err, editing ? "Failed to update product" : "Failed to add product");
          }
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

function normalizeProduct(p: Product) {
  return {
    ...p,
    images: p.images ?? (p.image ? [p.image] : []),
    overview: p.overview ?? "",
    specifications: p.specifications ?? [],
    designGuidelines: p.designGuidelines ?? [],
    washCare: p.washCare ?? [],
      kitItems: p.kitItems ?? [], 
    visibility: (p.visibility ?? "Both") as ProductVisibility,
  };
}

function ProductDialog({
  open, onOpenChange, editing, onSubmit, existingProducts, copySource,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; editing: Product | null;
  onSubmit: (v: Partial<Product>) => void | Promise<void>;
  existingProducts: Product[];
  copySource?: Product | null;
}) { 
  const firstCategory = CATEGORY_NAMES[0]!;
  const empty = {
  code: "", name: "", category: firstCategory, type: "Regular" as const,
  subCategory: getSubOptions(firstCategory, "Regular")[0] ?? "",
  material: "", description: "",
  overview: "", specifications: [] as string[], designGuidelines: [] as string[], washCare: [] as string[],
  samplePrice: 0, originalPrice: 0, status: "Active" as const, image: "", images: [] as string[],
  visibility: "Both" as ProductVisibility,
  kitItems:
    firstCategory === "Corporate Welcome Kit"
      ? [{ name: "T-Shirt", price: 0 }]
      : ([] as { name: string; price: number }[]),
};

  const [f, setF] = useState<any>(editing ? normalizeProduct(editing) : empty);
  const [imagesUploading, setImagesUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [codeDuplicate, setCodeDuplicate] = useState(false); // ← add

  // Re-sync the form whenever the dialog opens or the target product changes.
  // (useState's initializer only runs once, so without this effect the form
  // would keep showing stale data after the first open.)
  useEffect(() => {
    if (open) {
      if (editing) {
        setF(normalizeProduct(editing));
      } else if (copySource) {
        // Copy everything except id/code/images
        const { id, code, images, image, createdAt, ...rest } = normalizeProduct(copySource);
        setF({
          ...empty,
          ...rest,
          code: "",     // must be unique — admin fills a new code
          images: [],
          image: "",
        });
      } else {
        setF(empty);
      }
      setImagesUploading(false);
      setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, copySource]);

  const set = (k: string, v: any) => setF((s: any) => ({ ...s, [k]: v }));
const checkCodeDuplicate = () => {
  const code = (f.code ?? "").trim().toLowerCase();
  if (!code) { setCodeDuplicate(false); return; }
  const dup = existingProducts.some(
    (p) => p.code.trim().toLowerCase() === code && p.id !== editing?.id
  );
  setCodeDuplicate(dup);
};
  const activeCat = findTaxCategory(f.category);
  const catHasTiers = activeCat?.hasTiers ?? false;
  const subOptions = getSubOptions(f.category, f.type as Tier);

  // const onCategoryChange = (name: string) => {
  //   const cat = findTaxCategory(name);
  //   const nextSub = cat?.hasTiers
  //     ? (cat.regular?.[0] ?? "")
  //     : (cat?.items?.[0] ?? "");
  //   setF((s: any) => ({ ...s, category: name, type: "Regular", subCategory: nextSub }));
  // };
  const onCategoryChange = (name: string) => {
  const cat = findTaxCategory(name);
  const nextSub = cat?.hasTiers
    ? (cat.regular?.[0] ?? "")
    : (cat?.items?.[0] ?? "");
  setF((s: any) => ({
    ...s,
    category: name,
    type: "Regular",
    subCategory: nextSub,
    kitItems:
      name === "Corporate Welcome Kit" && (!s.kitItems || s.kitItems.length === 0)
        ? [{ name: "T-Shirt", price: 0 }]
        : s.kitItems,
    // ARRHENIUX products aren't offered as samples or via Bulk Order on the
    // storefront, so force visibility back to "Category" whenever the admin
    // switches into this category (mirrors the storefront's own gating).
    visibility: name === "ARRHENIUX T-Shirts" ? "Category" : s.visibility,
  }));
};
const isWelcomeKit = f.category === "Corporate Welcome Kit";
  // ARRHENIUX T-Shirts: no Sample Price field, no "Show in Bulk Order" toggle —
  // matches the storefront where ARRHENIUX products skip samples/bulk entirely.
  const isArrheniux = f.category === "ARRHENIUX T-Shirts";
  const onTypeChange = (type: "Regular" | "Premium") => {
    const nextSub = getSubOptions(f.category, type)[0] ?? "";
    setF((s: any) => ({ ...s, type, subCategory: nextSub }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
         <Field label="Product Code *">
  <Input
    value={f.code}
    onChange={(e) => { set("code", e.target.value); setCodeDuplicate(false); }}
    onBlur={checkCodeDuplicate}
    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); checkCodeDuplicate(); } }}
    placeholder="ARX-0001"
  />
  {codeDuplicate && (
    <p className="mt-1 text-xs" style={{ color: "red" }}>This product code already exists.</p>
  )}
</Field>
<Field label="Product Name *"><Input value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>

          <Field label="Category">
            <Select value={f.category} onValueChange={onCategoryChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORY_NAMES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>

          {catHasTiers && (
            <Field label="Tier (Regular / Premium)">
              <Select value={f.type} onValueChange={onTypeChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="Premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}

          <Field label="Sub Category">
            <Select value={f.subCategory} onValueChange={(v) => set("subCategory", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {subOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

         {!isWelcomeKit && (
  <>
    <Field label="Material"><Input value={f.material} onChange={(e) => set("material", e.target.value)} /></Field>
     {!isArrheniux && (
    <Field label="Sample Price *"><Input type="number" value={f.samplePrice} onChange={(e) => set("samplePrice", Number(e.target.value))} /></Field>
     )}
    <Field label="Original Price *"><Input type="number" value={f.originalPrice} onChange={(e) => set("originalPrice", Number(e.target.value))} /></Field>
  </>
)}
<Field label="Status">
            <Select value={f.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
            </Select>
          </Field>

          <div className="md:col-span-2 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label className="text-xs">Show in Category section</Label>
                <div className="text-[11px] text-muted-foreground">Visible in retail/category listing</div>
              </div>
              <Switch
                checked={f.visibility === "Category" || f.visibility === "Both"}
                onCheckedChange={(v) => {
                  const bulk = f.visibility === "Bulk" || f.visibility === "Both";
                  set("visibility", v ? (bulk ? "Both" : "Category") : (bulk ? "Bulk" : "Category"));
                }}
              />
            </div>
            {!isArrheniux && (
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label className="text-xs">Show in Bulk Order section</Label>
                  <div className="text-[11px] text-muted-foreground">Visible in bulk listing</div>
                </div>
                <Switch
                  checked={f.visibility === "Bulk" || f.visibility === "Both"}
                  onCheckedChange={(v) => {
                    const cat = f.visibility === "Category" || f.visibility === "Both";
                    set("visibility", v ? (cat ? "Both" : "Bulk") : (cat ? "Category" : "Bulk"));
                  }}
                />
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <Field label="Product Images (up to 4)">
              <ImageUploader
  images={f.images ?? []}
  max={isWelcomeKit ? 7 : 4}
  folder="products"
  onChange={(imgs) => setF((s: any) => ({ ...s, images: imgs, image: imgs[0] ?? "" }))}
  onUploadingChange={setImagesUploading}
/>
            </Field>
          </div>
        </div>

        <Field label="Product Overview"><Textarea rows={2} value={f.overview} onChange={(e) => set("overview", e.target.value)} placeholder="Short marketing overview shown on the product page" /></Field>
        <Field label="Description"><Textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>

        {isWelcomeKit ? (
  <>
    <Field label="Specifications">
      <BulletListInput items={f.specifications} onChange={(v) => set("specifications", v)} placeholder="e.g., 220 GSM heavyweight fleece" />
    </Field>
    <Field label="Kit Items (name + price)">
      <KitItemsInput items={f.kitItems ?? []} onChange={(v) => set("kitItems", v)} />
        {isWelcomeKit && (f.kitItems?.length ?? 0) < 3 && (
    <p className="mt-1 text-xs text-destructive">
      Add at least {3 - (f.kitItems?.length ?? 0)} more item(s) — minimum 3 required.
    </p>
  )}
    </Field>
  </>
) : (
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
)}

       <DialogFooter>
  <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
  <Button
    disabled={imagesUploading || submitting}
    onClick={async () => {
      if (isWelcomeKit && (f.kitItems?.length ?? 0) < 3) {
        toast.error("Please add at least 3 kit items for a Welcome Kit product");
        return;
      }
      setSubmitting(true);
      try {
        await onSubmit(f);
      } finally {
        setSubmitting(false);
      }
    }}
  >
    {submitting ? (
      <><Loader2 className="mr-1 h-4 w-4 animate-spin" />{editing ? "Saving..." : "Adding..."}</>
    ) : imagesUploading ? "Uploading image..." : editing ? "Save changes" : "Add product"}
  </Button>
</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const isRequired = label.endsWith("*");
  const clean = isRequired ? label.slice(0, -1).trim() : label;
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {clean}
        {isRequired && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );
}

export default ProductsPage;