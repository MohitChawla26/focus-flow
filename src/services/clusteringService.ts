import type { ScoredContentItem } from "@/types";

const stopwords = new Set(["the","a","an","to","for","of","and","in","on","is","new","with"]);
const tokens = (title: string) => new Set(title.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter((x) => x.length > 2 && !stopwords.has(x)));
export function titleSimilarity(a: string, b: string) {
  const one=tokens(a), two=tokens(b); const intersection=[...one].filter(x=>two.has(x)).length; const union=new Set([...one,...two]).size;
  return union ? intersection/union : 0;
}
export function clusterContent(items: ScoredContentItem[], threshold = Number(process.env.CONTENT_CLUSTER_SIMILARITY_THRESHOLD ?? .82)) {
  const clusters: ScoredContentItem[][]=[];
  for(const item of items){const existing=clusters.find(cluster=>titleSimilarity(cluster[0].title,item.title)>=Math.min(threshold,.58));if(existing)existing.push(item);else clusters.push([item]);}
  return clusters.map(members=>({primary:members.sort((a,b)=>b.score-a.score)[0],members,sourceCount:new Set(members.map(x=>x.source)).size}));
}
