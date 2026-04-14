"use server";

// 社交媒体自动分享服务
// 支持: Twitter, LinkedIn

interface ShareContent {
  title: string;
  excerpt: string;
  url: string;
  tags?: string[];
  imageUrl?: string;
}

/**
 * 分享博客到Twitter
 */
export async function shareToTwitter(content: ShareContent): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Twitter API v2 分享
    // 注意: 需要配置 TWITTER_BEARER_TOKEN, TWITTER_API_KEY 等环境变量
    
    const tweetText = buildTweetContent(content);
    
    // 这里可以调用Twitter API
    // 示例使用Twitter Web Intent (不需要API Key，但用户需要手动点击)
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    
    console.log(`[Social Share] Twitter URL: ${twitterUrl}`);
    
    return { 
      success: true, 
      url: twitterUrl 
    };
  } catch (error) {
    console.error("[Social Share] Twitter error:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 分享博客到LinkedIn
 */
export async function shareToLinkedIn(content: ShareContent): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(content.url)}`;
    
    console.log(`[Social Share] LinkedIn URL: ${linkedInUrl}`);
    
    return { 
      success: true, 
      url: linkedInUrl 
    };
  } catch (error) {
    console.error("[Social Share] LinkedIn error:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 构建Twitter分享内容
 */
function buildTweetContent(content: ShareContent): string {
  const maxLength = 280;
  const urlLength = 23; // t.co短链接长度
  
  let text = content.title;
  
  // 添加摘要（如果空间允许）
  const availableSpace = maxLength - urlLength - text.length - 5; // 5 for " - " and padding
  if (content.excerpt && availableSpace > 20) {
    const excerpt = content.excerpt.slice(0, availableSpace).trim();
    text += ` - ${excerpt}...`;
  }
  
  // 添加标签
  if (content.tags && content.tags.length > 0) {
    const tags = content.tags.slice(0, 3).map(tag => `#${tag.replace(/\s/g, "")}`).join(" ");
    const tagSpace = maxLength - text.length - urlLength - tags.length - 3;
    if (tagSpace > 0) {
      text += ` ${tags}`;
    }
  }
  
  // 添加URL
  text += ` ${content.url}`;
  
  return text;
}

/**
 * 自动生成分享内容
 */
export async function generateShareContent(
  blogId: string,
  baseUrl: string
): Promise<ShareContent | null> {
  const { prisma } = await import("@/lib/prisma");
  
  const blog = await prisma.pages.findUnique({
    where: { id: blogId },
    select: {
      title: true,
      excerpt: true,
      slug: true,
      keywords: true,
      featuredImage: true,
    },
  });
  
  if (!blog) return null;
  
  return {
    title: blog.title,
    excerpt: blog.excerpt || "",
    url: `${baseUrl}/blog/${blog.slug}`,
    tags: blog.keywords || [],
    imageUrl: blog.featuredImage || undefined,
  };
}

/**
 * 批量分享到多个平台
 */
export async function shareToMultiple(
  content: ShareContent,
  platforms: ("twitter" | "linkedin")[]
): Promise<Record<string, { success: boolean; url?: string; error?: string }>> {
  const results: Record<string, { success: boolean; url?: string; error?: string }> = {};
  
  for (const platform of platforms) {
    switch (platform) {
      case "twitter":
        results.twitter = await shareToTwitter(content);
        break;
      case "linkedin":
        results.linkedin = await shareToLinkedIn(content);
        break;
    }
  }
  
  return results;
}
