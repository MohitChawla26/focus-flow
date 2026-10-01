import { ContentAnalysis, ContentItem, ScoredContentItem, UserProfile } from "@/types";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const sourceWeights: Record<ContentItem["sourceType"], number> = {
  college: 95,
  weather: 78,
  sports: 72,
  research: 74,
  technology: 76,
  news: 65,
  youtube: 55,
  rss: 62,
  social: 48,
};

function textOf(item: ContentItem, analysis: ContentAnalysis) {
  return [item.title, item.description, item.content, analysis.category, ...analysis.keywords, ...analysis.people]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function hasTerm(text: string, term: string) {
  const escaped = term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\W)${escaped}(?=$|\\W)`, "i").test(text);
}

function interestScore(text: string, profile: UserProfile) {
  let best = 5;
  for (const [interest, priority] of Object.entries(profile.interests)) {
    const aliases = interest === "ai" ? ["ai", "artificial intelligence", "gemini", "transformer"] : [interest];
    if (aliases.some((term) => hasTerm(text, term))) best = Math.max(best, priority === "high" ? 100 : priority === "medium" ? 72 : 18);
  }
  return best;
}

function matchScore(text: string, profile: UserProfile) {
  const keywordHits = profile.keywords.filter((word) => text.includes(word.toLowerCase()));
  const peopleHits = profile.importantPeople.filter((person) => text.includes(person.toLowerCase()));
  return { score: clamp(keywordHits.length * 38 + peopleHits.length * 45), keywordHits, peopleHits };
}

function recencyScore(publishedAt?: string) {
  if (!publishedAt) return 45;
  const hours = Math.max(0, (Date.now() - new Date(publishedAt).getTime()) / 3_600_000);
  if (hours <= 1) return 100;
  if (hours <= 6) return 90;
  if (hours <= 24) return 75;
  if (hours <= 72) return 55;
  return 30;
}

export function scoreContent(item: ContentItem, analysis: ContentAnalysis, profile: UserProfile): ScoredContentItem {
  const text = textOf(item, analysis);
  const interestMatch = interestScore(text, profile);
  const match = matchScore(text, profile);
  const deadlineBoost = analysis.deadline && new Date(analysis.deadline).getTime() - Date.now() < 48 * 3_600_000 ? 100 : analysis.urgency;
  const breakdown = {
    interestMatch,
    urgency: clamp(Math.max(analysis.urgency, deadlineBoost)),
    sourceImportance: sourceWeights[item.sourceType],
    keywordPersonMatch: match.score,
    recency: recencyScore(item.publishedAt),
  };
  const score = clamp(
    breakdown.interestMatch * 0.3 + breakdown.urgency * 0.25 + breakdown.sourceImportance * 0.2 + breakdown.keywordPersonMatch * 0.15 + breakdown.recency * 0.1,
  );
  const priority = score >= 90 ? "critical" : score >= 75 ? "high" : score >= 50 ? "medium" : "low";
  const reasons: string[] = [];
  const matchedInterest = Object.keys(profile.interests).find((interest) => hasTerm(text, interest) || (interest === "ai" && /artificial intelligence|gemini|transformer/.test(text)));
  if (matchedInterest) reasons.push(`You marked ${matchedInterest === "ai" ? "AI" : matchedInterest} as ${profile.interests[matchedInterest]} priority`);
  if (match.keywordHits[0]) reasons.push(`Contains your keyword “${match.keywordHits[0]}”`);
  if (analysis.deadline) reasons.push("A deadline is approaching within 48 hours");
  if (analysis.actionRequired) reasons.push("This update may require action from you");
  if (breakdown.recency >= 90) reasons.push("Published in the last few hours");
  if (!reasons.length) reasons.push(analysis.suggestedPriorityReason);
  return { ...item, analysis, score, priority, breakdown, reasons };
}

export function scoreAll(
  items: Array<ContentItem & { analysis: ContentAnalysis; relatedSources?: number }>,
  profile: UserProfile,
) {
  return items.map(({ analysis, ...item }) => ({ ...scoreContent(item, analysis, profile), relatedSources: item.relatedSources })).sort((a, b) => b.score - a.score);
}
