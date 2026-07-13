import { useState, type ReactNode } from "react";
import { Search, Download, Filter, Plus } from "lucide-react";
import { Topbar } from "@/components/admin/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function PageShell({
  title, subtitle, tabs, defaultTab, actions, children,
}: {
  title: string;
  subtitle?: string;
  tabs?: { value: string; label: string; count?: number }[];
  defaultTab?: string;
  actions?: ReactNode;
  children: (activeTab: string, query: string) => ReactNode;
}) {
  const [tab, setTab] = useState(defaultTab ?? tabs?.[0]?.value ?? "all");
  const [q, setQ] = useState("");

  return (
    <>
      <Topbar title={title} subtitle={subtitle} />
      <main className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search ${title.toLowerCase()}…`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-10 rounded-xl pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5"><Filter className="h-4 w-4" /> Filters</Button>
            <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-4 w-4" /> Export</Button>
            {actions ?? (
              <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> New</Button>
            )}
          </div>
        </div>

        {tabs && (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="h-10 flex-wrap gap-1 rounded-full bg-muted p-1">
              {tabs.map((t) => (
                <TabsTrigger key={t.value} value={t.value} className="h-8 gap-2 rounded-full px-4 text-xs">
                  {t.label}
                  {typeof t.count === "number" && (
                    <span className="rounded-full bg-background/60 px-1.5 text-[10px] font-semibold text-muted-foreground">
                      {t.count}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        <div className="animate-in-up">{children(tab, q)}</div>
      </main>
    </>
  );
}
