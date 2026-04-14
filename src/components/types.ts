export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  viewCount: number;
  featuredImage?: string | null;
}

export interface RelatedBlogsProps {
  currentSlug: string;
  keywords?: string[];
  limit?: number;
}
