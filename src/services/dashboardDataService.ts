import "server-only";

import { createClient } from "@/lib/supabase/server";
import { scoreAll } from "@/services/importanceScoring";
import type { ContentAnalysis, UserProfile } from "@/types";

function embeddedAnalysis(rawData: unknown): ContentAnalysis | null {
  if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) return null;
  const value = (rawData as Record<string, unknown>).focusflowAnalysis;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const analysis = value as Record<string, unknown>;
  if (
    typeof analysis.summary !== "string" ||
    typeof analysis.category !== "string" ||
    typeof analysis.urgency !== "number" ||
    !Array.isArray(analysis.keywords) ||
    !Array.isArray(analysis.people) ||
    !Array.isArray(analysis.organizations) ||
    typeof analysis.actionRequired !== "boolean" ||
    typeof analysis.suggestedPriorityReason !== "string"
  ) return null;

  return {
    ...(analysis as unknown as Omit<ContentAnalysis, "catchyTitle">),
    catchyTitle: typeof analysis.catchyTitle === "string" ? analysis.catchyTitle : "",
  };
}

export async function getDashboardData() {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return null;

  const [profileResult, interestsResult, keywordsResult, peopleResult, contentResult, clustersResult, readResult, bookmarksResult, projectsResult] =
    await Promise.all([
      supabase.from("profiles").select("display_name,onboarding_completed").eq("id", user.id).maybeSingle(),
      supabase.from("user_interests").select("topic,priority").eq("user_id", user.id).order("topic"),
      supabase.from("user_keywords").select("keyword").eq("user_id", user.id),
      supabase.from("important_people").select("name").eq("user_id", user.id),
      supabase.from("content_items").select("*").order("published_at", { ascending: false, nullsFirst: false }).limit(200),
      supabase.from("content_clusters").select("primary_content_item_id,source_count"),
      supabase.from("read_status").select("content_item_id,read_at,hidden_at").eq("user_id", user.id),
      supabase.from("bookmarks").select("content_item_id").eq("user_id", user.id),
      supabase.from("user_projects").select("id,title,details,priority,deadline,status,created_at").eq("user_id", user.id).order("deadline", { ascending: true, nullsFirst: false }),
    ]);

  const contentRows = contentResult.data ?? [];
  const contentIds = contentRows.map((row) => row.id);
  const analysisResult = contentIds.length
    ? await supabase.from("content_analysis").select("*").in("content_item_id", contentIds)
    : { data: [], error: null };

  const analysisByContent = new Map((analysisResult.data ?? []).map((row) => [row.content_item_id, row]));
  const clusterCounts = new Map(
    (clustersResult.data ?? [])
      .filter((row) => row.primary_content_item_id)
      .map((row) => [row.primary_content_item_id as string, row.source_count]),
  );

  const interests = (interestsResult.data ?? []).map((row) => ({
    topic: row.topic,
    priority: row.priority,
  }));
  const profile: UserProfile = {
    id: user.id,
    name:
      profileResult.data?.display_name?.trim() ||
      String(user.user_metadata.display_name ?? "").trim() ||
      "User",
    interests: Object.fromEntries(
      interests.map((interest) => [interest.topic.toLowerCase(), interest.priority]),
    ),
    keywords: (keywordsResult.data ?? []).map((row) => row.keyword),
    importantPeople: (peopleResult.data ?? []).map((row) => row.name),
  };

  const items = contentRows.map((row) => {
    const stored = analysisByContent.get(row.id);
    const embedded = embeddedAnalysis(row.raw_data);
    const analysis: ContentAnalysis = stored
      ? {
          catchyTitle: embedded?.catchyTitle || row.title,
          summary: stored.summary,
          category: stored.category,
          urgency: stored.urgency,
          keywords: stored.keywords,
          people: stored.people,
          organizations: stored.organizations,
          deadline: stored.deadline,
          eventName: stored.event_name,
          actionRequired: stored.action_required,
          suggestedPriorityReason:
            stored.suggested_priority_reason || "This item is stored in your information feed.",
        }
      : embedded ?? {
          catchyTitle: row.title,
          summary: row.description || row.content || row.title,
          category: row.source_type,
          urgency: 0,
          keywords: [],
          people: [],
          organizations: [],
          deadline: null,
          eventName: null,
          actionRequired: false,
          suggestedPriorityReason: `This update came from ${row.source}.`,
        };

    return {
      id: row.id,
      userId: row.user_id ?? undefined,
      title: row.title,
      content: row.content ?? undefined,
      description: row.description ?? undefined,
      source: row.source,
      sourceType: row.source_type,
      originalUrl: row.original_url ?? undefined,
      imageUrl: row.image_url ?? undefined,
      author: row.author ?? undefined,
      publishedAt: row.published_at ?? undefined,
      analysis,
      relatedSources: clusterCounts.get(row.id),
    };
  });

  return {
    user,
    userName: profile.name,
    onboardingCompleted: profileResult.data?.onboarding_completed ?? false,
    interests,
    items: scoreAll(items, profile),
    readItemIds: (readResult.data ?? []).filter((row) => row.read_at).map((row) => row.content_item_id),
    hiddenItemIds: (readResult.data ?? []).filter((row) => row.hidden_at).map((row) => row.content_item_id),
    savedItemIds: (bookmarksResult.data ?? []).map((row) => row.content_item_id),
    projects: projectsResult.data ?? [],
    warnings: [
      profileResult.error,
      interestsResult.error,
      keywordsResult.error,
      peopleResult.error,
      contentResult.error,
      analysisResult.error,
      clustersResult.error,
      readResult.error,
      bookmarksResult.error,
      projectsResult.error,
    ].filter(Boolean).map((error) => error?.message ?? "Database query failed."),
  };
}

export function getSourceStatuses() {
  return [
    { name: "Hacker News", description: "Technology and startups", configured: true },
    { name: "arXiv", description: "AI and research papers", configured: true },
    { name: "Open-Meteo", description: "Contextual weather", configured: true },
    { name: "RSS", description: "User-provided feeds", configured: true },
    { name: "College notices", description: "Manual notice ingestion", configured: true },
    { name: "NewsAPI", description: "General and topical news", configured: Boolean(process.env.NEWS_API_KEY) },
    { name: "CricketData", description: "Current cricket matches", configured: Boolean(process.env.CRICKET_API_KEY) },
    { name: "AI enrichment", description: "Catchy headlines, analysis and summaries", configured: Boolean(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY) },
  ];
}
