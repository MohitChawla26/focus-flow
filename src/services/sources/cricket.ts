import "server-only";

import { normalizeItem } from "@/services/normalizationService";
import { result, type SourceAdapter } from "./types";

export const cricketAdapter: SourceAdapter = {
  name: "CricketData",
  async fetch() {
    const key = process.env.CRICKET_API_KEY;
    if (!key) return result(this.name, [], "CRICKET_API_KEY is not configured.");

    try {
      const response = await fetch(
        `https://api.cricapi.com/v1/currentMatches?apikey=${key}&offset=0`,
        { next: { revalidate: 600 }, signal: AbortSignal.timeout(10_000) },
      );
      if (!response.ok) throw new Error(`CricketData returned ${response.status}.`);

      const data = await response.json();
      return result(
        this.name,
        (data.data ?? []).map((match: Record<string, unknown>) => {
          const matchId = String(match.id);
          return normalizeItem({
            externalId: matchId,
            title: String(match.name),
            description: String(match.status ?? "Current match update"),
            source: this.name,
            sourceType: "sports",
            originalUrl: `https://cricketdata.org/?match=${encodeURIComponent(matchId)}`,
            publishedAt: String(match.dateTimeGMT ?? new Date().toISOString()),
            rawData: match,
          });
        }),
      );
    } catch {
      return result(this.name, [], "CricketData request failed or quota is exhausted.");
    }
  },
};
