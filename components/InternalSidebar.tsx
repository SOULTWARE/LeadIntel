'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ElementType } from 'react';
import { ArrowRight, BarChart3, Search, Sparkles, User, Zap } from 'lucide-react';

export const internalNavigation = [
  {
    href: '/results',
    label: 'Dashboard',
    description: 'Sessions, leads, and exports',
    icon: BarChart3,
  },
  {
    href: '/sourcer',
    label: 'Sourcing Studio',
    description: 'Launch searches and enrich data',
    icon: Search,
  },
  {
    href: '/profile',
    label: 'Profile',
    description: 'Billing, credits, and security',
    icon: User,
  },
] satisfies Array<{
  href: string;
  label: string;
  description: string;
  icon: ElementType;
}>;

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function InternalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block lg:w-[320px] shrink-0 p-4">
      <div className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[2rem] border border-slate-800/70 bg-slate-950 text-white shadow-[0_40px_120px_-40px_rgba(2,6,23,0.75)]">
        <div className="relative border-b border-white/10 px-6 py-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(99,102,241,0.16),_transparent_35%)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 text-white shadow-lg shadow-blue-500/20">
                <Zap className="h-6 w-6" fill="currentColor" />
              </div>
              <div>
                <p className="text-lg font-black tracking-tight text-white">LeadIntel<span className="text-blue-400">Pro</span></p>
                <p className="text-xs font-medium text-slate-400">Premium lead intelligence workspace</p>
              </div>
            </div>
            <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">
              Live
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-6">
            <div>
              <div className="px-2 text-[10px] font-black uppercase tracking-[0.35em] text-slate-500">Workspace</div>
              <nav className="mt-3 space-y-2">
                {internalNavigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActivePath(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center gap-3 rounded-2xl border px-4 py-4 transition-all ${
                        active
                          ? 'border-blue-400/30 bg-white/10 text-white shadow-lg shadow-blue-500/10'
                          : 'border-transparent bg-white/[0.03] text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                          active
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-white/5 text-slate-300 group-hover:bg-white/10 group-hover:text-white'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-bold tracking-tight">{item.label}</span>
                          <ArrowRight className={`h-4 w-4 transition-transform ${active ? 'translate-x-0 text-blue-300' : 'text-slate-500 group-hover:translate-x-1 group-hover:text-white'}`} />
                        </div>
                        <p className={`mt-1 text-xs leading-relaxed ${active ? 'text-slate-300' : 'text-slate-500 group-hover:text-slate-400'}`}>
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black tracking-tight text-white">Guided workflow</p>
                  <p className="text-xs text-slate-400">Source, enrich, and export without leaving the workspace.</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-xs font-medium text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  Hunter-first email discovery
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  Batch AI enhancement pipeline
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  CSV exports and saved sessions
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 p-4">
          <Link
            href="/sourcer"
            className="flex items-center justify-between rounded-[1.5rem] border border-blue-400/20 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/10 transition-transform hover:-translate-y-0.5"
          >
            <span>Start a new search</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
