'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ElementType } from 'react';
import { ArrowRight, BarChart3, Bell, ChevronDown, ChevronLeft, ChevronRight, CreditCard, LogOut, Search, User, Zap } from 'lucide-react';
import { toast } from 'sonner';
import type { User as SupabaseUser } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/client';

export const internalNavigation = [
  {
    href: '/results',
    label: 'Dashboard',
    description: 'Sessions and exports',
    icon: BarChart3,
  },
  {
    href: '/sourcer',
    label: 'Sourcing Studio',
    description: 'Launch searches and enrich data',
    icon: Search,
  },
] satisfies Array<{
  href: string;
  label: string;
  description: string;
  icon: ElementType;
}>;

const profileNavigation = [
  {
    href: '/profile',
    label: 'Overview',
    description: 'Account summary and details',
    icon: User,
  },
  {
    href: '/profile#usage',
    label: 'Usage',
    description: 'Credits and limits',
    icon: BarChart3,
  },
  {
    href: '/profile#billing',
    label: 'Billing',
    description: 'Plan and invoices',
    icon: CreditCard,
  },
  {
    href: '/profile#notifications',
    label: 'Notifications',
    description: 'Alerts and updates',
    icon: Bell,
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

function getDisplayName(user: SupabaseUser | null) {
  if (!user) return '';
  const metaName =
    (user.user_metadata?.full_name as string | undefined) || (user.user_metadata?.name as string | undefined) || '';
  return metaName.trim() || user.email || '';
}

function getInitials(display: string) {
  if (!display) return 'U';
  const parts = display.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

export default function InternalSidebar() {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<SupabaseUser | null | undefined>(undefined);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, [supabase]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncHash = () => setCurrentHash(window.location.hash || '');

    syncHash();
    window.addEventListener('hashchange', syncHash);

    return () => {
      window.removeEventListener('hashchange', syncHash);
    };
  }, [pathname]);

  const displayName = getDisplayName(user ?? null);
  const initials = getInitials(displayName);
  const isProfileRoute = pathname?.startsWith('/profile') ?? false;
  const isProfileSectionOpen = profileOpen || isProfileRoute;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      setUser(null);
      setUserMenuOpen(false);
      window.location.href = '/login';
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error logging out');
    }
  };

  return (
    <aside className="w-full shrink-0 p-4 lg:w-[320px] lg:p-4">
      <div
        className={`flex h-full w-full flex-col overflow-hidden rounded-[2rem] border border-slate-800/70 bg-slate-950 text-white shadow-[0_40px_120px_-40px_rgba(2,6,23,0.75)] transition-all duration-300 ${
          isCollapsed ? 'lg:w-[112px]' : 'lg:w-[320px]'
        }`}
      >
        <div className="border-b border-white/10 px-4 py-4 lg:px-5">
          <div className="flex items-start gap-3">
            <Link
              href="/"
              className={`flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 transition hover:bg-white/10 ${
                isCollapsed ? 'lg:justify-center lg:px-3' : ''
              }`}
              aria-label="Go to homepage"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 text-white shadow-lg shadow-blue-500/20">
                <Zap className="h-6 w-6" fill="currentColor" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-lg font-black tracking-tight text-white">
                    LeadIntel<span className="text-blue-400">Pro</span>
                  </p>
                  <p className="text-xs font-medium text-slate-400">Lead intelligence workspace</p>
                </div>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setIsCollapsed((value) => !value)}
              className="ml-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 lg:px-4">
          <div className="space-y-5">
            <div>
              <div className={`px-2 text-[10px] font-black uppercase tracking-[0.35em] text-slate-500 ${isCollapsed ? 'sr-only' : ''}`}>
                Workspace
              </div>
              <nav className="mt-3 space-y-2">
                {internalNavigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActivePath(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      className={`group flex items-center gap-3 rounded-2xl border transition-all ${
                        active
                          ? 'border-blue-400/30 bg-white/10 text-white shadow-lg shadow-blue-500/10'
                          : 'border-transparent bg-white/[0.03] text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white'
                      } ${isCollapsed ? 'justify-center px-3 py-3' : 'px-4 py-4'}`}
                    >
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all ${
                          active
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-white/5 text-slate-300 group-hover:bg-white/10 group-hover:text-white'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      {!isCollapsed && (
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-bold tracking-tight">{item.label}</span>
                            <ArrowRight
                              className={`h-4 w-4 transition-transform ${active ? 'translate-x-0 text-blue-300' : 'text-slate-500 group-hover:translate-x-1 group-hover:text-white'}`}
                            />
                          </div>
                          <p className={`mt-1 text-xs leading-relaxed ${active ? 'text-slate-300' : 'text-slate-500 group-hover:text-slate-400'}`}>
                            {item.description}
                          </p>
                        </div>
                      )}
                    </Link>
                  );
                })}

                <div className={`rounded-2xl border border-white/10 bg-white/[0.03] ${isCollapsed ? 'px-2 py-2' : 'px-3 py-3'}`}>
                  <button
                    type="button"
                    onClick={() => setProfileOpen((value) => !value)}
                    aria-expanded={profileOpen}
                    className={`flex w-full items-center gap-3 rounded-2xl text-left transition-all ${
                      isProfileSectionOpen
                        ? 'bg-white/10 text-white'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    } ${isCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-3'}`}
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all ${
                        isProfileSectionOpen
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20'
                          : 'bg-white/5 text-slate-300 group-hover:bg-white/10 group-hover:text-white'
                      }`}
                    >
                      <User className="h-5 w-5" />
                    </div>
                    {!isCollapsed && (
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-bold tracking-tight">Profile</span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isProfileSectionOpen ? 'rotate-180' : ''}`} />
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">Billing, credits, and account settings</p>
                      </div>
                    )}
                  </button>

                  {isProfileSectionOpen && !isCollapsed ? (
                    <div className="mt-2 space-y-2">
                      {profileNavigation.map((item) => {
                        const Icon = item.icon;
                        const hashTarget = item.href.includes('#') ? `#${item.href.split('#')[1]}` : '';
                        const active =
                          isProfileRoute &&
                          (item.href === '/profile'
                            ? currentHash === '' || currentHash === '#profile'
                            : currentHash === hashTarget);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setUserMenuOpen(false)}
                            className={`group flex items-center gap-3 rounded-2xl border px-3 py-3 transition-all ${
                              active
                                ? 'border-blue-400/20 bg-white/10 text-white shadow-lg shadow-blue-500/10'
                                : 'border-transparent bg-white/[0.03] text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
                                active ? 'bg-white/15 text-white' : 'bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white'
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-bold tracking-tight">{item.label}</div>
                              <div className="text-[11px] leading-relaxed text-slate-500">{item.description}</div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </nav>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 p-4 lg:p-4">
          {user === undefined ? (
            <div className="flex items-center gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <div className="h-11 w-11 animate-pulse rounded-2xl bg-white/10" aria-hidden="true" />
              {!isCollapsed && (
                <div className="space-y-2">
                  <div className="h-3 w-28 animate-pulse rounded-full bg-white/10" />
                  <div className="h-2.5 w-36 animate-pulse rounded-full bg-white/10" />
                </div>
              )}
            </div>
          ) : user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((value) => !value)}
                className={`flex w-full items-center gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10 ${
                  isCollapsed ? 'justify-center' : ''
                }`}
                aria-expanded={userMenuOpen}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white shadow-lg shadow-slate-900/20">
                  {initials}
                </div>
                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-white">{displayName}</p>
                    <p className="truncate text-xs text-slate-400">{user.email}</p>
                  </div>
                )}
                {!isCollapsed && <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />}
              </button>

              {userMenuOpen && (
                <div
                  className={`absolute z-20 overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950 shadow-[0_24px_80px_-30px_rgba(2,6,23,0.85)] ${
                    isCollapsed ? 'bottom-0 left-full ml-3 w-56' : 'bottom-16 left-0 right-0'
                  }`}
                >
                  <div className="border-b border-white/10 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500">Signed in as</p>
                    <p className="truncate text-sm font-bold text-white">{displayName}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setProfileOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-slate-200 transition-colors hover:bg-white/5"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-bold text-rose-400 transition-colors hover:bg-rose-500/10"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className={`flex items-center justify-center gap-2 rounded-[1.5rem] border border-blue-400/20 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/10 transition-transform hover:-translate-y-0.5 ${
                isCollapsed ? 'px-4' : ''
              }`}
            >
              <ArrowRight className="h-4 w-4" />
              {!isCollapsed && <span>Get Started</span>}
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
