export interface RawKeywordItem {
  keyword: string;
  source: string;
  sourceUrl?: string;
  trendScore?: number;
  metadata?: Record<string, unknown>;
}

export interface KeywordSourceAdapter {
  name: string;
  fetch(): Promise<RawKeywordItem[]>;
}

export function normalizeKeyword(keyword: string): string {
  return keyword
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}
