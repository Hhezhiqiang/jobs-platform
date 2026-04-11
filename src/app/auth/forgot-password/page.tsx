import { Metadata } from "next";
import ForgotPasswordClient from "./forgot-password-client";

export const metadata: Metadata = {
  title: "忘记密码 | 招聘平台",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
