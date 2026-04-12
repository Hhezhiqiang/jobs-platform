import { Metadata } from "next";
import NotFoundClient from "./not-found-client";

const SITE_NAME = "JobsBro招聘平台";
const SITE_URL = "https://jobs-platform-gold.vercel.app";

export const metadata: Metadata = {
  title: `页面未找到 - 404 | ${SITE_NAME}`,
  description: "抱歉，您访问的页面不存在。返回首页继续浏览职位与公司信息。",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: `页面未找到 - 404 | ${SITE_NAME}`,
    description: "抱歉，您访问的页面不存在。",
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: `页面未找到 - 404 | ${SITE_NAME}`,
    description: "抱歉，您访问的页面不存在。",
  },
};

export default function NotFound() {
  return <NotFoundClient />;
}
