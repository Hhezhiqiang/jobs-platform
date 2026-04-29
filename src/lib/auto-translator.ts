/**
 * 自动翻译服务 - 使用统一 AI 客户端
 *
 * 用法：
 * import { translateBlogContent, translateJobContent } from "@/lib/auto-translator";
 *
 * const en = await translateBlogContent(zhTitle, zhContent);
 */

import { aiChat, aiChatJSON, isAIConfigured } from "@/lib/ai-client";

/**
 * 翻译博客内容
 * @returns { titleEn, excerptEn, contentEn }
 */
export async function translateBlogContent(title: string, content: string) {
  if (!isAIConfigured()) {
    throw new Error("AI API key not configured");
  }

  // 翻译标题和摘要（短文本）
  const titleResult = await aiChatJSON<{ title: string; excerpt: string }>(
    [
      {
        role: "user",
        content: `Translate this Chinese blog title to a professional English title suitable for SEO.
Also provide a short excerpt under 160 characters for SEO meta description.

Chinese Title: ${title}

Return ONLY valid JSON:
{"title": "English title here", "excerpt": "Short English excerpt under 160 chars"}`,
      },
    ],
    { maxTokens: 300, maxRetries: 2 },
  );
  const { title: titleEn, excerpt: excerptEn } = titleResult;

  // 翻译正文（长文本）
  const contentEn = await aiChat(
    [
      {
        role: "user",
        content: `Translate the following Chinese blog article into professional English.
Keep all markdown formatting (headings, lists, bold, italic, links, etc.).
Do NOT add or remove any sections. Maintain the original structure.

Chinese Content:
${content}

Return ONLY the translated English markdown content. No extra text before or after.`,
      },
    ],
    { maxTokens: 8000, maxRetries: 2 },
  );

  return { titleEn, excerptEn, contentEn };
}

/**
 * 翻译职位内容
 * @returns { titleEn, descriptionEn, requirementsEn, benefitsEn }
 */
export async function translateJobContent(
  title: string,
  description: string,
  requirements?: string,
  benefits?: string,
) {
  if (!isAIConfigured()) {
    throw new Error("AI API key not configured");
  }

  let prompt = `Translate this Chinese job posting into professional English suitable for international job seekers.

Chinese Title: ${title}
Chinese Description: ${description}`;

  if (requirements) prompt += `\nChinese Requirements: ${requirements}`;
  if (benefits) prompt += `\nChinese Benefits: ${benefits}`;

  prompt += `

Return ONLY valid JSON with these fields (use null for any missing field):
{
  "titleEn": "English job title",
  "descriptionEn": "English job description",
  "requirementsEn": "English requirements or null",
  "benefitsEn": "English benefits or null"
}`;

  const result = await aiChatJSON<{
    titleEn: string;
    descriptionEn: string;
    requirementsEn: string | null;
    benefitsEn: string | null;
  }>([{ role: "user", content: prompt }], { maxTokens: 3000, maxRetries: 2 });

  return result;
}
