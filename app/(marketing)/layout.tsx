import Link from 'next/link';
import { Zap } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase/server';

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_22%),radial-gradient(circle_at_right,_rgba(99,102,241,0.12),_transparent_26%),linear-gradient(180deg,#f8fbff_0%,#eef2ff_40%,#ffffff_100%)] text-slate-900 font-sans">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-20 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
      </div>

      <Navbar user={user} />

      <div className="relative z-10">{children}</div>

      <footer className="relative z-10 mt-24 border-t border-white/70 bg-white/70 backdrop-blur-2xl">
        <div className="mx-auto w-full max-w-[1680px] px-6 py-14">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20">
                  <Zap size={22} fill="currentColor" />
                </div>
                <div>
                  <p className="text-xl font-black tracking-tight text-slate-900">LeadIntel<span className="text-blue-600">Pro</span></p>
                  <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">Performance intelligence</p>
                </div>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-500">
                A premium lead intelligence workspace for teams that need qualified sourcing, AI enrichment, and outreach readiness in one focused flow.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Verified sourcing', 'AI enrichment', 'Email discovery', 'Revenue-ready exports'].map((item) => (
                  <span key={item} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 shadow-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              <div>
                <h4 className="text-xs font-black uppercase tracking-[0.35em] text-slate-400 mb-4">Product</h4>
                <ul className="space-y-3">
                  <li>
                    <Link href="/pricing" className="text-sm font-semibold text-slate-600 transition-colors hover:text-blue-600">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="/login" className="text-sm font-semibold text-slate-600 transition-colors hover:text-blue-600">
                      Get Started
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase tracking-[0.35em] text-slate-400 mb-4">Company</h4>
                <ul className="space-y-3">
                  <li>
                    <Link href="/about" className="text-sm font-semibold text-slate-600 transition-colors hover:text-blue-600">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-sm font-semibold text-slate-600 transition-colors hover:text-blue-600">
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase tracking-[0.35em] text-slate-400 mb-4">Legal</h4>
                <ul className="space-y-3">
                  <li>
                    <Link href="/privacy" className="text-sm font-semibold text-slate-600 transition-colors hover:text-blue-600">
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="text-sm font-semibold text-slate-600 transition-colors hover:text-blue-600">
                      Terms
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-slate-200/80 pt-6 text-xs font-black uppercase tracking-[0.3em] text-slate-400 md:flex-row md:items-center md:justify-between">
            <div>© 2026 LeadIntelPro • Premium intelligence workspace</div>
            <div className="flex flex-wrap items-center gap-4 text-[10px] tracking-[0.25em]">
              <Link href="/privacy" className="transition-colors hover:text-blue-600">Privacy</Link>
              <Link href="/terms" className="transition-colors hover:text-blue-600">Terms</Link>
              <Link href="/contact" className="transition-colors hover:text-blue-600">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
