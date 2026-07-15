import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export type Column<T> = {
  key: string; header: string; render: (row: T) => ReactNode;
  className?: string; sortable?: boolean; getValue?: (row: T) => string | number;
};

export function DataTable<T extends { id: string }>({
  rows, columns, pageSize = 10, searchable = true, searchKeys, emptyText = "No results",
  onExport,
}: {
  rows: T[]; columns: Column<T>[]; pageSize?: number;
  searchable?: boolean; searchKeys?: (keyof T)[]; emptyText?: string;
  onExport?: () => void;
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);

  const filtered = useMemo(() => {
    let out = rows;
    if (q) {
      const needle = q.toLowerCase();
      out = out.filter((r) => {
        const keys = (searchKeys ?? (Object.keys(r) as (keyof T)[])) as (keyof T)[];
        return keys.some((k) => String((r as any)[k] ?? "").toLowerCase().includes(needle));
      });
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.getValue) {
        out = [...out].sort((a, b) => {
          const va = col.getValue!(a), vb = col.getValue!(b);
          if (va < vb) return -1 * sort.dir;
          if (va > vb) return 1 * sort.dir;
          return 0;
        });
      }
    }
    return out;
  }, [rows, q, sort, columns, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const p = Math.min(page, totalPages);
  const paged = filtered.slice((p - 1) * pageSize, p * pageSize);

  return (
    <div className="space-y-3">
      {(searchable || onExport) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchable && (
            <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search…" className="pl-9" />
            </div>
          )}
          <div className="ml-auto text-xs text-muted-foreground">{filtered.length} result{filtered.length === 1 ? "" : "s"}</div>
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="mr-1 h-4 w-4" /> Export
            </Button>
          )}
        </div>
      )}

      <div className="overflow-x-auto scroll-thin rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/60">
              {columns.map((c) => (
                <TableHead
                  key={c.key}
                  className={c.className}
                  onClick={() => c.sortable && setSort((s) => ({
                    key: c.key, dir: s && s.key === c.key && s.dir === 1 ? -1 : 1,
                  }))}
                  style={{ cursor: c.sortable ? "pointer" : undefined }}
                >
                  {c.header}
                  {c.sortable && sort?.key === c.key && <span className="ml-1 text-xs">{sort.dir === 1 ? "▲" : "▼"}</span>}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length} className="py-12 text-center text-sm text-muted-foreground">{emptyText}</TableCell></TableRow>
            ) : paged.map((row) => (
              <TableRow key={row.id} className="group">
                {columns.map((c) => (
                  <TableCell key={c.key} className={c.className}>{c.render(row)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={p === 1} onClick={() => setPage(p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">Page {p} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={p === totalPages} onClick={() => setPage(p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function exportCsv(filename: string, rows: Record<string, any>[]) {
  if (typeof window === "undefined") return;
  if (rows.length === 0) return;
  const keys = Object.keys(rows[0]!);
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
