import { prisma } from "@/db";
import Link from "next/link";
import SessionDashboard from "@/components/SessionDashboard";
import { Search, Database, ChevronLeft } from "lucide-react";
import InternalLayoutSetter from "@/components/InternalLayoutSetter";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function getSessions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return prisma.session.findMany({
    where: {
      userId: user.id,
    },
    orderBy: { createdAt: "desc" },
    include: {
      leads: {
        include: {
          company: true,
          campaign: true,
          batch: true,
          contacts: true,
          primaryContact: true,
          events: {
            orderBy: {
              occurredAt: "desc",
            },
            take: 10,
          },
        },
      },
    },
  });
}

export default async function ResultsPage() {
  const sessions = await getSessions();
  const totalLeads = sessions.reduce((acc, s) => acc + s.leads.length, 0);

  return (
    <div className="space-y-8">
      <InternalLayoutSetter
        title="Qualified Leads Intelligence"
        icon={<Database className="w-4 h-4" />}
        rightSlot={
          <Link
            href="/sourcer"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition-transform hover:-translate-y-0.5"
          >
            <Search className="w-4 h-4" />
            New Search
          </Link>
        }
      />

      <section className="grid gap-6 rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.25)] lg:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-slate-400 transition-colors hover:text-blue-600 group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Return home
          </Link>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-blue-600">
              <Database className="h-4 w-4" />
              Intelligence Dashboard
            </div>
            <h3 className="max-w-3xl text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
              Review, refine, and export{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                qualified lead sessions
              </span>
              .
            </h3>
            <p className="max-w-2xl text-base leading-7 text-slate-500 md:text-lg">
              Manage your {sessions.length} sourcing sessions and {totalLeads}{" "}
              prospects from a cleaner, faster dashboard built for daily
              outreach work.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-900/10">
            <div className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
              Total Sessions
            </div>
            <div className="mt-3 text-4xl font-black tracking-tight">
              {sessions.length}
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Historical searches saved to your workspace.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-blue-100 bg-white p-5 shadow-lg shadow-blue-100/40">
            <div className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
              Total Prospects
            </div>
            <div className="mt-3 text-4xl font-black tracking-tight text-blue-600">
              {totalLeads}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Ready for enhancement, discovery, or export.
            </p>
          </div>
        </div>
      </section>

      <section>
        <SessionDashboard sessions={sessions} />
      </section>
    </div>
  );
}
