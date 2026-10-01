import type { ContentItem } from "@/types";
export type SourceResult = { items: ContentItem[]; source: string; fetchedAt: string; warning?: string };
export interface SourceAdapter { name: string; fetch(): Promise<SourceResult>; }
export const result = (source:string,items:ContentItem[],warning?:string):SourceResult=>({source,items,warning,fetchedAt:new Date().toISOString()});
