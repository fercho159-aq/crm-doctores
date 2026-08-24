import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NovaMedics — Expediente Clínico Electrónico",
  description: "Expediente clínico digital para consultorios, clínicas y hospitales en México. Cumple con la NOM-004-SSA3-2012.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
