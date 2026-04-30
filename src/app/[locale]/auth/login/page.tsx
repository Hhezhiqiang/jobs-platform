import { Metadata } from "next";
import { LoginPageShell } from "./aurora-login-shell";

export const metadata: Metadata = {
  title: "用户登录 | 招聘平台",
  description: "登录招聘平台，管理您的求职申请和简历。",
  robots: { index: false, follow: false },
};

export default function UserLoginPage() {
  return (
    <LoginPageShell
      title="用户登录"
      subtitle="求职者登录平台，查看和管理您的求职进度"
      role="USER"
      redirectUrl="/dashboard"
      accentColor="aurora"
      registerLink={{ text: "立即注册", href: "/auth/register" }}
      alternateLinks={[
        { text: "企业用户登录 →", href: "/auth/login/company" },
      ]}
    />
  );
}
