import os

# 1. Fix header.tsx
header_file = "src/components/header.tsx"
with open(header_file) as f:
    content = f.read()

# Add DollarSign import
content = content.replace(
    "TrendingUp, MessageCircle } from \"lucide-react\"",
    "TrendingUp, MessageCircle, DollarSign } from \"lucide-react\""
)

# Add nav items after careerTrail
old_nav = '{ label: t("nav.careerTrail"), href: `/${locale}/career-trail`, icon: TrendingUp },'
new_nav = old_nav + '\n    { label: "圈子", href: `/${locale}/circles`, icon: MessageCircle },\n    { label: "薪资", href: `/${locale}/salary-insights`, icon: DollarSign },'

if "圈子" not in content:
    content = content.replace(old_nav, new_nav)

with open(header_file, "w") as f:
    f.write(content)
print("OK: header.tsx")

# 2. Fix mobile-bottom-nav.tsx
mobile_file = "src/components/mobile-bottom-nav.tsx"
with open(mobile_file) as f:
    content = f.read()

content = content.replace(
    "TrendingUp, User, Search } from \"lucide-react\"",
    "TrendingUp, User, Search, MessageCircle } from \"lucide-react\""
)

old_mob = '{ label: t("nav.careerTrail"), href: `/${locale}/career-trail`, icon: TrendingUp },'
new_mob = old_mob + '\n    { label: "圈子", href: `/${locale}/circles`, icon: MessageCircle },'

if "圈子" not in content:
    content = content.replace(old_mob, new_mob)

with open(mobile_file, "w") as f:
    f.write(content)
print("OK: mobile-bottom-nav.tsx")

# 3. Fix home page
home_file = "src/app/[locale]/page.tsx"
home_content = '''import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { HeroSection } from "@/components/hero-section";
import { FeaturesSection } from "@/components/features-section";
import { BlogSection } from "@/components/blog-section";
import { KeywordCloud } from "@/components/keyword-cloud";
import { CTASection } from "@/components/cta-section";
import { FAQSection } from "@/components/faq-section";
import { getTranslations } from "next-intl/server";
import { HomeCheckinWrapper } from "@/components/game/home-checkin-wrapper";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const { locale } = await Promise.resolve(params);
  const isEn = locale === "en";
  return {
    title: isEn ? "JobQuip - Professional Job Recruitment Platform" : "JobQuip - 专业求职招聘平台",
    description: isEn ? "A professional Web3 & tech job recruitment platform" : "专业的求职招聘平台，汇聚 Web3、互联网、科技行业高薪职位",
  };
}

export default async function HomePage({ params }: { params: { locale: string } }) {
  const { locale } = await Promise.resolve(params);
  const session = await getServerSession(authOptions);
  const t = await getTranslations("home");

  const [jobCount, companyCount, userCount] = await Promise.all([
    prisma.jobs.count({ where: { status: "ACTIVE" } }),
    prisma.companies.count({ where: { verificationStatus: "APPROVED" } }),
    prisma.users.count(),
  ]);

  const recentBlogs = await prisma.pages.findMany({
    where: { type: "BLOG", status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { users: { select: { id: true, name: true } } },
  });

  return (
    <div className="min-h-screen bg-white">
      <HomeCheckinWrapper />
      <HeroSection jobCount={jobCount} companyCount={companyCount} />
      <FeaturesSection />
      <BlogSection blogs={recentBlogs} />
      <KeywordCloud />
      <CTASection isLoggedIn={!!session?.user} locale={locale} />
      <FAQSection />
    </div>
  );
}
'''

with open(home_file, "w") as f:
    f.write(home_content)
print("OK: home page.tsx")
