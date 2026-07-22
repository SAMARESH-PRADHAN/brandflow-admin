import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { Topbar } from "@/components/admin/topbar";
import { useEffect } from "react";

export default function AdminLayout() {
  useEffect(() => {
    const t = localStorage.getItem("arreniux:theme") ?? "dark";
    document.documentElement.classList.toggle("dark", t === "dark");
    if (!localStorage.getItem("arreniux:theme")) localStorage.setItem("arreniux:theme", "dark");
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
