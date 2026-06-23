// Local re-declaration of ClassificationResult to avoid a circular/missing
// export from keyword-monitor. Mirrors the fields actually consumed by
// seo-plan.ts and other downstream callers.
export interface ClassificationResult {
  category?: string;
  intent?: string;
  hotLevel?: number;
  trendScore?: number;
  reasoning?: string;
}
