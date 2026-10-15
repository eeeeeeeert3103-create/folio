import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { connection } from "next/server";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "Folio — портфолио для студентов", template: "%s · Folio" },
  description: "Соберите портфолио за вечер и отправьте работодателю одной ссылкой.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Страницы рендерятся на каждый запрос: только так Next.js проставит своим скриптам
  // свежий nonce из Content-Security-Policy (см. src/proxy.ts).
  await connection();

  return (
    <html lang="ru" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
