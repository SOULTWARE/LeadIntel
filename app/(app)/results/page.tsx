import { prisma } from "@/db";
import Link from "next/link";
import SessionDashboardRevamp from "@/components/SessionDashboardRevamp";
import { Search, Database, FolderClock, Target } from "lucide-react";
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
      leads: true,
    },
  });
}

export default async function ResultsPage() {
  const sessions = await getSessions();
  const totalLeads = sessions.reduce((acc, s) => acc + s.leads.length, 0);
  const latestSession = sessions[0];

  return (
    <div className="page-stack">
      <InternalLayoutSetter
        title="Saved lead sessions"
        icon={<Database className="w-4 h-4" />}
        rightSlot={
          <Link href="/sourcer" className="btn-primary">
            <Search className="w-4 h-4" />
            New Search
          </Link>
        }
      />

      <section className="surface grid gap-6 p-6 lg:grid-cols-[1.25fr_0.75fr] lg:p-8">
        <div className="space-y-5">
          <div className="eyebrow">
            <Database className="h-4 w-4" />
            Results dashboard
          </div>
          <div className="space-y-3">
            <h2 className="section-title">
              Review saved sourcing sessions, reopen work, and export qualified
              leads.
            </h2>
            <p className="section-copy max-w-3xl">
              The dashboard keeps historical sessions visible, makes it easy to
              reopen a run, and centralizes lead actions for enrichment, email
              discovery, and export.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="surface-muted p-4">
              <div className="section-label">Most recent session</div>
              <div className="mt-2 text-lg font-semibold text-slate-950">
                {latestSession?.name ?? "No sessions yet"}
              </div>
              <div className="mt-2 text-sm text-slate-600">
                {latestSession
                  ? `${latestSession.leads.length} lead${latestSession.leads.length === 1 ? "" : "s"} · ${new Date(latestSession.createdAt).toLocaleDateString()}`
                  : "Run a new sourcing search to populate the workspace."}
              </div>
            </div>
            <div className="surface-muted p-4">
              <div className="section-label">Workflow</div>
              <div className="mt-2 text-lg font-semibold text-slate-950">
                Session review to lead actions to export
              </div>
              <div className="mt-2 text-sm text-slate-600">
                Open any saved session to inspect lead details, trigger email
                discovery, run AI enhancement, or export selected rows.
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div className="metric-card bg-slate-950 text-white">
            <div className="metric-label text-slate-400">Sessions</div>
            <div className="metric-value text-white">{sessions.length}</div>
            <div className="metric-copy text-slate-400">
              Saved searches in your workspace.
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Prospects</div>
            <div className="metric-value text-blue-700">{totalLeads}</div>
            <div className="metric-copy">
              Saved leads ready for follow-up work.
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Coverage</div>
            <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-slate-950">
              <FolderClock className="h-5 w-5 text-slate-500" />
              Historical visibility
            </div>
            <div className="metric-copy">
              Reopen old sessions without rerunning the search.
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="surface p-4">
          <div className="section-label">Step 1</div>
          <div className="mt-2 flex items-center gap-2 text-base font-semibold text-slate-950">
            <Search className="h-4 w-4 text-blue-700" />
            Run a search
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Create a sourcing session in the workspace and save the qualified
            results.
          </p>
        </div>
        <div className="surface p-4">
          <div className="section-label">Step 2</div>
          <div className="mt-2 flex items-center gap-2 text-base font-semibold text-slate-950">
            <Target className="h-4 w-4 text-blue-700" />
            Inspect saved leads
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Open a session, filter the lead table, and review details in the
            side drawer.
          </p>
        </div>
        <div className="surface p-4">
          <div className="section-label">Step 3</div>
          <div className="mt-2 flex items-center gap-2 text-base font-semibold text-slate-950">
            <Database className="h-4 w-4 text-blue-700" />
            Export or enrich
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Run follow-up actions like AI enhancement, email discovery, and CSV
            export.
          </p>
        </div>
      </section>

      <section>
        <SessionDashboardRevamp sessions={sessions} />
      </section>
    </div>
  );
}
