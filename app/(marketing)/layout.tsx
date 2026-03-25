import Link from "next/link";
import Navbar from "@/components/Navbar";
import BrandMark from "@/components/BrandMark";
import { createClient } from "@/lib/supabase/server";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen text-slate-900">
      <Navbar user={user} />

      <div>{children}</div>

      <footer className="mt-20 border-t border-slate-200 bg-white">
        <div className="page-shell grid gap-10 py-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <BrandMark />
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              LeadIntel Pro brings verified sourcing, AI qualification, and
              outreach preparation into one focused operating system for
              outbound teams.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "Verified sourcing",
                "AI enrichment",
                "Email discovery",
                "CSV exports",
              ].map((item) => (
                <span key={item} className="chip-muted">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <div className="space-y-3">
              <div className="section-label">Product</div>
              <div className="space-y-2 text-sm text-slate-600">
                <Link
                  href="/pricing"
                  className="block transition-colors hover:text-blue-700"
                >
                  Pricing
                </Link>
                <Link
                  href="/login"
                  className="block transition-colors hover:text-blue-700"
                >
                  Get Started
                </Link>
              </div>
            </div>
            <div className="space-y-3">
              <div className="section-label">Company</div>
              <div className="space-y-2 text-sm text-slate-600">
                <Link
                  href="/about"
                  className="block transition-colors hover:text-blue-700"
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className="block transition-colors hover:text-blue-700"
                >
                  Contact
                </Link>
              </div>
            </div>
            <div className="space-y-3">
              <div className="section-label">Legal</div>
              <div className="space-y-2 text-sm text-slate-600">
                <Link
                  href="/privacy"
                  className="block transition-colors hover:text-blue-700"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  className="block transition-colors hover:text-blue-700"
                >
                  Terms
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50">
          <div className="page-shell flex flex-col gap-4 py-4 text-xs uppercase tracking-[0.16em] text-slate-500 md:flex-row md:items-center md:justify-between">
            <div>© 2026 LeadIntel Pro</div>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/privacy"
                className="transition-colors hover:text-blue-700"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="transition-colors hover:text-blue-700"
              >
                Terms
              </Link>
              <Link
                href="/contact"
                className="transition-colors hover:text-blue-700"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
