import "@/styles/globals.css";
import type { Metadata } from "next";
import { Heebo } from "next/font/google";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heebo",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Israel Air & Ambulance — מערכת שיבוץ",
  description: "מערכת שיבוץ קריאות — Israel Air & Ambulance"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="min-h-dvh font-sans [font-family:var(--font-heebo)]">
        {children}
      </body>
    </html>
  );
}

