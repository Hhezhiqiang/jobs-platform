import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { generateWebsiteSchema } from "@/lib/schema";
import { Providers } from "@/components/providers";
import { TelegramFloatButton } from "@/components/telegram-float-button";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Analytics } from "@vercel/analytics/react";
import { PageTracker } from "@/components/page-tracker";
import { unstable_setRequestLocale } from "next-intl/server";
import { getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";

const inter = Inter({ subsets: ["latin"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobs-platform-gold.vercel.app";
const locales = ["zh", "en"] as const;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";

  const siteName = isEn ? "JobsBro" : "JobsBro招聘平台";
  const title = isEn
    ? "JobsBro - Professional Job Recruitment Platform"
    : "JobsBro招聘平台 - 专业求职招聘平台，汇聚Web3、互联网高薪职位";
  const description = isEn
    ? "A professional job recruitment platform connecting top talent with Web3, internet, and tech companies. Empower your career growth."
    : "专业的求职招聘平台，汇聚海量优质Web3、互联网、科技行业职位，为求职者和企业提供高效对接服务，助力职场发展";
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

  const websiteSchema = generateWebsiteSchema(SITE_URL, locale === "en" ? "JobsBro" : "JobsBro招聘平台");

  return (
    <html lang={locale}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
      </head>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Providers>
            <Header />
            {children}
            <PageTracker />
            <Analytics />
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
