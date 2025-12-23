import Link from 'next/link';
import { Check } from 'lucide-react';
import Navbar from '@/components/Navbar'; // Re-use navbar if possible, or just a simple header. Wait, the layout already includes Navbar.
// The root layout `app/layout.tsx` does NOT include Navbar.
// `app/(app)/layout.tsx` includes sidebar.
// `app/(marketing)/layout.tsx` includes Navbar.
// `app/pricing` is likely part of marketing. So I should put it in `app/(marketing)/pricing/page.tsx`.

// Plan: move `app/pricing/page.tsx` to `app/(marketing)/pricing/page.tsx` so it inherits the marketing layout (which has the Navbar).

export default function PricingPage() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-20">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">Simple, transparent pricing.</h1>
        <p className="text-xl text-slate-500">Choose the plan that fits your growth.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Starter */}
        <div className="p-8 rounded-3xl border border-slate-200 bg-white hover:shadow-xl transition-all">
          <div className="font-black text-xl mb-4">Starter</div>
          <div className="text-4xl font-black mb-6">$0<span className="text-lg text-slate-400 font-medium">/mo</span></div>
          <Link href="/login" className="block w-full py-3 rounded-xl bg-slate-100 text-slate-900 font-bold text-center hover:bg-slate-200 transition-colors">Start for Free</Link>
          <div className="mt-8 space-y-4">
            <Feature>100 Search Credits</Feature>
            <Feature>Basic Export</Feature>
            <Feature>Standard Support</Feature>
          </div>
        </div>

        {/* Pro */}
        <div className="p-8 rounded-3xl border-2 border-blue-600 bg-slate-900 text-white relative shadow-2xl shadow-blue-200">
          <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl uppercase tracking-wider">Popular</div>
          <div className="font-black text-xl mb-4">Pro</div>
          <div className="text-4xl font-black mb-6">$49<span className="text-lg text-slate-400 font-medium">/mo</span></div>
          <Link href="/login" className="block w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-center hover:bg-blue-500 transition-colors">Get Started</Link>
          <div className="mt-8 space-y-4">
            <Feature>Unlimited Search</Feature>
            <Feature>AI Enhancement</Feature>
            <Feature>Email Discovery</Feature>
            <Feature>Priority Support</Feature>
          </div>
        </div>

        {/* Enterprise */}
        <div className="p-8 rounded-3xl border border-slate-200 bg-white hover:shadow-xl transition-all">
          <div className="font-black text-xl mb-4">Enterprise</div>
          <div className="text-4xl font-black mb-6">Custom</div>
          <button className="block w-full py-3 rounded-xl bg-white border-2 border-slate-100 text-slate-900 font-bold text-center hover:bg-slate-50 transition-colors">Contact Sales</button>
          <div className="mt-8 space-y-4">
            <Feature>API Access</Feature>
            <Feature>Dedicated Server</Feature>
            <Feature>Custom Integrations</Feature>
          </div>
        </div>
      </div>
    </main>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-sm font-medium opacity-80">
      <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-600 flex items-center justify-center">
        <Check size={12} strokeWidth={3} />
      </div>
      {children}
    </div>
  );
}
