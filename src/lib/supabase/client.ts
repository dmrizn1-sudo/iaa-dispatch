import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Missing Supabase browser env vars (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)");
  return createBrowserClient(url, anonKey);
}

