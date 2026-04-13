import { Metadata } from "next";
import { Suspense } from "react";
import RegisterForm from "./register-form";

export const metadata: Metadata = {
  title: "免费注册 | 招聘平台",
  description: "创建招聘平台账号，浏览海量优质职位，一键投递简历，开启您的职业之旅。",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
