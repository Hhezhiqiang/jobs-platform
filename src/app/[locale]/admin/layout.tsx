import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  // 认证检查：非 ADMIN 重定向到登录页
  if (!session || session.user?.role !== "ADMIN") {
    redirect(`/${locale}/auth/login/admin`);
  }

  // 加载国际化消息
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="flex h-screen bg-gray-50">
        <AdminLayoutClient>
          {children}
        </AdminLayoutClient>
      </div>
    </NextIntlClientProvider>
  );
}
