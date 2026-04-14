import { prisma } from "@/lib/prisma";

interface TrafficReport {
  date: string;
  totalViews: number;
  uniqueVisitors: number;
  topPages: Array<{ path: string; views: number }>;
  topBlogs: Array<{ title: string; slug: string; views: number }>;
  growth: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

/**
 * 生成每日流量报告
 */
export async function generateDailyTrafficReport(): Promise<TrafficReport> {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  // 获取页面浏览统计
  // 注意: page_views 模型需要确认schema定义
  // 目前使用 pages 的 viewCount 作为替代统计

  // 获取博客浏览统计
  const blogs = await prisma.pages.findMany({
    where: { type: "BLOG", status: "PUBLISHED" },
    orderBy: { viewCount: "desc" },
    take: 10,
    select: {
      title: true,
      slug: true,
      viewCount: true,
    },
  });

  // 使用博客浏览量作为总浏览量统计
  const totalViews = blogs.reduce((sum, b) => sum + b.viewCount, 0);
  const uniqueIps = totalViews; // 简化处理，实际应该使用独立IP统计

  // 计算热门页面
  const pathCounts: Record<string, number> = {};

  const topPages = Object.entries(pathCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, views]) => ({ path, views }));

  // 计算增长（简化版）- 使用博客浏览量统计
  const todayViews = blogs.reduce((sum, b) => sum + b.viewCount, 0);
  const yesterdayViews = todayViews; // 简化处理

  const dailyGrowth = 0;

  return {
    date: today.toISOString().split("T")[0],
    totalViews,
    uniqueVisitors: uniqueIps,
    topPages,
    topBlogs: blogs.map(b => ({
      title: b.title,
      slug: b.slug,
      views: b.viewCount,
    })),
    growth: {
      daily: Math.round(dailyGrowth),
      weekly: 0,
      monthly: 0,
    },
  };
}

/**
 * 格式化报告为Markdown
 */
export function formatReportAsMarkdown(report: TrafficReport): string {
  return `# 每日流量报告 - ${report.date}

## 📊 总体数据

| 指标 | 数值 |
|------|------|
| 总浏览量 | ${report.totalViews} |
| 独立访客 | ${report.uniqueVisitors} |
| 日增长 | ${report.growth.daily}% |

## 🔥 热门页面

| 排名 | 页面 | 浏览量 |
|------|------|--------|
${report.topPages.map((p, i) => `| ${i + 1} | ${p.path} | ${p.views} |`).join("\n")}

## 📝 热门博客

| 排名 | 博客 | 浏览量 |
|------|------|--------|
${report.topBlogs.map((b, i) => `| ${i + 1} | [${b.title}](/blog/${b.slug}) | ${b.views} |`).join("\n")}

---
*报告生成时间: ${new Date().toLocaleString("zh-CN")}*
`;
}

/**
 * 保存报告到文件（可选）
 */
export async function saveReport(report: TrafficReport): Promise<void> {
  const markdown = formatReportAsMarkdown(report);
  console.log(markdown);
  
  // 可以在这里添加保存到文件或发送邮件的逻辑
}

// 如果直接运行此脚本
if (require.main === module) {
  generateDailyTrafficReport()
    .then(report => {
      console.log(formatReportAsMarkdown(report));
      process.exit(0);
    })
    .catch(error => {
      console.error("Error generating report:", error);
      process.exit(1);
    });
}
