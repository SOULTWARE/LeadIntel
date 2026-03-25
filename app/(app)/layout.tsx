import InternalSidebar from "@/components/InternalSidebar";
import { InternalLayoutProvider } from "@/components/InternalLayoutContext";
import InternalNavbar from "@/components/InternalNavbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <InternalLayoutProvider>
      <div className="min-h-screen text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-[1920px] flex-col lg:flex-row">
          <InternalSidebar />

          <div className="flex min-w-0 flex-1 flex-col">
            <InternalNavbar />
            <main className="flex-1">
              <div className="page-shell py-6 md:py-8">
                <div className="page-stack">{children}</div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </InternalLayoutProvider>
  );
}
