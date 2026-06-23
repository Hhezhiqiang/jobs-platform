"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
export interface AdminLayoutClientProps { children: React.ReactNode; }
export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  return (<div className="contents">
    <AdminSidebar collapsed={collapsed} onCollapseChange={setCollapsed} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
    <div className={cn("flex flex-1 flex-col overflow-hidden transition-[margin] duration-300 md:ml-64", collapsed && "md:ml-20")}>
      <AdminHeader onMenuToggle={() => setMobileOpen(true)} collapsed={collapsed} />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 text-gray-900">{children}</main>
    </div>
  </div>);
}
