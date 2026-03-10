export type CallStatus =
  | "חדשה"
  | "שובצה"
  | "בדרך"
  | "הגיע"
  | "הסתיים"
  | "ממתין חשבונית"
  | "נסגר"
  | "נסגר חשבונית"; // legacy

export const CALL_STATUSES: CallStatus[] = ["חדשה", "שובצה", "בדרך", "הגיע", "הסתיים", "ממתין חשבונית", "נסגר"];

export const STATUS_COLORS: Record<CallStatus, { bg: string; text: string }> = {
  "חדשה": { bg: "bg-slate-200", text: "text-slate-800" },
  "שובצה": { bg: "bg-blue-100", text: "text-blue-800" },
  "בדרך": { bg: "bg-orange-100", text: "text-orange-800" },
  "הגיע": { bg: "bg-purple-100", text: "text-purple-800" },
  "הסתיים": { bg: "bg-green-100", text: "text-green-800" },
  "ממתין חשבונית": { bg: "bg-yellow-100", text: "text-yellow-900" },
  "נסגר": { bg: "bg-emerald-200", text: "text-emerald-900" },
  "נסגר חשבונית": { bg: "bg-emerald-200", text: "text-emerald-900" }
};

export const CALL_TYPES = [
  { value: "העברת חולה חירום", label: "העברת חולה חירום" },
  { value: "העברת חולה אמבולטורי", label: "העברת חולה אמבולטורי" },
  { value: "העברת נפטר", label: "העברת נפטר" }
] as const;

export const AMBULANCE_TYPES: { value: string; label: string }[] = [
  { value: "אמבולנס ביטחון", label: "אמבולנס ביטחון" },
  { value: "אמבולנס ALS", label: "אמבולנס ALS" },
  { value: "אמבולנס רגיל", label: "אמבולנס רגיל" }
];

export const HEALTH_FUNDS = [
  { value: "כללית", label: "כללית" },
  { value: "מכבי", label: "מכבי" },
  { value: "מאוחדת", label: "מאוחדת" },
  { value: "לאומית", label: "לאומית" },
  { value: "אחר", label: "אחר" }
];

