/**
 * 自动翻译服务 - 使用 Kimi API 翻译博客和职位内容
 * 
 * 用法：
 * import { translateBlogContent, translateJobContent } from "@/lib/auto-translator";
 * 
 * const en = await translateBlogContent(zhTitle, zhContent);
 */

const KIMI_API_KEY = process.env.KIMI_API_KEY;
const KIMI_API_URL = "https://api.moonshot.cn/v1/chat/completions";

async function callKimi(prompt: string, maxTokens = 2000) {
  if (!KIMI_API_KEY) throw new Error("KIMI_API_KEY not set");
  
  const response = await fetch(KIMI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KIMI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "moonshot-v1-8k",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Kimi API error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim();
}

function extractJson(text: string): any {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found in response");
  return JSON.parse(match[0]);
}

/**
 * 翻译博客内容
 * @returns { titleEn, excerptEn, contentEn }
 */
export async function translateBlogContent(title: string, content: string) {
  // 翻译标题和摘要（短文本）
  const titlePrompt = `Translate this Chinese blog title to a professional English title suitable for SEO.
Also provide a short excerpt under 160 characters for SEO meta description.

Chinese Title: ${title}

Return ONLY valid JSON:
{"title": "English title here", "excerpt": "Short English excerpt under 160 chars"}`;

  const titleResult = await callKimi(titlePrompt, 300);
  const { title: titleEn, excerpt: excerptEn } = extractJson(titleResult);

  // 翻译正文（长文本）
  const contentPrompt = `Translate the following Chinese blog article into professional English.
Keep all markdown formatting (headings, lists, bold, italic, links, etc.).
Do NOT add or remove any sections. Maintain the original structure.

Chinese Content:
${content}

Return ONLY the translated English markdown content. No extra text before or after.`;

  const contentEn = await callKimi(contentPrompt, 8000);

  return { titleEn, excerptEn, contentEn };
}

/**
 * 翻译职位内容
 * @returns { titleEn, descriptionEn, requirementsEn, benefitsEn }
 */
export async function translateJobContent(title: string, description: string, requirements?: string, benefits?: string) {
  let prompt = `Translate this Chinese job posting into professional English suitable for international job seekers.

Chinese Title: ${title}
Chinese Description: ${description}`;

  if (requirements) prompt += `\nChinese Requirements: ${requirements}`;
  if (benefits) prompt += `\nChinese Benefits: ${benefits}`;

  prompt += `\n
Return ONLY valid JSON with these fields (use null for any missing field):
{
  "titleEn": "English job title",
  "descriptionEn": "English job description",
  "requirementsEn": "English requirements or null",
  "benefitsEn": "English benefits or null"
}`;

  const result = await callKimi(prompt, 3000);
  return extractJson(result);
}
