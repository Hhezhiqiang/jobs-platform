import { Metadata } from "next";
import { LoginPageShell } from "../login-shell";

export const metadata: Metadata = {
  title: "管理员登录 | 招聘平台",
  description: "管理员登录后台管理系统。",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <LoginPageShell
      title="管理员登录"
      subtitle="管理员登录后台，进行系统管理和数据审核"
      role="ADMIN"
      redirectUrl="/admin"
      accentColor="purple"
      alternateLinks={[
        { text: "← 用户登录", href: "/auth/login" },
        { text: "企业登录 →", href: "/auth/login/company" },
      ]}
    />
  );
}
