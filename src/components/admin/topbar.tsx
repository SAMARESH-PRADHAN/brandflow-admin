import { Link, useLocation } from "react-router-dom";
import { Bell, LogOut, Moon, Sun, User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "sonner";
import { useState } from "react";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";

const routeLabels: Record<string, string> = {
  "": "Dashboard", products: "Products", "new-collection": "New Collection",
  b2b: "B2B Shop", "welcome-kits": "Welcome Kits", orders: "Orders",
  samples: "Samples", status: "Order Updation", customers: "Customers",
  agents: "B2B Agents", payments: "Payments", reviews: "Reviews",
  analytics: "Analytics", settings: "Settings",
};

export function Topbar() {
  const { theme, toggle } = useTheme();
  const pathname = useLocation().pathname;

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
      <Button variant="ghost" size="icon" onClick={() => toast("No new notifications")}>
        <Bell className="h-4 w-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9 gap-2 px-2">
            <div className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
            <span className="hidden text-sm font-medium sm:inline">Admin</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Signed in as</DropdownMenuLabel>
          <DropdownMenuItem disabled>admin@arreniux.com</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link to="/settings">Settings</Link></DropdownMenuItem>
          <DropdownMenuItem onClick={() => toast.success("Logged out (demo)")}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
