"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Combobox } from "@/components/ui/Combobox";
import { Textarea } from "@/components/ui/Textarea";

type UserRow = {
  auth_user_id: string;
  full_name: string;
  phone: string;
  role: "admin" | "dispatcher" | "driver";
  status: "pending" | "approved" | "rejected" | "blocked";
  approved_at: string | null;
  approved_by: string | null;
  national_id_last4: string | null;
  notes: string | null;
  created_at: string;
};

type ReqRow = {
  id: string;
  full_name: string;
  phone: string;
  role_requested: "admin" | "dispatcher" | "driver";
  status: "pending" | "approved" | "rejected" | "blocked";
  national_id_last4: string | null;
  notes: string | null;
  created_at: string;
};

export default function AdminUsersClient({
  initialUsers,
  initialRequests
}: {
  initialUsers: UserRow[];
  initialRequests: ReqRow[];
}) {
  const [users, setUsers] = React.useState<UserRow[]>(initialUsers);
  const [requests, setRequests] = React.useState<ReqRow[]>(initialRequests);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  const [newUser, setNewUser] = React.useState({
    full_name: "",
    phone: "",
    national_id: "",
    role: "dispatcher" as "admin" | "dispatcher" | "driver",
    password: "",
    notes: ""
  });

  async function updateStatus(auth_user_id: string, status: UserRow["status"]) {
    setBusy(auth_user_id + ":" + status);
    setMsg(null);
    const r = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ auth_user_id, status })
    });
    const data = (await r.json()) as { ok: boolean; error?: string };
    setBusy(null);
    if (!r.ok || !data.ok) {
      setMsg("לא הצלחנו לעדכן סטטוס. בדוק/י הרשאות/חיבור.");
      return;
    }
    setUsers((prev) => prev.map((u) => (u.auth_user_id === auth_user_id ? { ...u, status } : u)));
    setMsg("עודכן בהצלחה");
  }

  async function createUser() {
    setBusy("create");
    setMsg(null);
    const r = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(newUser)
    });
    const data = (await r.json()) as { ok: boolean; error?: string; auth_user_id?: string };
    setBusy(null);
    if (!r.ok || !data.ok || !data.auth_user_id) {
      setMsg("יצירת משתמש נכשלה. ודא/י טלפון ייחודי, סיסמה (8+), ומפתחות סביבה לאדמין.");
      return;
    }
    setMsg("נוצר משתמש חדש במצב pending. אשר/י אותו כדי שיוכל להיכנס.");
    setNewUser({ full_name: "", phone: "", national_id: "", role: "dispatcher", password: "", notes: "" });
    // UI refresh best-effort: admin can refresh; keeping simple mobile-friendly.
  }

  async function updateRequest(id: string, status: ReqRow["status"]) {
    setBusy("req:" + id + ":" + status);
    setMsg(null);
    const r = await fetch("/api/admin/requests", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    const data = (await r.json()) as { ok: boolean; error?: string };
    setBusy(null);
    if (!r.ok || !data.ok) {
      setMsg("לא הצלחנו לעדכן בקשה. בדוק/י הרשאות/חיבור.");
      return;
    }
    setRequests((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    setMsg("עודכן בהצלחה");
  }

  return (
    <div className="space-y-8">
      {msg ? <div className="rounded-2xl border border-iaa-blue/10 bg-white px-5 py-4 font-bold text-iaa-blue">{msg}</div> : null}

      <section className="rounded-3xl border border-iaa-blue/10 bg-white shadow-soft">
        <div className="border-b border-iaa-blue/10 px-5 py-4 md:px-6">
          <div className="text-lg font-extrabold text-iaa-blue md:text-xl">בקשות הרשמה (pending)</div>
          <div className="text-sm font-semibold text-iaa-blue/60">סמן/י טיפול בבקשה, ובמידת הצורך צור/י משתמש ידנית.</div>
        </div>
        <div className="divide-y divide-iaa-blue/10">
          {requests.filter((r) => r.status === "pending").length ? (
            requests
              .filter((r) => r.status === "pending")
              .map((r) => (
                <div key={r.id} className="px-5 py-4 md:px-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-extrabold text-iaa-blue md:text-lg">{r.full_name}</div>
                      <div className="text-sm font-semibold text-iaa-blue/70">
                        טלפון: {r.phone} • תפקיד: {r.role_requested} • ת״ז (4 אחרונות): {r.national_id_last4 || "—"}
                      </div>
                      {r.notes ? <div className="mt-2 text-sm font-semibold text-iaa-blue/70">הערות: {r.notes}</div> : null}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        disabled={!!busy}
                        onClick={() => {
                          setNewUser((p) => ({
                            ...p,
                            full_name: r.full_name,
                            phone: r.phone,
                            role: (r.role_requested as any) || "dispatcher",
                            notes: r.notes || ""
                          }));
                          setMsg("הפרטים הועתקו ליצירת משתמש ידנית (יש להגדיר סיסמה ות״ז).");
                        }}
                      >
                        העתק ליצירה
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        disabled={!!busy}
                        onClick={() => updateRequest(r.id, "rejected")}
                      >
                        דחה בקשה
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        disabled={!!busy}
                        onClick={() => updateRequest(r.id, "approved")}
                      >
                        סמן כטופל
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="md"
                        disabled={!!busy}
                        onClick={() => updateRequest(r.id, "blocked")}
                      >
                        חסום
                      </Button>
                    </div>
                  </div>
                </div>
              ))
          ) : (
            <div className="px-5 py-6 text-sm font-semibold text-iaa-blue/60 md:px-6">אין בקשות pending</div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-iaa-blue/10 bg-white shadow-soft">
        <div className="border-b border-iaa-blue/10 px-5 py-4 md:px-6">
          <div className="text-lg font-extrabold text-iaa-blue md:text-xl">יצירת משתמש ידנית (Admin)</div>
          <div className="text-sm font-semibold text-iaa-blue/60">משתמש חדש נוצר תמיד כ‑pending, ואחר כך מאשרים אותו.</div>
        </div>
        <div className="grid grid-cols-1 gap-5 px-5 py-5 md:grid-cols-2 md:px-6">
          <Input label="שם מלא" value={newUser.full_name} onChange={(e) => setNewUser((p) => ({ ...p, full_name: e.target.value }))} required />
          <Input label="מספר טלפון" value={newUser.phone} onChange={(e) => setNewUser((p) => ({ ...p, phone: e.target.value }))} required inputMode="tel" />
          <Input label="תעודת זהות" value={newUser.national_id} onChange={(e) => setNewUser((p) => ({ ...p, national_id: e.target.value.replace(/[^\d]/g, "") }))} required inputMode="numeric" />
          <Combobox
            label="תפקיד"
            value={newUser.role}
            onChange={(v) => setNewUser((p) => ({ ...p, role: (v as any) || "dispatcher" }))}
            allowCustom={false}
            options={[
              { value: "dispatcher", label: "dispatcher" },
              { value: "driver", label: "driver" },
              { value: "admin", label: "admin" }
            ]}
          />
          <Input label="סיסמה" type="password" value={newUser.password} onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))} required />
          <div className="md:col-span-2">
            <Textarea label="הערות" value={newUser.notes} onChange={(e) => setNewUser((p) => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <Button type="button" size="lg" className="w-full" onClick={createUser} disabled={busy === "create"}>
              {busy === "create" ? "יוצר..." : "יצירת משתמש"}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-iaa-blue/10 bg-white shadow-soft">
        <div className="border-b border-iaa-blue/10 px-5 py-4 md:px-6">
          <div className="text-lg font-extrabold text-iaa-blue md:text-xl">משתמשים</div>
        </div>
        <div className="divide-y divide-iaa-blue/10">
          {users.length ? (
            users.map((u) => (
              <div key={u.auth_user_id} className="px-5 py-4 md:px-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-base font-extrabold text-iaa-blue md:text-lg">{u.full_name}</div>
                    <div className="text-sm font-semibold text-iaa-blue/70">
                      טלפון: {u.phone} • תפקיד: {u.role} • סטטוס: {u.status} • ת״ז (4 אחרונות): {u.national_id_last4 || "—"}
                    </div>
                    {u.notes ? <div className="mt-2 text-sm font-semibold text-iaa-blue/70">הערות: {u.notes}</div> : null}
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      disabled={!!busy}
                      onClick={() => updateStatus(u.auth_user_id, "approved")}
                    >
                      אשר
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      disabled={!!busy}
                      onClick={() => updateStatus(u.auth_user_id, "pending")}
                    >
                      Pending
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      disabled={!!busy}
                      onClick={() => updateStatus(u.auth_user_id, "rejected")}
                    >
                      דחה
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="md"
                      disabled={!!busy}
                      onClick={() => updateStatus(u.auth_user_id, "blocked")}
                    >
                      חסום
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-5 py-6 text-sm font-semibold text-iaa-blue/60 md:px-6">אין משתמשים</div>
          )}
        </div>
      </section>
    </div>
  );
}

