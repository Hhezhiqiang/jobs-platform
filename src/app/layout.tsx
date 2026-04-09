import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { generateHomeMetadata } from "@/lib/metadata";
import { generateWebsiteSchema } from "@/lib/schema";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = generateHomeMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "招聘平台";
  
  const websiteSchema = generateWebsiteSchema(siteUrl, siteName);

  return (
    <html lang="zh-CN">
      <head>
        {/* SEO Core Meta */}
        <meta name="theme-color" content="#2563eb" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="招聘平台" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        
        {/* Search Engine Bots */}
        <meta name="bingbot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        
        {/* Baidu Specific */}
        <meta name="baidu-site-verification" content="code-wV5u95unUV" />
        <meta name="sogou_site_verification" content="your-code" />
        <meta name="360-site-verification" content="your-code" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
