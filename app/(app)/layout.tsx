import InternalSidebar from '@/components/InternalSidebar';
import { InternalLayoutProvider } from '@/components/InternalLayoutContext';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <InternalLayoutProvider>
      <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-900 font-sans">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-28 top-16 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto flex min-h-screen max-w-[1920px] flex-col lg:flex-row">
          <InternalSidebar />

          <div className="flex min-w-0 flex-1 flex-col">
            <main className="flex-1 overflow-y-auto px-4 pb-6 pt-4 md:px-6 md:pb-8 md:pt-4 lg:px-8 lg:pt-6">
              <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </InternalLayoutProvider>
  );
}
