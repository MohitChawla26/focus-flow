export type SourceType =
  | "news"
  | "technology"
  | "research"
  | "youtube"
  | "sports"
  | "social"
  | "rss"
  | "college"
  | "weather";

export type ContentItem = {
  id: string;
  userId?: string;
  title: string;
  content?: string;
  description?: string;
  source: string;
  sourceType: SourceType;
  originalUrl?: string;
  imageUrl?: string;
  author?: string;
  publishedAt?: string;
  rawData?: unknown;
};

export type ContentAnalysis = {
  summary: string;
  category: string;
  urgency: number;
  keywords: string[];
  people: string[];
  organizations: string[];
  deadline: string | null;
  eventName: string | null;
  actionRequired: boolean;
  suggestedPriorityReason: string;
};

export type UserProfile = {
  id: string;
  name: string;
  interests: Record<string, "high" | "medium" | "low">;
  keywords: string[];
  importantPeople: string[];
};

export type ScoreBreakdown = {
  interestMatch: number;
  urgency: number;
  sourceImportance: number;
  keywordPersonMatch: number;
  recency: number;
};

export type ScoredContentItem = ContentItem & {
  analysis: ContentAnalysis;
  score: number;
  priority: "critical" | "high" | "medium" | "low";
  breakdown: ScoreBreakdown;
  reasons: string[];
  relatedSources?: number;
};
