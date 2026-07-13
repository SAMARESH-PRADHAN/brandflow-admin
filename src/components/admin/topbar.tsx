import { Search, Command, Download, Plus } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-30 glass border-b border-border">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <SidebarTrigger className="shrink-0" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-lg font-bold tracking-tight sm:text-xl">
            {title}
          </h1>
          {subtitle && (
            <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p>
          )}
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1.5 text-sm text-muted-foreground md:flex md:w-72">
          <Search className="h-4 w-4" />
          <input
            placeholder="Search orders, products, customers…"
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground/70"
          />
          <kbd className="flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono">
            <Command className="h-3 w-3" /> K
          </kbd>
        </div>

        <Button variant="outline" size="sm" className="hidden gap-1.5 sm:inline-flex">
          <Download className="h-4 w-4" /> Export
        </Button>
        <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90">
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New</span>
        </Button>
      </div>
    </header>
  );
}
