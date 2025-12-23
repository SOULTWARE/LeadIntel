import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import PageTransition from "@/components/PageTransition";
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
  title: {
    default: "LeadIntel Pro - AI-Powered Lead Generation",
    template: "%s | LeadIntel Pro",
  },
  description: "Generate high-precision business leads from Google Maps and enhance them with advanced AI compatibility verification.",
  keywords: ["lead generation", "google maps scraper", "ai lead verification", "business leads", "sales intelligence"],
  openGraph: {
    title: "LeadIntel Pro - AI-Powered Lead Generation",
    description: "Turn Google Maps into your Growth Engine. Scrape and verify leads automatically.",
    url: "https://leadintelpro.com",
    siteName: "LeadIntel Pro",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LeadIntel Pro - AI-Powered Lead Generation",
    description: "Generate and enhance leads with AI and Google Maps.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster position="top-right" richColors closeButton />
        <PageTransition>
          {children}
        </PageTransition>
      </body>
    </html>
  );
}
