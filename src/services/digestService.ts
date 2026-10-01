import type { ScoredContentItem } from "@/types";

export function generateDigest(items: ScoredContentItem[], since = new Date(Date.now()-8*3_600_000)) {
  const recent=items.filter(i=>!i.publishedAt||new Date(i.publishedAt)>=since);
  const mustKnow=recent.filter(i=>i.score>=75), worthKnowing=recent.filter(i=>i.score>=50&&i.score<75), everythingElse=recent.filter(i=>i.score<50);
  const originalMinutes=Math.max(1,Math.ceil(recent.reduce((sum,i)=>sum+((i.content??i.description??i.title).split(/\s+/).length/220),0)));
  const digestMinutes=Math.max(1,Math.ceil((mustKnow.length*50+worthKnowing.length*30+everythingElse.length*10)/220));
  return {since:since.toISOString(),total:recent.length,mustKnow,worthKnowing,everythingElse,estimatedReadingMinutes:digestMinutes,minutesSaved:Math.max(0,originalMinutes-digestMinutes)};
}
