import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MIT Medical Tower — Expediente Clínico",
  description: "Sistema CRM médico / Expediente Clínico Electrónico — MIT Medical Tower",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
