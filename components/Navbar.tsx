'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Zap, LogOut } from 'lucide-react';
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
    <header className="relative z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Zap size={24} fill="currentColor" />
          </div>
          <Link href="/" className="text-2xl font-extrabold tracking-tighter text-slate-900">
            LeadIntel<span className="text-blue-600">Pro</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {user ? (
            <>
              <Link href="/scraper" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Scraper</Link>
              <Link href="/results" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Dashboard</Link>

              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm hover:ring-4 hover:ring-slate-100 transition-all shadow-xl shadow-slate-200"
                >
                  {getInitials(getDisplayName(user))}
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 top-14 w-48 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden py-1">
                    <div className="px-4 py-3 border-b border-slate-50">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{getDisplayName(user)}</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setIsMenuOpen(false)}
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
            </>
          ) : (
            <>
              <Link href="/pricing" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Pricing</Link>
              <Link
                href="/login"
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
