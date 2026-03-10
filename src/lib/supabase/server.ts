import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function createSupabaseServer() {
  const cookieStorePromise = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStorePromise.then((store) => store.getAll());
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Parameters<Awaited<ReturnType<typeof cookies>>["set"]>[2] }[]) {
          cookieStorePromise
            .then((store) => {
              cookiesToSet.forEach(({ name, value, options }) => store.set(name, value, options));
            })
            .catch(() => {
              // Server Components cannot always set cookies directly; middleware handles refresh in those cases.
            });
        }
      }
    }
  );
}

