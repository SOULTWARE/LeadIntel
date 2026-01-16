'use client';

import { useEffect, useState, ReactNode } from 'react';
import Link from 'next/link';
import { LogOut, Zap } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface InternalNavbarProps {
  title: string;
  icon?: ReactNode;
  rightSlot?: ReactNode;
}

export default function InternalNavbar({ title, icon, rightSlot }: InternalNavbarProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
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

  const getInitials = (email: string) => email?.substring(0, 2).toUpperCase() || 'U';

  return (
    <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-6">
          <Link href="/" className="font-extrabold text-2xl tracking-tighter text-blue-600 hover:opacity-80 transition-opacity">
            LeadIntel<span className="text-slate-900">Pro</span>
          </Link>
          <div className="h-6 w-px bg-slate-200" />
          <div className="text-slate-500 font-medium text-sm tracking-tight flex items-center gap-2">
            {icon}
            {title}
          </div>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          {rightSlot}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm hover:ring-4 hover:ring-slate-100 transition-all shadow-lg shadow-slate-200"
              >
                {getInitials(user.email ?? '')}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden py-1">
                  <div className="px-4 py-3 border-b border-slate-50">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Signed in as</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{user.email ?? ''}</p>
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
          ) : (
            <Link
              href="/login"
              className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
