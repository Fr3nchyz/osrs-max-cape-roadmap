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
  title: "Max Cape Roadmap — fr3nchy",
  description: "OSRS Road to Max dashboard: live HiScores, efficient training methods, and time-to-max estimates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head><link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚔️</text></svg>" /></head>
      <body className="min-h-full flex flex-col">
        <a href="https://amaurymarque.com" aria-label="Back to amaurymarque.com" style={{ position: "fixed", top: 8, left: 8, zIndex: 9999, fontFamily: "ui-monospace,monospace", fontSize: "0.8rem", color: "#888", textDecoration: "none", opacity: 0.75 }}>← AM.</a>
        {children}
      </body>
    </html>
  );
}
