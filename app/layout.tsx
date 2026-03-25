import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import PageTransition from "@/components/PageTransition";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import CreditBalanceBanner from "@/components/CreditBalanceBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "LeadIntel Pro - AI-Powered Lead Generation",
    template: "%s | LeadIntel Pro",
  },
  description:
    "Generate high-precision business leads from verified licensed data sources and enhance them with advanced AI compatibility verification.",
  keywords: [
    "lead generation",
    "licensed data",
    "ai lead verification",
    "business leads",
    "sales intelligence",
  ],
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "LeadIntel Pro - AI-Powered Lead Generation",
    description:
      "Verified business leads enriched with AI insights — sourced through licensed data providers and public business records.",
    url: "https://leadintelpro.com",
    siteName: "LeadIntel Pro",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LeadIntel Pro - AI-Powered Lead Generation",
    description:
      "Generate and enhance leads with AI and verified licensed data sources.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ServiceWorkerRegister />
        <Toaster position="top-right" richColors closeButton />
        <CreditBalanceBanner />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
