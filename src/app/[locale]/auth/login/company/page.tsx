import { Metadata } from "next";
import { LoginPageShell } from "../login-shell";

export const metadata: Metadata = {
  title: "企业登录 | 招聘平台",
  description: "企业用户登录，发布职位、管理简历。",
  robots: { index: false, follow: false },
};

export default function CompanyLoginPage() {
  return (
    <LoginPageShell
      title="企业登录"
      subtitle="企业用户登录平台，发布职位、管理招聘流程"
      role="COMPANY"
      redirectUrl="/company/dashboard"
      accentColor="emerald"
      registerLink={{ text: "注册企业账户", href: "/company/register" }}
      alternateLinks={[
        { text: "← 用户登录", href: "/auth/login" },
      ]}
    />
  );
}
