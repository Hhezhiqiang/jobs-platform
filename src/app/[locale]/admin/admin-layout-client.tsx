"use client";

import { useState } from "react";
import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

/**
 * 管理后台客户端包装组件
 * - 提供 SessionProvider
 * - 管理侧边栏展开/折叠状态
 * - 渲染 Sidebar + Header + children
 */
export function AdminLayoutClient({
  children,
  user,
}: {
  children: React.ReactNode;
  user: Session["user"];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          collapsed={collapsed}
          onCollapseChange={setCollapsed}
        />
        <div className={`transition-[margin] duration-300 ${collapsed ? "md:ml-20" : "md:ml-64"}`}>
          <AdminHeader onMenuToggle={() => setMobileOpen(true)} collapsed={collapsed} />
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
