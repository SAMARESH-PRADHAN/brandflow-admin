import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, BarChart3, Package, ShoppingCart, Users,
  CreditCard, Star, FileBarChart, Sparkles, Boxes, Layers,
} from "lucide-react";

import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const nav = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Analytics", url: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Commerce",
    items: [
      { title: "Products", url: "/products", icon: Package },
      { title: "Orders", url: "/orders", icon: ShoppingCart },
      { title: "Customers", url: "/customers", icon: Users },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Payments", url: "/payments", icon: CreditCard },
      { title: "Reports", url: "/reports", icon: FileBarChart },
    ],
  },
  {
    label: "Engagement",
    items: [
      { title: "Reviews", url: "/reviews", icon: Star },
    ],
  },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-lg shadow-primary/30">
            <Sparkles className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-display text-lg font-bold tracking-tight text-sidebar-foreground">
                ARRHENIUX
              </div>
              <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-sidebar-foreground/60">
                ERP Console
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
                        className="group relative h-10 rounded-lg data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                      >
                        <Link to={item.url} className="flex items-center gap-3">
                          {active && (
                            <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                          )}
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span className="truncate text-sm font-medium">{item.title}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarGroup className="mt-auto">
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/50">
              Product Suites
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="h-9 rounded-lg text-sidebar-foreground/80">
                  <Boxes className="h-4 w-4" />
                  {!collapsed && <span className="text-sm">Corporate Kits</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="h-9 rounded-lg text-sidebar-foreground/80">
                  <Layers className="h-4 w-4" />
                  {!collapsed && <span className="text-sm">New Collection</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed ? (
          <div className="glass rounded-xl border border-sidebar-border/60 bg-sidebar-accent/40 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/60">
              System status
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              <span className="text-xs font-medium text-sidebar-foreground">All services operational</span>
            </div>
          </div>
        ) : (
          <div className="grid place-items-center py-1">
            <span className="h-2 w-2 rounded-full bg-success" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
