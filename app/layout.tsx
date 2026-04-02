import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from 'next/font/google'
import "./globals.css";

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: "Travel YouTube Map",
  description: "Analyze YouTube travel videos with AI, extract visited places with timestamps, and display them on Google Maps",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-[#0f0f0f] text-[#e5e5e5]`}>
        {children}
      </body>
    </html>
  );
}
