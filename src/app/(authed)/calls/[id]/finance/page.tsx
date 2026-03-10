import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import FinanceClient from "./financeClient";

export default async function FinancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseServer();
  const { data: call } = await supabase
    .from("calls")
    .select("id,call_no,status,invoice_number,receipt_number,payment_status,payment_method,amount,finance_notes")
    .eq("id", id)
    .maybeSingle();

  if (!call) return notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-extrabold text-iaa-blue md:text-3xl">סגירה פיננסית — קריאה #{call.call_no}</div>
          <div className="text-sm font-semibold text-iaa-blue/60 md:text-base">
            כדי לסגור קריאה חייבים להזין חשבונית וקבלה.
          </div>
        </div>
        <Link
          href={`/calls/${call.id}`}
          className="rounded-2xl border border-iaa-blue/15 bg-white px-5 py-3 text-base font-extrabold text-iaa-blue hover:bg-iaa-blue/[0.03]"
        >
          חזרה לקריאה
        </Link>
      </div>

      <FinanceClient callId={call.id} initial={call} />
    </div>
  );
}

