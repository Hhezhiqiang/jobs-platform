import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { generateWebsiteSchema } from "@/lib/schema";
import { Providers } from "@/components/providers";
import { TelegramFloatButton } from "@/components/telegram-float-button";
import { Footer } from "@/components/footer";
import { Analytics } from "@vercel/analytics/react";
import { PageTracker } from "@/components/page-tracker";

const inter = Inter({ subsets: ["latin"] });

const SITE_NAME = "JobsBro招聘平台";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobs-platform-gold.vercel.app";
const SITE_DESCRIPTION = "专业的求职招聘平台，汇聚海量优质Web3、互联网、科技行业职位，为求职者和企业提供高效对接服务，助力职场发展";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - 专业求职招聘平台，汇聚Web3、互联网高薪职位`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: ["招聘", "求职", "找工作", "人才网", "招聘信息", "职位搜索", "Web3招聘", "互联网招聘", "高薪职位", "职业发展"],
  openGraph: {
    title: `${SITE_NAME} - 专业求职招聘平台，汇聚Web3、互联网高薪职位`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "zh_CN",
    images: [`${SITE_URL}/logo.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - 专业求职招聘平台`,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/logo.png`],
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "zh-CN": SITE_URL,
      "x-default": SITE_URL,
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
    "bingbot": "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
    "googlebot": "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteSchema = generateWebsiteSchema(SITE_URL, SITE_NAME);

  return (
    <html lang="zh-CN">
      <head>
        {/* 结构化数据：WebSite + SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          
          {/* 页面访问跟踪 - 真实PV统计 */}
          <PageTracker />
          
          {/* Vercel Analytics */}
          <Analytics />
          
          {/* Baidu Auto Push */}
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
      </body>
    </html>
  );
}
