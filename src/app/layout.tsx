import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

import { ChatProvider } from "@/contexts/ChatContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Engawa Cycle | 自律型AI会社 OS",
  description: "次世代の自律型マルチエージェント・ビジネス環境",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${inter.variable} ${outfit.variable}`}>
      <body className="antialiased overflow-hidden font-sans">
        <ChatProvider>
          {children}
        </ChatProvider>
      </body>
    </html>
  );
}
