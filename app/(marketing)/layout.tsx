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
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] opacity-60" />
      </div>

      <Navbar user={user} />

      {children}

      <footer className="border-t border-slate-100 py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-10">
          <div className="flex items-center gap-2 grayscale brightness-50 opacity-50">
            <Zap size={20} fill="currentColor" />
            <span className="font-black tracking-tighter text-xl">LeadIntelPro</span>
          </div>
          <div className="text-slate-400 text-xs font-bold tracking-[0.2em] uppercase">
            © 2025 Lead Intel Pro • Performance Intelligence
          </div>
        </div>
      </footer>
    </div>
  );
}
