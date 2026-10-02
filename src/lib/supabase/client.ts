import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

function getSupabaseKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && getSupabaseKey());
}

export function createClient() {
  if (!isSupabaseConfigured()) return null;
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabaseKey()!,
  );
}
