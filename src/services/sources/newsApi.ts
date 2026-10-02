import "server-only";
import { normalizeItem } from "@/services/normalizationService";
import { result, type SourceAdapter } from "./types";

type NewsArticle = {
  source?: { name?: string };
  author?: string | null;
  title?: string;
  description?: string | null;
  url?: string;
  urlToImage?: string | null;
  publishedAt?: string;
  content?: string | null;
};

export const newsApiAdapter: SourceAdapter = {
  name: "NewsAPI",
  async fetch() {
    const key = process.env.NEWS_API_KEY;
    if (!key) return result(this.name, [], "NEWS_API_KEY is not configured.");

    try {
      const params = new URLSearchParams({
        q: process.env.NEWS_DEFAULT_QUERY || "Apple",
        from: process.env.NEWS_FROM_DATE || new Date().toISOString().slice(0, 10),
        sortBy: "popularity",
        language: "en",
        pageSize: "20",
        apiKey: key,
      });
      const response = await fetch(`https://newsapi.org/v2/everything?${params}`, {
        next: { revalidate: 900 },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`NewsAPI returned ${response.status}`);
      let data = (await response.json()) as { articles?: NewsArticle[] };

      // NewsAPI can report matching results before same-day articles are available.
      // Fall back to top headlines so the live feed remains useful without a second client request.
      if (!data.articles?.length) {
        const headlineParams = new URLSearchParams({ country: "us", pageSize: "20", apiKey: key });
        const headlineResponse = await fetch(`https://newsapi.org/v2/top-headlines?${headlineParams}`, {
          next: { revalidate: 900 },
          signal: AbortSignal.timeout(10_000),
        });
        if (headlineResponse.ok) data = (await headlineResponse.json()) as { articles?: NewsArticle[] };
      }

      return result(
        this.name,
        (data.articles ?? [])
          .filter((article) => article.title && article.url)
          .map((article) =>
            normalizeItem({
              title: article.title!,
              description: article.description ?? undefined,
              content: article.content ?? undefined,
              source: article.source?.name || this.name,
              sourceType: "news",
              originalUrl: article.url,
              imageUrl: article.urlToImage ?? undefined,
              author: article.author ?? undefined,
              publishedAt: article.publishedAt,
              rawData: article,
            }),
          ),
      );
    } catch {
      return result(this.name, [], "NewsAPI request failed or was rate limited.");
    }
  },
};
