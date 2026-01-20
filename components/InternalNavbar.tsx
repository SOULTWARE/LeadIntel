'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Search, Database, User } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { useInternalLayoutOptional } from '@/components/InternalLayoutContext';
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
            href="/scraper"
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            New Scrape
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
      title: 'Intelligence Scraper',
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
    <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-6">
          <Link href="/" className="font-extrabold text-2xl tracking-tighter text-blue-600 hover:opacity-80 transition-opacity">
            LeadIntel<span className="text-slate-900">Pro</span>
          </Link>
          <div className="h-6 w-px bg-slate-200" />
          <div className="text-slate-500 font-medium text-sm tracking-tight flex items-center gap-2">
            {resolvedNav.icon}
            {resolvedNav.title}
          </div>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          {resolvedNav.rightAction}
          {user === undefined ? (
            <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" aria-hidden="true" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm hover:ring-4 hover:ring-slate-100 transition-all shadow-lg shadow-slate-200"
              >
                {getInitials(getDisplayName(user))}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden py-1">
                  <div className="px-4 py-3 border-b border-slate-50">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Signed in as</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{getDisplayName(user)}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="w-full px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left text-sm font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer"
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
    </nav>
  );
}
