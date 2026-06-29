import { Metadata } from "next";
import { redirect } from "next/navigation";

// This route is a permanent alias of /blog. We force noindex so the
// canonical /blog is the single SEO target and we don't compete with
// ourselves for the same content.
export const metadata: Metadata = {
  title: "博客分类 | JobQuip",
  description: "浏览所有博客文章分类。",
  robots: { index: false, follow: true },
  alternates: { canonical: "https://jobquip.com/zh/blog" },
};

export default async function BlogAllPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/blog`);
}
