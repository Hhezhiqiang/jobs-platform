/**
 * HTML 标签清理工具
 * 用于清理 Adzuna/Jooble 等第三方 API 返回的含 HTML 标签的职位描述
 */

/**
 * 清理 HTML 标签，保留纯文本
 * - 移除所有 <tag> 和 </tag>
 * - 将 <br>, <br/>, <p>, </p>, <li>, </li> 转换为换行
 * - 压缩多余空白
 */
export function stripHtml(html: string): string {
  if (!html) return '';

  let text = html;

  // 将 <br> <br/> <br /> <p> </p> <li> </li> <div> </div> 转换为换行
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/?p[^>]*>/gi, '\n');
  text = text.replace(/<\/?li[^>]*>/gi, '\n');
  text = text.replace(/<\/?div[^>]*>/gi, '\n');
  text = text.replace(/<\/?ul[^>]*>/gi, '\n');
  text = text.replace(/<\/?ol[^>]*>/gi, '\n');

  // 移除所有剩余 HTML 标签
  text = text.replace(/<[^>]+>/g, '');

  // 解码常见 HTML 实体
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&mdash;/g, '—');
  text = text.replace(/&ndash;/g, '–');
  text = text.replace(/&hellip;/g, '…');
  text = text.replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(parseInt(code, 10)));

  // 压缩多余空白行（最多保留一个空行）
  text = text.replace(/\n{3,}/g, '\n\n');

  // 去除首尾空白
  return text.trim();
}

/**
 * 截断文本到指定长度，保持句子完整
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // 尝试在句子边界截断
  const truncated = text.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastNewline = truncated.lastIndexOf('\n');
  const cutPoint = Math.max(lastPeriod, lastNewline);

  if (cutPoint > maxLength * 0.7) {
    return truncated.substring(0, cutPoint + 1);
  }

  // 否则在单词边界截断
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > maxLength * 0.7
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...';
}
