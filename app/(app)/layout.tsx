import InternalNavbar from '@/components/InternalNavbar';
import { InternalLayoutProvider } from '@/components/InternalLayoutContext';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <InternalLayoutProvider>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        <InternalNavbar />
        {children}
      </div>
    </InternalLayoutProvider>
  );
}
