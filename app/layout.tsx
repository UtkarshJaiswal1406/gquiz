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
  title: "GQuiz",
  description:
    "A quiz about Google Cloud SQL: managed relational databases and an introduction to Google Cloud SQL.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(66,133,244,0.16),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(234,67,53,0.12),_transparent_24%),linear-gradient(180deg,_#050814_0%,_#0a1020_100%)] font-sans text-slate-950">
        {children}
      </body>
    </html>
  );
}
