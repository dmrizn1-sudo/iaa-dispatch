"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export default function LogoutPage() {
  const router = useRouter();
  React.useEffect(() => {
    (async () => {
      const supabase = createSupabaseBrowser();
      await supabase.auth.signOut();
      router.replace("/login");
    })();
  }, [router]);

  return <main className="min-h-dvh grid place-items-center text-lg font-bold text-iaa-blue">מתנתק...</main>;
}

