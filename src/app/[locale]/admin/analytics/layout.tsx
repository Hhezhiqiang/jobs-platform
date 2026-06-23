import type { Metadata } from "next";
export const metadata: Metadata = { title: "数据分析 | 管理员控制台" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
