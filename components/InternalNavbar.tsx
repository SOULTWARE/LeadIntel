'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Search, Database, User } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { useInternalLayoutOptional } from '@/components/InternalLayoutContext';
import { internalNavigation } from '@/components/InternalSidebar';
import { toast } from 'sonner';
import type { User as SupabaseUser } from '@supabase/supabase-js';

type NavbarConfig = {
  title: string;
  icon: ReactNode;
  rightAction?: ReactNode;
};

export default function InternalNavbar() {
  const [user, setUser] = useState<SupabaseUser | null | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const layout = useInternalLayoutOptional();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, [supabase]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      setMenuOpen(false);
      // no router.push to avoid layout mismatch; rely on downstream guards
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error logging out');
    }
  };

  const getDisplayName = (u: SupabaseUser | null) => {
    if (!u) return '';
    const metaName =
      (u.user_metadata?.full_name as string | undefined) || (u.user_metadata?.name as string | undefined) || '';
    return metaName.trim() || u.email || '';
  };

  const getInitials = (display: string) => {
    if (!display) return 'U';
    const parts = display.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
  };

  const navConfig = useMemo<NavbarConfig>(() => {
    if (pathname?.startsWith('/results')) {
      return {
        title: 'Qualified Leads Intelligence',
        icon: <Database className="w-4 h-4" />,
        rightAction: (
          <Link
            href="/sourcer"
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            New Search
          </Link>
        ),
      };
    }

    if (pathname?.startsWith('/profile')) {
      return {
        title: 'Profile',
        icon: <User className="w-4 h-4" />,
      };
    }

    return {
      title: 'Data Sourcing',
      icon: <Search className="w-4 h-4" />,
      rightAction: (
        <Link
          href="/results"
          className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-slate-50"
        >
          Dashboard
        </Link>
      ),
    };
  }, [pathname]);

  const resolvedNav: NavbarConfig = useMemo(() => {
    if (!layout?.title) return navConfig;

    return {
      title: layout.title,
      icon: layout.icon ?? navConfig.icon,
      rightAction: layout.rightSlot ?? navConfig.rightAction,
    };
  }, [layout, navConfig]);

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 md:px-6">
      <div className="mx-auto w-full max-w-[1680px] rounded-[1.75rem] border border-white/70 bg-white/80 backdrop-blur-2xl shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-4 px-4 py-4 lg:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3 md:gap-4">
              <Link href="/" className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-3 py-2 shadow-sm transition-transform hover:-translate-y-0.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20">
                  <Search className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-black tracking-tight text-slate-900">
                    LeadIntel<span className="text-blue-600">Pro</span>
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Intelligence workspace</div>
                </div>
              </Link>

              <div className="hidden min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                  {resolvedNav.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Current view</div>
                  <div className="truncate text-sm font-black text-slate-900">{resolvedNav.title}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4">
              <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 lg:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Premium mode
              </div>
              {resolvedNav.rightAction}
              {user === undefined ? (
                <div className="h-11 w-11 rounded-full bg-slate-200 animate-pulse" aria-hidden="true" />
              ) : user ? (
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white shadow-lg shadow-slate-900/15 transition-transform hover:-translate-y-0.5"
                  >
                    {getInitials(getDisplayName(user))}
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-14 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/50">
                      <div className="border-b border-slate-100 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Signed in as</p>
                        <p className="truncate text-sm font-bold text-slate-900">{getDisplayName(user)}</p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-bold text-rose-500 transition-colors hover:bg-rose-50"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden">
            {internalNavigation.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                    active
                      ? 'border-blue-200 bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
