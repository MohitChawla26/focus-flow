import "server-only";
import { normalizeItem } from "@/services/normalizationService";
import { result, type SourceAdapter } from "./types";

export const hackerNewsAdapter: SourceAdapter = { name:"Hacker News", async fetch(){
  try { const ids=await fetch("https://hacker-news.firebaseio.com/v0/topstories.json",{next:{revalidate:900},signal:AbortSignal.timeout(8000)}).then(r=>{if(!r.ok)throw new Error();return r.json()}) as number[];
    const stories=await Promise.all(ids.slice(0,12).map(id=>fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`,{next:{revalidate:900},signal:AbortSignal.timeout(8000)}).then(r=>r.json())));
    return result(this.name,stories.filter(Boolean).map(s=>normalizeItem({externalId:String(s.id),title:s.title,description:`${s.score??0} points · ${s.descendants??0} comments`,source:this.name,sourceType:"technology",originalUrl:s.url??`https://news.ycombinator.com/item?id=${s.id}`,author:s.by,publishedAt:new Date(s.time*1000).toISOString(),rawData:s})));
  } catch { return result(this.name,[],"Hacker News is temporarily unavailable."); }
}};
