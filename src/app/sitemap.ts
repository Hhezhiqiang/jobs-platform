import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobs-platform-gold.vercel.app";
const locales = ["zh", "en"] as const;

export const revalidate = 3600;

function withLocales(path: string): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    lastModified: new Date(),
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [jobs, companies, blogs, cmsPages] = await Promise.all([
    prisma.job.findMany({
      where: { status: "ACTIVE", slug: { not: "" } },
      select: { slug: true, updatedAt: true },
      take: 5000,
    }),
    prisma.company.findMany({
      select: { slug: true, updatedAt: true },
      take: 5000,
    }),
    prisma.page.findMany({
      where: { type: "BLOG", status: "PUBLISHED", slug: { not: "" } },
      select: { slug: true, updatedAt: true },
      take: 5000,
    }),
    prisma.page.findMany({
      where: { type: "PAGE", status: "PUBLISHED", slug: { not: "" } },
      select: { slug: true, updatedAt: true },
      take: 2000,
    }),
  ]);

  const staticPaths = [
    "",
    "/jobs",
    "/companies",
    "/blog",
    "/topics",
    "/jobs/city",
    "/about",
    "/contact",
    "/faq",
    "/salary-insights",
    "/privacy",
    "/terms",
    "/topics/java-developer",
    "/topics/frontend-developer",
    "/topics/product-manager",
    "/topics/remote-jobs",
    "/topics/fresh-graduate",
    ...["北京", "上海", "深圳", "杭州", "广州", "成都", "武汉", "西安", "南京", "苏州"].map(
      (city) => `/jobs/city/${encodeURIComponent(city)}`
    ),
  ];

  const staticRoutes: MetadataRoute.Sitemap = staticPaths.flatMap((path) =>
    withLocales(path)
  );

  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...jobs.flatMap((job) => withLocales(`/jobs/${job.slug}`)),
    ...companies.flatMap((company) => withLocales(`/companies/${company.slug}`)),
    ...blogs.flatMap((blog) => withLocales(`/blog/${blog.slug}`)),
    ...cmsPages.flatMap((page) => withLocales(`/topics/${page.slug}`)),
  ];

  // Add lastModified to dynamic routes
  const jobsWithDate = jobs.flatMap((job) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}/jobs/${job.slug}`,
      lastModified: job.updatedAt,
    }))
  );
  const companiesWithDate = companies.flatMap((company) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}/companies/${company.slug}`,
      lastModified: company.updatedAt,
    }))
  );
  const blogsWithDate = blogs.flatMap((blog) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}/blog/${blog.slug}`,
      lastModified: blog.updatedAt,
    }))
  );
  const pagesWithDate = cmsPages.flatMap((page) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}/topics/${page.slug}`,
      lastModified: page.updatedAt,
    }))
  );

  return [
    ...staticRoutes,
    ...jobsWithDate,
    ...companiesWithDate,
    ...blogsWithDate,
    ...pagesWithDate,
  ];
}
