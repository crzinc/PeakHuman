import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PeakHuman — Твоя пиковая версия",
  description: "Минималистичная OS для пиковой производительности. Трекер привычек, энергии, сна и фокуса. Стань лучшей версией себя — каждый день.",
  keywords: ["продуктивность", "привычки", "биохакинг", "трекер", "self-improvement"],
  authors: [{ name: "PeakHuman" }],
  openGraph: {
    title: "PeakHuman — Твоя пиковая версия",
    description: "Track. Optimize. Transcend.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#FCFCF9] text-[#0A0A0A]">
        {children}
      </body>
    </html>
  );
}
