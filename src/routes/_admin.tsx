import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { Topbar } from "@/components/admin/topbar";
import { useEffect } from "react";
import { initDemoData } from "@/lib/store";

export default function AdminLayout() {
  useEffect(() => {
    initDemoData();
    const t = localStorage.getItem("arreniux:theme");
    if (t === "dark") document.documentElement.classList.add("dark");
  }, []);
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="min-w-0 flex-1">
          <Topbar />
          <Outlet />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
