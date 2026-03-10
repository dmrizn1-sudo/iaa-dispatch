import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServer();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const authId = user?.id || "";
  const { data: me } = authId
    ? await supabase.from("app_users").select("role").eq("auth_user_id", authId).maybeSingle()
    : { data: null };
  const isAdmin = me?.role === "admin";

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-iaa-blue/10 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-iaa-blue text-white shadow-soft">
              <span className="font-extrabold">IA</span>
            </div>
            <div className="leading-tight">
              <div className="text-base font-extrabold text-iaa-blue md:text-lg">Israel Air & Ambulance</div>
              <div className="text-xs font-semibold text-iaa-blue/60 md:text-sm">מערכת שיבוץ קריאות</div>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-xl px-4 py-2 text-sm font-bold text-iaa-blue hover:bg-iaa-blue/5 md:text-base"
            >
              דשבורד
            </Link>
            <Link
              href="/equipment"
              className="rounded-xl px-4 py-2 text-sm font-bold text-iaa-blue hover:bg-iaa-blue/5 md:text-base"
            >
              ציוד
            </Link>
            {isAdmin ? (
              <Link
                href="/admin/users"
                className="rounded-xl px-4 py-2 text-sm font-bold text-iaa-blue hover:bg-iaa-blue/5 md:text-base"
              >
                אדמין
              </Link>
            ) : null}
            <Link
              href="/logout"
              className="rounded-xl px-4 py-2 text-sm font-bold text-iaa-blue hover:bg-iaa-blue/5 md:text-base"
            >
              יציאה
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:py-8">{children}</main>
    </div>
  );
}

