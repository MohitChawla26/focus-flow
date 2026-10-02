export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const CATEGORIES = [
  "Academics",
  "Assignments",
  "Exams",
  "Events",
  "Internships",
  "Competitions",
  "Scholarships",
  "Important notices",
] as const;

export type Item = {
  id: string;
  source: string;
  category: string;
  title: string;
  body: string;
  url: string;
  author: string;
  published_at: string;
  credibility: number;
  urgency: number;
  relevance: number;
  summary: string[];
  deadline: string | null;
  actions: string[];
  explanation: string;
  why: string[];
  duplicates: number;
  cluster_id: string | null;
  r: number;
  theta: number;
};

export type FeedResponse = {
  categories: string[];
  items: Item[];
  triage: { urgent: number; important: number; fyi: number };
  overload: { inflow_24h: number; processed: number; score: number };
  recommendations: Array<{ title: string; why: string; url: string }>;
  dont_miss: string[];
};

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) throw new Error(`The service returned ${response.status}.`);
  return response.json() as Promise<T>;
}
