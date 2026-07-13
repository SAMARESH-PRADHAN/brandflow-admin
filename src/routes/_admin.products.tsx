import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { PageShell } from "@/components/admin/page-shell";
import { SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { products, categories, inr } from "@/lib/demo-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/products")({
  head: () => ({
    meta: [
      { title: "Products — ARRHENIUX ERP" },
      { name: "description", content: "Manage the ARRHENIUX catalog: categories, subcategories, bulk, B2B, sample, and new collection." },
    ],
  }),
  component: ProductsPage,
});

const tabs = [
  { value: "all", label: "All Products", count: products.length },
  { value: "categories", label: "Categories", count: products.filter((p) => p.visibility.inCategories).length },
  { value: "bulk", label: "Bulk", count: products.filter((p) => p.visibility.inBulk).length },
  { value: "b2b", label: "B2B Shop", count: products.filter((p) => p.visibility.inB2B).length },
  { value: "newcol", label: "New Collection", count: products.filter((p) => p.visibility.inNewCollection).length },
  { value: "arrheniux", label: "ARRHENIUX", count: products.filter((p) => p.visibility.inArrheniux).length },
  { value: "kits", label: "Corporate Kits", count: products.filter((p) => p.visibility.inCorporateKits).length },
  { value: "catlist", label: "Category List", count: categories.length },
];

function ProductsPage() {
  return (
    <PageShell
      title="Product Management"
      subtitle="Every SKU, its visibility, and its performance in one place"
      tabs={tabs}
      defaultTab="all"
    >
      {(tab, q) => tab === "catlist" ? <CategoryTable q={q} /> : <ProductTable tab={tab} q={q} />}
    </PageShell>
  );
}

function ProductTable({ tab, q }: { tab: string; q: string }) {
  const rows = useMemo(() => {
    return products.filter((p) => {
      if (tab === "categories" && !p.visibility.inCategories) return false;
      if (tab === "bulk" && !p.visibility.inBulk) return false;
      if (tab === "b2b" && !p.visibility.inB2B) return false;
      if (tab === "newcol" && !p.visibility.inNewCollection) return false;
      if (tab === "arrheniux" && !p.visibility.inArrheniux) return false;
      if (tab === "kits" && !p.visibility.inCorporateKits) return false;
      if (q && !p.name.toLowerCase().includes(q.toLowerCase()) && !p.code.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [tab, q]);

  return (
    <SectionCard title={`${rows.length} products`} subtitle="Toggle where each SKU appears — no duplication needed">
      <div className="overflow-x-auto scroll-thin">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"><Checkbox /></TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0, 24).map((p) => (
              <TableRow key={p.id} className="group">
                <TableCell><Checkbox /></TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-xl">{p.image}</div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{p.name}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{p.category} · {p.material} · {p.gsm} GSM</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{p.code}</TableCell>
                <TableCell><StatusBadge value={p.tier} /></TableCell>
                <TableCell className="text-right num font-semibold">{inr(p.price)}</TableCell>
                <TableCell className="text-right num">
                  <span className={p.stock < 40 ? "text-warning font-semibold" : ""}>{p.stock}</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {p.visibility.inCategories && <VisChip>Cat</VisChip>}
                    {p.visibility.inBulk && <VisChip tone="chart-2">Bulk</VisChip>}
                    {p.visibility.inB2B && <VisChip tone="chart-5">B2B</VisChip>}
                    {p.visibility.inNewCollection && <VisChip tone="info">New</VisChip>}
                    {p.visibility.inArrheniux && <VisChip tone="warning">ARX</VisChip>}
                    {p.visibility.inCorporateKits && <VisChip tone="success">Kits</VisChip>}
                  </div>
                </TableCell>
                <TableCell>
                  <Switch defaultChecked={p.active} onCheckedChange={(v) => toast.success(`${p.name} ${v ? "activated" : "deactivated"}`)} />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button size="icon" variant="ghost" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination total={rows.length} />
    </SectionCard>
  );
}

function CategoryTable({ q }: { q: string }) {
  const rows = categories.filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <SectionCard title="Categories" subtitle="Top-level taxonomy for your catalog">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rows.map((c) => (
          <div key={c.id} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-3xl">{c.image}</div>
              <Button size="icon" variant="ghost" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
            </div>
            <div className="mt-3">
              <div className="text-base font-bold">{c.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{c.products} products · slug /{c.slug}</div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <StatusBadge value="Approved" />
              <Switch defaultChecked />
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function VisChip({ children, tone = "primary" }: { children: React.ReactNode; tone?: string }) {
  const map: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    "chart-2": "bg-chart-2/10 text-chart-2",
    "chart-5": "bg-chart-5/10 text-chart-5",
    info: "bg-info/10 text-info",
    warning: "bg-warning/15 text-warning",
    success: "bg-success/10 text-success",
  };
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${map[tone]}`}>{children}</span>
  );
}

function Pagination({ total }: { total: number }) {
  return (
    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
      <div>Showing 1 – {Math.min(24, total)} of {total}</div>
      <div className="flex gap-1">
        <Button variant="outline" size="sm">Prev</Button>
        <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
        <Button variant="outline" size="sm">2</Button>
        <Button variant="outline" size="sm">3</Button>
        <Button variant="outline" size="sm">Next</Button>
      </div>
    </div>
  );
}
