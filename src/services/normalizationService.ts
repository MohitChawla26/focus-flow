import { createHash } from "node:crypto";
import type { ContentItem, SourceType } from "@/types";

export function stableContentId(source: string, externalId?: string, url?: string) {
  return createHash("sha256").update(`${source}:${externalId ?? url ?? crypto.randomUUID()}`).digest("hex").slice(0, 32);
}

export function normalizeItem(input: Omit<ContentItem, "id"> & { id?: string; externalId?: string }): ContentItem {
  const { externalId, ...item } = input;
  return {
    ...item,
    id: input.id ?? stableContentId(input.source, externalId, input.originalUrl),
    title: input.title.trim(),
    description: input.description?.trim(),
    publishedAt: input.publishedAt ? new Date(input.publishedAt).toISOString() : new Date().toISOString(),
  };
}

export function inferSourceType(category?: string): SourceType {
  const value = category?.toLowerCase() ?? "";
  if (/research|paper|arxiv/.test(value)) return "research";
  if (/college|campus|exam/.test(value)) return "college";
  if (/sport|cricket/.test(value)) return "sports";
  if (/tech|program|ai/.test(value)) return "technology";
  return "rss";
}
