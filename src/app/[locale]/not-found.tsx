import { Metadata } from "next";
import NotFoundClient from "./not-found-client";

const SITE_NAME = "JobsBro";
const SITE_URL = "https://jobs-platform-gold.vercel.app";

export const metadata: Metadata = {
  title: `404 | ${SITE_NAME}`,
  description: "Page not found. 页面未找到。",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: `404 | ${SITE_NAME}`,
    description: "Page not found. 页面未找到。",
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `404 | ${SITE_NAME}`,
    description: "Page not found. 页面未找到。",
  },
};

export default function NotFound() {
  return <NotFoundClient />;
}
