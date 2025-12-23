import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <header className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-8 py-10">
          <h1 className="text-4xl font-black tracking-tight text-slate-800 mb-2">Lead Intel <span className="text-blue-600">Pro</span></h1>
          <p className="text-slate-500 text-lg">High-precision lead generation via Google Maps & AI Enhancement.</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800 leading-tight">
              Gather high-quality leads in <span className="text-blue-600 underline decoration-blue-200 underline-offset-4">seconds</span>.
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Don't waste time on irrelevant prospects. Our system scrapes live data from Google Maps and use advanced AI to verify if they actually need your services.
            </p>
            <div className="flex gap-4 pt-4">
              <Link
                href="/scraper"
                className="inline-flex items-center px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 hover:-translate-y-1"
              >
                Launch Scraper ✨
              </Link>
              <Link
                href="/results"
                className="inline-flex items-center px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all hover:-translate-y-1"
              >
                View Results 📂
              </Link>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 shadow-inner">
             <div className="space-y-4">
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                   <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold">1</div>
                   <div>
                      <div className="font-bold text-slate-800 text-sm">Target Locations</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Search anywhere on Earth</div>
                   </div>
                </div>
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100 translate-x-4">
                   <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold">2</div>
                   <div>
                      <div className="font-bold text-slate-800 text-sm">AI Compatibility Check</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Verify needs before contact</div>
                </div>
                </div>
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100 translate-x-8">
                   <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 font-bold">3</div>
                   <div>
                      <div className="font-bold text-slate-800 text-sm">Actionable Outreach</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Close more deals faster</div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* How It Works Grid */}
        <section className="border-t border-slate-100 pt-16">
          <h3 className="text-xl font-black uppercase tracking-widest text-slate-400 mb-10 text-center">The Workflow</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-2xl font-bold text-slate-800 mb-3">01 Scrape</div>
              <p className="text-slate-500 text-sm text-balance">Extract rich business data directly from Google Maps with deep precision.</p>
            </div>
            <div className="p-8 bg-blue-50 rounded-2xl border border-blue-100 scale-105 shadow-xl shadow-blue-50">
              <div className="text-2xl font-bold text-blue-700 mb-3">02 Enhance ✨</div>
              <p className="text-blue-600/70 text-sm text-balance">AI analyzes leads against your specific business goals and contact purpose.</p>
            </div>
            <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-2xl font-bold text-slate-800 mb-3">03 Identify</div>
              <p className="text-slate-500 text-sm text-balance">Uncover key problems and pain points for each business automatically.</p>
            </div>
            <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-2xl font-bold text-slate-800 mb-3">04 Outreach</div>
              <p className="text-slate-500 text-sm text-balance">Start conversations with high-confidence leads that actually need you.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-32 border-t border-slate-100 py-12 text-center text-slate-400 text-xs font-medium uppercase tracking-[0.2em]">
        © 2025 Lead Intel Pro • Built for Growth
      </footer>
    </div>
  );
}
