declare module "google-trends-api" {
  interface RelatedQueriesOptions {
    keyword: string;
    geo?: string;
    hl?: string;
  }

  interface DailyTrendsOptions {
    geo?: string;
    hl?: string;
  }

  export function relatedQueries(options: RelatedQueriesOptions): Promise<string>;
  export function dailyTrends(options: DailyTrendsOptions): Promise<string>;
  export default { relatedQueries, dailyTrends };
}
