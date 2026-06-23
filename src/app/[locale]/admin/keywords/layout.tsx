import type { Metadata } from "next";
export const metadata: Metadata = { title: "关键词监控 | 管理员控制台" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
