import { NextResponse } from "next/server";
import { binodProfile, demoItems } from "@/data/demo";
import { analyzeContent } from "@/services/geminiService";
import { scoreAll } from "@/services/importanceScoring";
import { arxivAdapter, cricketAdapter, hackerNewsAdapter, newsApiAdapter, weatherAdapter, youtubeAdapter } from "@/services/sources";

export async function GET(request: Request) {
  const live = new URL(request.url).searchParams.get("live") === "1";
  if (!live) return NextResponse.json({ mode:"demo", items:scoreAll(demoItems,binodProfile), warnings:[] });
  const results=await Promise.all([hackerNewsAdapter,arxivAdapter,weatherAdapter,newsApiAdapter,youtubeAdapter,cricketAdapter].map(a=>a.fetch()));
  const normalized=results.flatMap(r=>r.items).slice(0,50);
  const enriched=await Promise.all(normalized.map(async item=>({...item,analysis:await analyzeContent(item)})));
  return NextResponse.json({mode:"live",items:scoreAll(enriched,binodProfile),warnings:results.flatMap(r=>r.warning?[r.warning]:[])});
}
