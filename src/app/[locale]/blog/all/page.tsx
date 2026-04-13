import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "博客分类 | 招聘平台",
  description: "浏览所有博客文章分类，获取求职干货、行业资讯和职业发展建议。",
};

export default function BlogAllPage() {
  // 重定向到博客首页
  redirect("/blog");
}
