import { safeJsonLdStringify } from "@/lib/utils";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  featuredImage?: string | null;
  viewCount: number;
  createdAt: Date;
  keywords?: string[];
}

interface BlogStructuredDataProps {
  posts: BlogPost[];
  total: number;
}

/**
 * 博客列表页结构化数据 (ItemList + Organization)
 */
export function BlogStructuredData({ posts, total }: BlogStructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobquip.com";

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "JobQuip求职博客",
    description: "专业的互联网求职博客，提供薪资报告、面试攻略、职业规划",
    url: `${baseUrl}/blog`,
    numberOfItems: total,
    itemListElement: posts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Article",
        headline: post.title,
        description: post.excerpt || post.title,
        url: `${baseUrl}/blog/${post.slug}`,
        image: post.featuredImage || `${baseUrl}/logo.png`,
        datePublished: post.createdAt.toISOString(),
        author: {
          "@type": "Organization",
          name: "JobQuip编辑",
        },
        publisher: {
          "@type": "Organization",
          name: "JobQuip",
          logo: {
            "@type": "ImageObject",
            url: `${baseUrl}/logo.png`,
          },
        },
        keywords: post.keywords?.join(", ") || "求职, 招聘",
      },
    })),
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "JobQuip",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: "专业的求职招聘平台，汇聚Web3、互联网、科技行业高薪职位",
    sameAs: [
      "https://twitter.com/jobquip",
      "https://linkedin.com/company/jobquip",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLdStringify(itemListSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLdStringify(organizationSchema),
        }}
      />
    </>
  );
}
