"use client";
import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
export interface AdminLayoutClientProps { children: React.ReactNode; }
export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  return (<>
    <AdminSidebar collapsed={collapsed} onCollapseChange={setCollapsed} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
    <div className="flex flex-1 flex-col overflow-hidden">
      <AdminHeader onMenuToggle={() => setMobileOpen(true)} collapsed={collapsed} />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
    </div>
  </>);
}
