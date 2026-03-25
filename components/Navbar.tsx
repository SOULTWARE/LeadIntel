'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, LogOut, Search, Sparkles, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface NavbarProps {
  user: SupabaseUser | null; // Using any for simplicity with Supabase user type, typically import User from @supabase/supabase-js
}

export default function Navbar({ user }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      router.refresh();
      setIsMenuOpen(false);
    } catch {
      toast.error('Error logging out');
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

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 md:px-6">
      <div className="mx-auto w-full max-w-[1680px] rounded-[1.75rem] border border-white/70 bg-white/80 backdrop-blur-2xl shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-4 px-4 py-4 lg:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <Link href="/" className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-3 py-2 shadow-sm transition-transform hover:-translate-y-0.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20">
                  <Zap size={24} fill="currentColor" />
                </div>
                <div>
                  <div className="text-lg font-black tracking-tight text-slate-900">
                    LeadIntel<span className="text-blue-600">Pro</span>
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Performance intelligence</div>
                </div>
              </Link>

              <div className="hidden items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-blue-600 md:flex">
                <Sparkles className="h-4 w-4" />
                Premium sourcing
              </div>
            </div>

            <nav className="hidden items-center gap-3 lg:flex">
              <Link href="/pricing" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:text-blue-600">
                Pricing
              </Link>
              <Link href="/about" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:text-blue-600">
                About
              </Link>
              <Link href="/contact" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:text-blue-600">
                Contact
              </Link>

              {user ? (
                <div className="ml-2 flex items-center gap-3">
                  <Link
                    href="/sourcer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition-transform hover:-translate-y-0.5"
                  >
                    <Search className="h-4 w-4" />
                    Workspace
                  </Link>
                  <div className="relative">
                    <button
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white shadow-lg shadow-slate-900/15 transition-transform hover:-translate-y-0.5"
                    >
                      {getInitials(getDisplayName(user))}
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 top-14 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/50">
                        <div className="border-b border-slate-100 px-4 py-3">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Signed in as</p>
                          <p className="truncate text-sm font-bold text-slate-900">{getDisplayName(user)}</p>
                        </div>
                        <Link
                          href="/results"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          <ChevronRight className="h-4 w-4" />
                          Dashboard
                        </Link>
                        <Link
                          href="/profile"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          <ChevronRight className="h-4 w-4" />
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
                </div>
              ) : (
                <div className="ml-2 flex items-center gap-3">
                  <Link href="/login" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition-transform hover:-translate-y-0.5">
                    Get Started
                  </Link>
                </div>
              )}
            </nav>

            <div className="flex items-center gap-3 lg:hidden">
              {user ? (
                <Link href="/sourcer" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/10">
                  <Search className="h-4 w-4" />
                  Workspace
                </Link>
              ) : (
                <Link href="/login" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/10">
                  Get Started
                </Link>
              )}
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {[
              { href: '/pricing', label: 'Pricing' },
              { href: '/about', label: 'About' },
              { href: '/contact', label: 'Contact' },
              ...(user ? [{ href: '/results', label: 'Dashboard' }, { href: '/profile', label: 'Profile' }] : []),
            ].map((item) => (
              <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-slate-500 transition-colors hover:border-blue-200 hover:text-blue-600">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
