/**
 * 批量修复ESLint no-explicit-any 问题的脚本
 * 这个脚本用于生成修复建议
 */

// 需要修复的文件和修复策略
const filesToFix = [
  // 已修复的文件：
  // - src/app/[locale]/admin/companies/page.tsx
  // - src/app/[locale]/admin/jobs/page.tsx
  // - src/app/[locale]/admin/promoters/page.tsx
  // - src/app/[locale]/admin/withdrawals/page.tsx

  // 待修复的文件：
  "src/app/[locale]/blog/[slug]/page.tsx",
  "src/app/[locale]/blog/page.tsx",
  "src/app/[locale]/company/applications/[id]/page.tsx",
  "src/app/[locale]/company/applications/page.tsx",
  "src/app/[locale]/company/dashboard/page.tsx",
  "src/app/[locale]/company/jobs/[id]/edit/page.tsx",
  "src/app/[locale]/company/jobs/new/page.tsx",
  "src/app/[locale]/company/jobs/page.tsx",
  "src/app/[locale]/company/register/page.tsx",
  "src/app/[locale]/jobs/page.tsx",
  "src/app/[locale]/dashboard/notifications/page.tsx",
  "src/app/[locale]/promoter/dashboard/page.tsx",
  "src/app/[locale]/search/search-page-client.tsx",
  "src/app/[locale]/topics/[slug]/page.tsx",
  "src/app/[locale]/user/recharge/page.tsx",
  "src/app/api/admin/commissions/route.ts",
  "src/app/api/company/applications/route.ts",
  "src/app/api/company/jobs/route.ts",
  "src/app/api/company/profile/route.ts",
  "src/app/api/promoter/earnings/route.ts",
  "src/app/api/user/favorites/route.ts",
  "src/app/api/webhooks/alipay/route.ts",
  "src/components/balance/balance-management.tsx",
  "src/components/company/company-profile-modal.tsx",
  "src/components/experience/exp-system-client.tsx",
  "src/components/experience/leaderboard-section.tsx",
  "src/components/home/hot-searches.tsx",
  "src/components/job-apply-tracker.tsx",
  "src/components/layout/header.tsx",
  "src/components/layout/user-nav.tsx",
  "src/components/notifications/notification-panel.tsx",
  "src/components/resume/resume-uploader.tsx",
  "src/components/search/search-overlay.tsx",
  "src/components/search/search-suggestions.tsx",
  "src/components/ui/animated-list.tsx",
  "src/lib/db.ts",
];

console.log("需要修复的文件数量:", filesToFix.length);
console.log("\n建议的修复模式:");
console.log("1. Prisma类型: 使用 Prisma.ModelNameWhereInput/UpdateInput 替换 where/data 的 any");
console.log("2. Error类型: 使用 unknown 替换 catch (err: any)，并进行类型检查");
console.log("3. 数据类型: 使用具体的接口或类型别名替换 any[] 和 any");
