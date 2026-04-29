import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { generateWebsiteSchema } from "@/lib/schema";
import { safeJsonLdStringify } from "@/lib/utils";
import { Providers } from "@/components/providers";
import { TelegramFloatButton } from "@/components/telegram-float-button";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Analytics } from "@vercel/analytics/react";
import { PageTracker } from "@/components/page-tracker";
import { GoogleAnalytics } from "@/components/google-analytics";
import { unstable_setRequestLocale } from "next-intl/server";
import { getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";

const inter = Inter({ subsets: ["latin"] });
const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-noto-sans-sc",
  preload: false,
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";
const locales = ["zh", "en"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";

  const siteName = isEn ? "JobQuip" : "JobQuip";
  const title = isEn
    ? "JobQuip | Web3 & Tech Jobs Recruitment Platform"
    : "JobQuip | Web3与互联网高薪职位招聘平台";
  const description = isEn
    ? "Discover Web3, blockchain, and tech jobs from top companies. Real-time job listings, salary insights, and career resources."
    : "专业的Web3与互联网招聘平台，汇聚区块链、科技行业高薪职位，为求职者和企业提供高效对接服务";
  const keywords = isEn
    ? ["jobs", "recruitment", "career", "Web3 jobs", "tech jobs", "job search", "hiring"]
    : ["招聘", "求职", "找工作", "人才网", "招聘信息", "职位搜索", "Web3招聘", "互联网招聘", "高薪职位", "职业发展"];

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${siteName}` },
    description,
    keywords,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}`,
      siteName,
      type: "website",
      locale: isEn ? "en_US" : "zh_CN",
      images: [`${SITE_URL}/logo.png`],
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description,
      images: [`${SITE_URL}/logo.png`],
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        "zh-CN": `${SITE_URL}/zh`,
        "en": `${SITE_URL}/en`,
        "x-default": `${SITE_URL}/zh`,
      },
      types: {
        "application/rss+xml": `${SITE_URL}/rss.xml`,
      },
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon.png", type: "image/png", sizes: "32x32" },
      ],
      apple: "/apple-touch-icon.png",
    },
    manifest: "/manifest.webmanifest",
    robots: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
    verification: {
      other: {
        "baidu-site-verification": "code-wV5u95unUV",
        "sogou_site_verification": "your-code",
        "360-site-verification": "your-code",
      },
    },
    other: {
      bingbot: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
      googlebot: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
}>) {
  const { locale } = await params;
  unstable_setRequestLocale(locale);
  const messages = await getMessages();

  const siteName = locale === "en" ? "JobQuip" : "JobQuip招聘平台";

  // WebSite + Organization Schema (SEO + AI 索引)
  const websiteSchema = generateWebsiteSchema(SITE_URL, siteName);

  // Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [
      "https://twitter.com/jobsbro",
      "https://linkedin.com/company/jobsbro",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      availableLanguage: ["zh", "en"],
    },
  };

  return (
    <html lang={locale}>
      <head>
        {/* WebSite Schema — Google for Jobs 核心 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLdStringify(websiteSchema),
          }}
        />
        {/* Organization Schema — 品牌信任 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLdStringify(organizationSchema),
          }}
        />
        {/* 预连接到关键外部资源，提升加载速度 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://vercel.live" />
        {/* 预加载关键资源 */}
        <link rel="preload" href="/logo.png" as="image" />
      </head>
      <body className={`${inter.className} ${notoSansSC.variable} font-sans`}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Providers>
            <Header />
            {children}
            <PageTracker />
            <Analytics />
            <GoogleAnalytics />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  (function(){
                    var bp = document.createElement('script');
                    var curProtocol = window.location.protocol.split(':')[0];
                    if (curProtocol === 'https') {
                      bp.src = 'https://zz.bdstatic.com/linksubmit/push.js';
                    } else {
                      bp.src = 'http://push.zhanzhang.baidu.com/push.js';
                    }
                    var s = document.getElementsByTagName("script")[0];
                    s.parentNode.insertBefore(bp, s);
                  })();
                `,
              }}
            />
            <TelegramFloatButton />
            <Footer />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
