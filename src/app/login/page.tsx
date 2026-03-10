"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function LoginInner() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const status = search.get("status");

  return (
    <main className="min-h-dvh bg-gradient-to-b from-iaa-blue to-[#071a3a] px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-3xl bg-white/95 p-6 shadow-soft backdrop-blur md:p-8">
          <div className="mb-2 text-2xl font-extrabold text-iaa-blue md:text-3xl">Israel Air & Ambulance</div>
          <div className="mb-8 text-base font-semibold text-iaa-blue/70 md:text-lg">כניסת מפעיל/ת מוקד</div>

          {status === "pending" ? (
            <div className="mb-5 rounded-2xl border border-iaa-gold/30 bg-white px-5 py-4 font-bold text-iaa-blue">
              החשבון ממתין לאישור אדמין.
            </div>
          ) : status === "rejected" ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-bold text-red-700">
              הבקשה נדחתה. פנה/י למנהל המערכת.
            </div>
          ) : status === "blocked" ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-bold text-red-700">
              החשבון חסום. פנה/י למנהל המערכת.
            </div>
          ) : null}

          <form
            className="space-y-5"
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              setError(null);
              const supabase = createSupabaseBrowser();
              const phoneNorm = phone.replace(/[^\d+]/g, "");
              const { error: signInError } = await supabase.auth.signInWithPassword({
                email: `${phoneNorm}@phone.local`,
                password
              });
              setLoading(false);
              if (signInError) {
                setError("פרטי התחברות שגויים או שאין הרשאה.");
                return;
              }
              // Enforce "approved only" at login time (not just via middleware redirect).
              const u = await supabase.auth.getUser();
              const authId = u.data.user?.id || "";
              const { data: appUser } = await supabase.from("app_users").select("status").eq("auth_user_id", authId).maybeSingle();

              const st = (appUser?.status as string | undefined) || "pending";
              if (st !== "approved") {
                await supabase.auth.signOut();
                router.replace(`/login?status=${encodeURIComponent(st)}`);
                return;
              }
              router.replace(next);
            }}
          >
            <Input
              label="מספר טלפון"
              placeholder="053-2321101"
              inputMode="tel"
              autoComplete="username"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <Input
              label="סיסמה"
              placeholder="הקלד/י סיסמה"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error ? <div className="rounded-xl bg-red-50 px-4 py-3 font-semibold text-red-700">{error}</div> : null}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "מתחבר..." : "כניסה"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm font-semibold text-iaa-blue/70 md:text-base">
            אין משתמש?{" "}
            <a className="font-extrabold text-iaa-blue underline" href="/request-access">
              שליחת בקשת הרשמה
            </a>
          </div>
        </div>

        <div className="mt-5 text-center text-sm font-semibold text-white/70">
          לשימוש פנימי — מוקד השיבוץ בלבד
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

