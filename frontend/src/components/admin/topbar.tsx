import { Link, useLocation } from "react-router-dom";
import { Bell, Moon, Sun, ShoppingCart, CreditCard, Star, Package, Briefcase, Info, CheckCheck } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTheme } from "@/hooks/use-theme";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";
import { useCollection, type Notification } from "@/lib/store";

const routeLabels: Record<string, string> = {
  "": "Dashboard", products: "Products", "new-collection": "New Collection",
  b2b: "B2B Shop", "welcome-kits": "Welcome Kits", orders: "Orders",
  samples: "Samples", status: "Order Updation", customers: "Customers",
  agents: "B2B Agents", "agent-visits": "Agent Visits",
  payments: "Payments", reviews: "Reviews",
  analytics: "Analytics", settings: "Settings",
};

const ICONS: Record<Notification["type"], any> = {
  order: ShoppingCart, payment: CreditCard, review: Star, stock: Package, agent: Briefcase, system: Info,
};

export function Topbar() {
  const { theme, toggle } = useTheme();
  const pathname = useLocation().pathname;
  const { data: notifs, setAll, update } = useCollection<Notification>("notifications");

  const unread = notifs.filter((n) => !n.read).length;
  const markAllRead = () => setAll(notifs.map((n) => ({ ...n, read: true })));

  const parts = pathname.split("/").filter(Boolean);
  const crumbs = parts.length === 0 ? [{ label: "Dashboard", href: "/" }] : parts.map((p, i) => ({
    label: routeLabels[p] ?? p.replace(/-/g, " "),
    href: "/" + parts.slice(0, i + 1).join("/"),
  }));

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
      <SidebarTrigger className="shrink-0" />
      <div className="hidden min-w-0 flex-1 md:block">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink>
            </BreadcrumbItem>
            {crumbs.map((c, i) => (
              <Fragment key={c.href}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {i === crumbs.length - 1
                    ? <BreadcrumbPage className="capitalize">{c.label}</BreadcrumbPage>
                    : <BreadcrumbLink asChild><Link to={c.href}>{c.label}</Link></BreadcrumbLink>}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="ml-auto" />

      <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-96 p-0">
          <div className="flex items-center justify-between border-b border-border p-3">
            <div>
              <div className="font-display text-sm">Notifications</div>
              <div className="text-[11px] text-muted-foreground">{unread} unread of {notifs.length}</div>
            </div>
            {unread > 0 && (
              <Button size="sm" variant="ghost" onClick={markAllRead}>
                <CheckCheck className="mr-1 h-3.5 w-3.5" /> Mark all read
              </Button>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto scroll-thin">
            {notifs.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">No notifications</div>
            ) : notifs.map((n) => {
              const Icon = ICONS[n.type] ?? Info;
              const inner = (
                <div className={`flex gap-3 border-b border-border p-3 transition hover:bg-secondary/50 ${!n.read ? "bg-primary/5" : ""}`}>
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${!n.read ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold">{n.title}</div>
                      {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                    </div>
                    <div className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{n.message}</div>
                  </div>
                </div>
              );
              return n.link ? (
                <Link key={n.id} to={n.link} onClick={() => !n.read && update(n.id, { read: true })}>{inner}</Link>
              ) : (
                <button key={n.id} onClick={() => !n.read && update(n.id, { read: true })} className="block w-full text-left">{inner}</button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

    </header>
  );
}
