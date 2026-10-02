import "server-only";

import { createClient } from "@/lib/supabase/server";
import { analyzeContent, fallbackAnalysis } from "@/services/geminiService";
import {
  arxivAdapter,
  cricketAdapter,
  hackerNewsAdapter,
  newsApiAdapter,
  weatherAdapter,
} from "@/services/sources";
import type { ContentAnalysis, ContentItem } from "@/types";

const adapters = [
  hackerNewsAdapter,
  arxivAdapter,
  newsApiAdapter,
  cricketAdapter,
  weatherAdapter,
];

const MAX_ITEMS_PER_REFRESH = 60;
const MAX_AI_ITEMS_PER_REFRESH = 16;
const MAX_HEADLINE_BACKFILLS_PER_REFRESH = 8;
const ANALYSIS_CONCURRENCY = 4;

type IngestionResult = {
  fetched: number;
  created: number;
  analyzed: number;
  warnings: string[];
  sources: Array<{ source: string; fetched: number; warning?: string }>;
};

function serializeAnalysis(analysis: ContentAnalysis) {
  return {
    catchyTitle: analysis.catchyTitle,
    summary: analysis.summary,
    category: analysis.category,
    urgency: analysis.urgency,
    keywords: analysis.keywords,
    people: analysis.people,
    organizations: analysis.organizations,
    deadline: analysis.deadline,
    eventName: analysis.eventName,
    actionRequired: analysis.actionRequired,
    suggestedPriorityReason: analysis.suggestedPriorityReason,
  };
}

function hasCatchyTitle(rawData: unknown) {
  if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) return false;
  const analysis = (rawData as Record<string, unknown>).focusflowAnalysis;
  return Boolean(
    analysis &&
    typeof analysis === "object" &&
    !Array.isArray(analysis) &&
    typeof (analysis as Record<string, unknown>).catchyTitle === "string" &&
    String((analysis as Record<string, unknown>).catchyTitle).trim(),
  );
}

async function analyzeItems(items: ContentItem[]) {
  const analyses = new Map<string, ContentAnalysis>();

  for (let index = 0; index < items.length; index += ANALYSIS_CONCURRENCY) {
    const batch = items.slice(index, index + ANALYSIS_CONCURRENCY);
    const values = await Promise.all(
      batch.map(async (item) => {
        try {
          return [item.id, await analyzeContent(item)] as const;
        } catch {
          return [item.id, fallbackAnalysis(item)] as const;
        }
      }),
    );
    values.forEach(([id, analysis]) => analyses.set(id, analysis));
  }

  return analyses;
}

export async function ingestSourcesForCurrentUser(): Promise<IngestionResult | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return null;

  const sourceResults = await Promise.all(adapters.map((adapter) => adapter.fetch()));
  const sources = sourceResults.map((sourceResult) => ({
    source: sourceResult.source,
    fetched: sourceResult.items.length,
    warning: sourceResult.warning,
  }));
  const warnings = sourceResults.flatMap((sourceResult) =>
    sourceResult.warning ? [`${sourceResult.source}: ${sourceResult.warning}`] : [],
  );

  const idUniqueItems = Array.from(
    new Map(
      sourceResults
        .flatMap((sourceResult) => sourceResult.items)
        .map((item) => [item.id, item]),
    ).values(),
  );
  const seenUrls = new Set<string>();
  const uniqueItems = idUniqueItems
    .filter((item) => {
      if (!item.originalUrl) return true;
      const normalizedUrl = item.originalUrl.trim().toLowerCase();
      if (seenUrls.has(normalizedUrl)) return false;
      seenUrls.add(normalizedUrl);
      return true;
    })
    .slice(0, MAX_ITEMS_PER_REFRESH);

  if (!uniqueItems.length) {
    return { fetched: 0, created: 0, analyzed: 0, warnings, sources };
  }

  const externalIds = uniqueItems.map((item) => item.id);
  const { data: existingRows, error: existingError } = await supabase
    .from("content_items")
    .select("id,external_id,title,content,description,source,source_type,original_url,image_url,author,published_at,raw_data")
    .eq("user_id", authData.user.id)
    .in("external_id", externalIds);

  if (existingError) warnings.push(`Supabase lookup: ${existingError.message}`);
  const existingIds = new Set((existingRows ?? []).map((row) => row.external_id).filter(Boolean));
  const newItems = uniqueItems.filter((item) => !existingIds.has(item.id));
  const aiItems = newItems.slice(0, MAX_AI_ITEMS_PER_REFRESH);
  const analyses = await analyzeItems(aiItems);

  if (process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY) {
    const backfillRows = (existingRows ?? [])
      .filter((row) => !hasCatchyTitle(row.raw_data))
      .slice(0, MAX_HEADLINE_BACKFILLS_PER_REFRESH);
    const backfillItems: ContentItem[] = backfillRows.map((row) => ({
      id: row.external_id || row.id,
      title: row.title,
      content: row.content ?? undefined,
      description: row.description ?? undefined,
      source: row.source,
      sourceType: row.source_type,
      originalUrl: row.original_url ?? undefined,
      imageUrl: row.image_url ?? undefined,
      author: row.author ?? undefined,
      publishedAt: row.published_at ?? undefined,
    }));
    const backfillAnalyses = await analyzeItems(backfillItems);
    await Promise.all(backfillRows.map(async (row, index) => {
      const analysis = backfillAnalyses.get(backfillItems[index].id);
      if (!analysis || analysis.catchyTitle === row.title) return;
      const existingRaw = row.raw_data && typeof row.raw_data === "object" && !Array.isArray(row.raw_data)
        ? row.raw_data
        : {};
      const { error } = await supabase
        .from("content_items")
        .update({ raw_data: { ...existingRaw, focusflowAnalysis: serializeAnalysis(analysis) } })
        .eq("id", row.id)
        .eq("user_id", authData.user.id);
      if (error) warnings.push(`Headline update: ${error.message}`);
    }));
  }

  const rows = newItems.map((item) => {
    const analysis = analyses.get(item.id) ?? fallbackAnalysis(item);
    return {
      user_id: authData.user.id,
      external_id: item.id,
      title: item.title,
      content: item.content ?? null,
      description: item.description ?? null,
      source: item.source,
      source_type: item.sourceType,
      original_url: item.originalUrl ?? null,
      image_url: item.imageUrl ?? null,
      author: item.author ?? null,
      published_at: item.publishedAt ?? new Date().toISOString(),
      content_hash: item.id,
      raw_data: { focusflowAnalysis: serializeAnalysis(analysis) },
    };
  });

  if (!rows.length) {
    return {
      fetched: uniqueItems.length,
      created: 0,
      analyzed: 0,
      warnings,
      sources,
    };
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from("content_items")
    .insert(rows)
    .select("id");

  if (insertError) {
    console.error("[content-ingestion] Supabase insert failed:", insertError.message);
    warnings.push(`Supabase insert: ${insertError.message}`);
    return {
      fetched: uniqueItems.length,
      created: 0,
      analyzed: analyses.size,
      warnings,
      sources,
    };
  }

  return {
    fetched: uniqueItems.length,
    created: insertedRows?.length ?? rows.length,
    analyzed: analyses.size,
    warnings,
    sources,
  };
}
