import { createFileRoute } from "@tanstack/react-router";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { PageShell } from "@/components/admin/page-shell";
import { SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { customers, inr } from "@/lib/demo-data";

export const Route = createFileRoute("/_admin/customers")({
  head: () => ({
    meta: [
      { title: "Customers — ARRHENIUX ERP" },
      { name: "description", content: "Retail buyers and B2B agents — profiles, activity, and lifetime value." },
    ],
  }),
  component: CustomersPage,
});

const tabs = [
  { value: "all", label: "All", count: customers.length },
  { value: "Retail", label: "Retail Customers", count: customers.filter((c) => c.type === "Retail").length },
  { value: "B2B Agent", label: "B2B Agents", count: customers.filter((c) => c.type === "B2B Agent").length },
];

function CustomersPage() {
  return (
    <PageShell title="Customer Management" subtitle="Retail buyers, B2B agents, and everyone in between" tabs={tabs}>
      {(tab, q) => {
        const rows = customers.filter((c) => {
          if (tab !== "all" && c.type !== tab) return false;
          if (q && !c.name.toLowerCase().includes(q.toLowerCase()) && !c.email.toLowerCase().includes(q.toLowerCase())) return false;
          return true;
        });
        return (
          <SectionCard title={`${rows.length} customers`} subtitle="Sorted by most recent activity">
            <div className="overflow-x-auto scroll-thin">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Lifetime spend</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((c) => (
                    <TableRow key={c.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{c.avatar}</div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">{c.name}</div>
                            <div className="truncate text-[11px] text-muted-foreground">{c.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-sm">{c.company}</TableCell>
                      <TableCell>
                        <div className="text-xs">{c.email}</div>
                        <div className="text-[11px] text-muted-foreground">{c.phone}</div>
                      </TableCell>
                      <TableCell><StatusBadge value={c.type} /></TableCell>
                      <TableCell className="text-right num">{c.totalOrders}</TableCell>
                      <TableCell className="text-right num font-semibold">{inr(c.totalSpend)}</TableCell>
                      <TableCell><Switch defaultChecked={c.active} /></TableCell>
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
          </SectionCard>
        );
      }}
    </PageShell>
  );
}
