import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, BarChart3, Package, PackagePlus, Boxes, Gift,
  ShoppingCart, ClipboardList, GitBranch, Users, Briefcase,
  CreditCard, Star, Settings, Sparkles,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const nav = [
  { label: "Overview", items: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Analytics", url: "/analytics", icon: BarChart3 },
  ]},
  { label: "Product Management", items: [
    { title: "Products", url: "/products", icon: Package },
    { title: "New Collection", url: "/products/new-collection", icon: PackagePlus },
    { title: "B2B Shop Products", url: "/products/b2b", icon: Boxes },
    { title: "Welcome Kits", url: "/products/welcome-kits", icon: Gift },
  ]},
  { label: "Orders", items: [
    { title: "All Orders", url: "/orders", icon: ShoppingCart },
    { title: "Sample Orders", url: "/orders/samples", icon: ClipboardList },
    { title: "Order Updation", url: "/orders/status", icon: GitBranch },
  ]},
  { label: "Users", items: [
    { title: "Customers", url: "/customers", icon: Users },
    { title: "B2B Agents", url: "/agents", icon: Briefcase },
  ]},
  { label: "Business", items: [
    { title: "Payments", url: "/payments", icon: CreditCard },
    { title: "Reviews", url: "/reviews", icon: Star },
    { title: "Settings", url: "/settings", icon: Settings },
  ]},
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useLocation().pathname;
  const isActive = (url: string) => url === "/" ? pathname === "/" : pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/40">
            <Sparkles className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-display text-lg text-sidebar-foreground">ARRENIUX</div>
              <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-sidebar-foreground/60">
                Admin Panel
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="scroll-thin">
        {nav.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/50">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className="group relative h-9 rounded-lg data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                      >
                        <Link to={item.url} className="flex items-center gap-3">
                          {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />}
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span className="truncate text-sm">{item.title}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed ? (
          <div className="rounded-xl border border-sidebar-border/60 bg-sidebar-accent/40 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/60">
              Demo Environment
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="text-xs text-sidebar-foreground">Frontend-only • LocalStorage</span>
            </div>
          </div>
        ) : (
          <div className="grid place-items-center py-1">
            <span className="h-2 w-2 rounded-full bg-primary" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
