"use client";

import { useEffect, useMemo, useState } from "react";
import type { AIAnalysisResult } from "@/services/aiEnhanceService";
import {
  collectExportableBatchIds,
  markBatchesExported,
} from "@/lib/leads/exportTracking";
import {
  buildPortfolioGuidance,
  getQualityStrictnessProfile,
  summarizeLeadPortfolio,
} from "@/lib/leads/portfolio";
import { createBatchPlan as planBatches } from "@/lib/leads/batching";
import type { LeadWithRelations } from "@/lib/leads/types";
import { computeLeadQualityScore } from "@/lib/leads/insights";
import { toast } from "sonner";
import { LeadsListToolbar } from "./leads-list/LeadsListToolbar";
import { LeadsTable } from "./leads-list/LeadsTable";
import { LeadDetailDrawer } from "./leads-list/LeadDetailDrawer";
import { createLeadsCsv } from "./leads-list/createLeadsCsv";

type EnhancedLeadResult = {
  id?: string;
  placeId?: string | null;
  aiAnalysis?: AIAnalysisResult | null;
};

type OutreachSignal = "linkedin" | "content" | "warm_intro";
type AnalyticsMetric =
  | "sentCount"
  | "openCount"
  | "clickCount"
  | "responseCount"
  | "bounceCount";

export default function LeadsList({
  initialLeads,
}: {
  initialLeads: LeadWithRelations[];
}) {
  const [leads, setLeads] = useState<LeadWithRelations[]>(initialLeads);
  const [selectedLead, setSelectedLead] = useState<LeadWithRelations | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isFindingBatch, setIsFindingBatch] = useState(false);
  const [isBuildingBatches, setIsBuildingBatches] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [leadPurpose, setLeadPurpose] = useState(
    initialLeads[0]?.searchQuery || "",
  );
  const [qualityFloor, setQualityFloor] = useState(0);
  const [qualityStrictness, setQualityStrictness] = useState(60);
  const [batchSize, setBatchSize] = useState(20);
  const [requireVerified, setRequireVerified] = useState(true);
  const [requireDecisionMaker, setRequireDecisionMaker] = useState(true);
  const [requireWarmup, setRequireWarmup] = useState(false);
  const [activeDetailAction, setActiveDetailAction] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setLeads(initialLeads);
    setSelectedIds(new Set());
    setLeadPurpose(initialLeads[0]?.searchQuery || "");
  }, [initialLeads]);

  const syncLeadState = (
    leadId: string,
    updater: (lead: LeadWithRelations) => LeadWithRelations,
  ) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === leadId ? updater(lead) : lead)),
    );
    setSelectedLead((prev) =>
      prev && prev.id === leadId ? updater(prev) : prev,
    );
  };

  const handleFindEmailsBatch = async () => {
    if (selectedIds.size === 0) {
      toast.error("Please select leads to find emails for");
      return;
    }

    setIsFindingBatch(true);
    const leadIds = Array.from(selectedIds);

    try {
      const response = await fetch("/api/leads/find-emails-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds }),
      });

      const data = await response.json();

      if (data.success) {
        const queuedCount =
          typeof data?.data?.queuedCount === "number"
            ? data.data.queuedCount
            : 0;
        toast.success(`Email discovery queued for ${queuedCount} leads.`);
        toast.info("Refresh in a moment to see updated contacts.");
      } else {
        toast.error(data.error || "Batch discovery failed.");
      }
    } catch {
      toast.error("Error during batch discovery.");
    } finally {
      setIsFindingBatch(false);
    }
  };

  const generateEmail = async (lead: LeadWithRelations) => {
    setIsGeneratingEmail(true);
    try {
      const response = await fetch("/api/generate/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({ lead, leadPurpose: lead.searchQuery || "" }),
      });
      const data = await response.json();
      if (data.success && data.data?.subject && data.data?.body) {
        const generatedAt = data.data.generatedAt
          ? new Date(data.data.generatedAt)
          : new Date();

        syncLeadState(lead.id, (item) => ({
          ...item,
          emailDraftSubject: data.data.subject,
          emailDraftBody: data.data.body,
          emailDraftGeneratedAt: generatedAt,
        }));

        toast.success("Personalized draft ready!");
      } else {
        toast.error("Failed to generate draft.");
      }
    } catch {
      toast.error("Error generating email.");
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const handleToggleOutreachSignal = async (
    lead: LeadWithRelations,
    signal: OutreachSignal,
    active: boolean,
  ) => {
    const actionKey = `signal:${signal}`;
    setActiveDetailAction(actionKey);
    try {
      const response = await fetch(`/api/leads/${lead.id}/outreach-prep`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signal, active }),
      });
      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || "Failed to update outreach prep");
        return;
      }

      syncLeadState(lead.id, (item) => ({
        ...item,
        linkedinTouchedAt: data.data.linkedinTouchedAt
          ? new Date(data.data.linkedinTouchedAt)
          : null,
        contentEngagedAt: data.data.contentEngagedAt
          ? new Date(data.data.contentEngagedAt)
          : null,
        warmIntroRequestedAt: data.data.warmIntroRequestedAt
          ? new Date(data.data.warmIntroRequestedAt)
          : null,
        warmupScore: data.data.warmupScore,
        qualityScore: data.data.qualityScore,
        warmupSignals: data.data.warmupSignals,
      }));

      toast.success("Outreach prep updated.");
    } catch {
      toast.error("Error updating outreach prep.");
    } finally {
      setActiveDetailAction(null);
    }
  };

  const handleAdjustMetric = async (
    lead: LeadWithRelations,
    metric: AnalyticsMetric,
    operation: "increment" | "decrement" = "increment",
  ) => {
    const actionKey = `metric:${metric}:${operation}`;
    setActiveDetailAction(actionKey);
    try {
      const response = await fetch(`/api/leads/${lead.id}/analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metric, operation }),
      });
      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || "Failed to update analytics");
        return;
      }

      syncLeadState(lead.id, (item) => ({
        ...item,
        sentCount: data.data.sentCount,
        openCount: data.data.openCount,
        clickCount: data.data.clickCount,
        responseCount: data.data.responseCount,
        bounceCount: data.data.bounceCount,
      }));
    } catch {
      toast.error("Error updating analytics.");
    } finally {
      setActiveDetailAction(null);
    }
  };

  const handleSelectPrimaryContact = async (
    lead: LeadWithRelations,
    contactId: string,
  ) => {
    const actionKey = `contact:${contactId}:primary`;
    setActiveDetailAction(actionKey);
    try {
      const response = await fetch(`/api/contacts/${contactId}/primary`, {
        method: "POST",
      });
      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || "Failed to select primary contact");
        return;
      }

      syncLeadState(lead.id, (item) => {
        const nextContacts = item.contacts.map((contact) => ({
          ...contact,
          isPrimary: contact.id === contactId,
        }));
        const primaryContact =
          nextContacts.find((contact) => contact.id === contactId) || null;

        return {
          ...item,
          contacts: nextContacts,
          primaryContact,
          primaryContactId: primaryContact?.id || null,
          email: primaryContact?.email || item.email,
          emailVerificationStatus:
            primaryContact?.emailVerificationStatus ||
            item.emailVerificationStatus,
          emailVerifiedAt:
            primaryContact?.emailVerifiedAt || item.emailVerifiedAt,
          emailVerificationProvider:
            primaryContact?.emailVerificationProvider ||
            item.emailVerificationProvider,
          primaryDecisionMakerRole:
            primaryContact?.roleTitle || item.primaryDecisionMakerRole,
        };
      });

      toast.success("Primary contact updated.");
    } catch {
      toast.error("Error selecting primary contact.");
    } finally {
      setActiveDetailAction(null);
    }
  };

  const copyToClipboard = () => {
    if (!currentDraft) return;
    const text = `Subject: ${currentDraft.subject}\n\n${currentDraft.body}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const currentDraft =
    selectedLead?.emailDraftSubject && selectedLead?.emailDraftBody
      ? {
          subject: selectedLead.emailDraftSubject,
          body: selectedLead.emailDraftBody,
        }
      : null;

  const filteredLeads = leads.filter((lead) => {
    const haystacks = [
      lead.name,
      lead.type || "",
      lead.address || "",
      lead.company?.industry || "",
      lead.company?.companySize || "",
      lead.company?.revenueRange || "",
      lead.campaign?.name || "",
      lead.primaryDecisionMakerRole || "",
      lead.primaryContact?.fullName || "",
      lead.primaryContact?.roleTitle || "",
      ...lead.contacts.flatMap((contact) => [
        contact.email,
        contact.fullName || "",
        contact.roleTitle || "",
      ]),
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = haystacks.includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || lead.recommendation === filterStatus;
    const matchesQuality = (lead.qualityScore || 0) >= qualityFloor;

    return matchesSearch && matchesFilter && matchesQuality;
  });

  const filteredPortfolio = useMemo(
    () => summarizeLeadPortfolio(filteredLeads),
    [filteredLeads],
  );
  const selectedLeads = useMemo(
    () => leads.filter((lead) => selectedIds.has(lead.id)),
    [leads, selectedIds],
  );
  const batchPreview = useMemo(
    () =>
      planBatches(selectedLeads, {
        maxLeadsPerBatch: batchSize,
        minQualityScore: qualityFloor,
        requireVerified,
        requireDecisionMaker,
        requireWarmup,
      }),
    [
      batchSize,
      qualityFloor,
      requireDecisionMaker,
      requireVerified,
      requireWarmup,
      selectedLeads,
    ],
  );
  const strictnessProfile = useMemo(
    () => getQualityStrictnessProfile(qualityStrictness),
    [qualityStrictness],
  );
  const portfolioGuidance = useMemo(
    () =>
      buildPortfolioGuidance({
        totalCount: leads.length,
        visibleCount: filteredLeads.length,
        qualityFloor,
        qualityStrictness,
        readyCount: filteredPortfolio.readyCount,
        bounceRate: filteredPortfolio.bounceRate,
        responseRate: filteredPortfolio.responseRate,
      }),
    [
      filteredLeads.length,
      filteredPortfolio.bounceRate,
      filteredPortfolio.readyCount,
      filteredPortfolio.responseRate,
      leads.length,
      qualityFloor,
      qualityStrictness,
    ],
  );

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map((lead) => lead.id)));
    }
  };

  const toggleSelectLead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleExport = async () => {
    const leadsToExport = leads.filter((lead) => selectedIds.has(lead.id));
    if (leadsToExport.length === 0) {
      toast.error("Please select leads to export");
      return;
    }

    const csvContent = createLeadsCsv(leadsToExport);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `lead-intel-export-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    try {
      await markBatchesExported(collectExportableBatchIds(leadsToExport));
    } catch {}

    toast.success(`Exported ${leadsToExport.length} leads`);
  };

  const handleBuildBatches = async () => {
    if (selectedIds.size === 0) {
      toast.error("Please select leads to batch");
      return;
    }

    setIsBuildingBatches(true);
    try {
      const response = await fetch("/api/batches/auto-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadIds: Array.from(selectedIds),
          maxLeadsPerBatch: batchSize,
          minQualityScore: qualityFloor,
          requireVerified,
          requireDecisionMaker,
          requireWarmup,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || "Failed to build batches");
        return;
      }

      const createdBatches = Array.isArray(data.data?.batches)
        ? data.data.batches
        : [];
      const batchByLeadId = new Map<string, (typeof createdBatches)[number]>();

      for (const batch of createdBatches) {
        const leadIds = Array.isArray(batch.leadIds) ? batch.leadIds : [];
        for (const leadId of leadIds) {
          if (typeof leadId === "string") {
            batchByLeadId.set(leadId, batch);
          }
        }
      }

      if (batchByLeadId.size > 0) {
        setLeads((prev) =>
          prev.map((lead) => {
            const batch = batchByLeadId.get(lead.id);
            if (!batch) return lead;
            return {
              ...lead,
              batchId: batch.id,
              batch: {
                id: batch.id,
                createdAt: new Date(batch.createdAt),
                updatedAt: new Date(batch.updatedAt),
                userId: batch.userId,
                name: batch.name,
                code: batch.code,
                status: batch.status,
                maxLeads: batch.maxLeads,
                campaignId: batch.campaignId,
              },
            };
          }),
        );
        setSelectedLead((prev) => {
          if (!prev) return prev;
          const batch = batchByLeadId.get(prev.id);
          if (!batch) return prev;
          return {
            ...prev,
            batchId: batch.id,
            batch: {
              id: batch.id,
              createdAt: new Date(batch.createdAt),
              updatedAt: new Date(batch.updatedAt),
              userId: batch.userId,
              name: batch.name,
              code: batch.code,
              status: batch.status,
              maxLeads: batch.maxLeads,
              campaignId: batch.campaignId,
            },
          };
        });
      }

      const createdBatchCount = Number(data.data?.createdBatchCount || 0);
      const assignedLeadCount = Number(data.data?.assignedLeadCount || 0);
      const skippedCount = Number(data.data?.skippedCount || 0);

      if (createdBatchCount === 0) {
        toast.error("No new batches were created with the current rules.");
        return;
      }

      toast.success(
        `Built ${createdBatchCount} batch${createdBatchCount === 1 ? "" : "es"} for ${assignedLeadCount} lead${assignedLeadCount === 1 ? "" : "s"}.`,
      );
      if (skippedCount > 0) {
        toast.info(
          `${skippedCount} selected lead${skippedCount === 1 ? "" : "s"} were skipped by the batch rules.`,
        );
      }
    } catch {
      toast.error("Error building batches.");
    } finally {
      setIsBuildingBatches(false);
    }
  };

  const handleEnhanceSelected = async () => {
    if (selectedIds.size === 0) {
      toast.error("Please select leads to enhance");
      return;
    }

    if (!leadPurpose.trim()) {
      toast.error("Add a 'Contact Purpose' before running AI Enhance.");
      return;
    }

    const selectedLeads = leads.filter((lead) => selectedIds.has(lead.id));
    const pending = selectedLeads.filter((lead) => !lead.isEnhanced);

    if (pending.length === 0) {
      toast.success("All selected leads already include AI insights.");
      return;
    }

    setIsEnhancing(true);

    try {
      let queue = [...pending];

      while (queue.length > 0) {
        const batch = queue.slice(0, 10);
        const remainingAfterBatch = queue.length - batch.length;
        const toastId = toast.loading(
          `Analyzing ${batch.length} leads... (${remainingAfterBatch} remaining)`,
        );

        const response = await fetch("/api/enhance/batch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": crypto.randomUUID(),
          },
          body: JSON.stringify({
            leads: batch,
            leadPurpose: leadPurpose.trim(),
            qualityStrictness,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          toast.error(data.error || "AI enhancement failed.", { id: toastId });
          break;
        }

        const enhancedById = new Map<string, AIAnalysisResult>();
        const enhancedResults = (data?.data?.results ??
          []) as EnhancedLeadResult[];
        for (const result of enhancedResults) {
          if (!result) continue;
          const id =
            typeof result.id === "string"
              ? result.id
              : typeof result.placeId === "string"
                ? result.placeId
                : null;
          const analysis = result.aiAnalysis;
          if (!id || !analysis) continue;
          enhancedById.set(id, analysis);
        }

        setLeads((prev) =>
          prev.map((lead) => {
            const analysis = enhancedById.get(lead.id);
            if (!analysis) return lead;

            const qualityScore = computeLeadQualityScore({
              compatibilityScore: analysis.compatibilityScore,
              emailVerificationStatus: lead.emailVerificationStatus,
              warmupScore: lead.warmupScore,
              companyConfidence: analysis.companyProfile?.confidence,
              hasDecisionMakerRole:
                (analysis.decisionMakerRoles?.length || 0) > 0,
            });

            return {
              ...lead,
              isEnhanced: true,
              compatibilityScore:
                analysis.compatibilityScore ?? lead.compatibilityScore,
              qualityScore,
              recommendation: analysis.recommendation ?? lead.recommendation,
              reasoning: analysis.reasoning ?? lead.reasoning,
              identifiedProblems:
                analysis.identifiedProblems ?? lead.identifiedProblems,
              compatibilityHooks:
                analysis.compatibilityHooks ?? lead.compatibilityHooks,
              decisionMakerRoles:
                analysis.decisionMakerRoles ?? lead.decisionMakerRoles,
              primaryDecisionMakerRole:
                analysis.decisionMakerRoles?.[0] ||
                lead.primaryDecisionMakerRole,
              company: {
                ...lead.company,
                id: lead.company?.id || "",
                createdAt: lead.company?.createdAt || new Date(),
                updatedAt: new Date(),
                name: lead.company?.name || lead.name,
                normalizedName:
                  lead.company?.normalizedName || lead.name.toLowerCase(),
                domain: lead.company?.domain || null,
                websiteUrl: lead.company?.websiteUrl || lead.website || null,
                hqLocation:
                  analysis.companyProfile?.locationSummary ||
                  lead.company?.hqLocation ||
                  lead.address ||
                  null,
                employeeCountEstimate:
                  lead.company?.employeeCountEstimate || null,
                companySize:
                  analysis.companyProfile?.companySize ||
                  lead.company?.companySize ||
                  null,
                revenueRange:
                  analysis.companyProfile?.revenueRange ||
                  lead.company?.revenueRange ||
                  null,
                industry:
                  analysis.companyProfile?.industry ||
                  lead.company?.industry ||
                  lead.type ||
                  null,
                industryConfidence:
                  analysis.companyProfile?.confidence ||
                  lead.company?.industryConfidence ||
                  null,
                linkedinCompanyUrl: lead.company?.linkedinCompanyUrl || null,
                countryCode: lead.company?.countryCode || null,
                city: lead.company?.city || null,
                decisionMakerRoleHints:
                  analysis.decisionMakerRoles ||
                  lead.company?.decisionMakerRoleHints ||
                  [],
                lastEnrichedAt: new Date(),
                sourceJson: lead.company?.sourceJson || null,
              },
              warmupSignals: {
                linkedinTouched: Boolean(lead.linkedinTouchedAt),
                contentEngaged: Boolean(lead.contentEngagedAt),
                warmIntroRequested: Boolean(lead.warmIntroRequestedAt),
                suggestedTouches: analysis.outreachSignals || [],
              },
            };
          }),
        );

        toast.success(
          `Processed ${enhancedById.size} lead${enhancedById.size === 1 ? "" : "s"}.`,
          { id: toastId },
        );

        queue = queue.slice(batch.length);
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    } catch (error) {
      console.error("[LeadsList] AI enhance error:", error);
      toast.error("An error occurred while enhancing leads.");
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="space-y-8 relative">
      <LeadsListToolbar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        filterStatus={filterStatus}
        isFilterMenuOpen={isFilterMenuOpen}
        onToggleFilterMenu={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
        onCloseFilterMenu={() => setIsFilterMenuOpen(false)}
        onSelectFilterStatus={(status) => {
          setFilterStatus(status);
          setIsFilterMenuOpen(false);
        }}
        selectedCount={selectedIds.size}
        isFindingBatch={isFindingBatch}
        onFindEmailsBatch={handleFindEmailsBatch}
        onExport={handleExport}
        isBuildingBatches={isBuildingBatches}
        onBuildBatches={handleBuildBatches}
        leadPurpose={leadPurpose}
        onLeadPurposeChange={setLeadPurpose}
        onEnhanceSelected={handleEnhanceSelected}
        isEnhancing={isEnhancing}
        qualityFloor={qualityFloor}
        onQualityFloorChange={setQualityFloor}
        qualityStrictness={qualityStrictness}
        onQualityStrictnessChange={setQualityStrictness}
        totalLeadCount={leads.length}
        visibleLeadCount={filteredLeads.length}
        readyLeadCount={filteredPortfolio.readyCount}
        verifiedLeadCount={filteredPortfolio.verifiedCount}
        decisionMakerCount={filteredPortfolio.decisionMakerCount}
        strictnessProfile={strictnessProfile}
        guidance={portfolioGuidance}
        batchSize={batchSize}
        onBatchSizeChange={setBatchSize}
        requireVerified={requireVerified}
        onRequireVerifiedChange={setRequireVerified}
        requireDecisionMaker={requireDecisionMaker}
        onRequireDecisionMakerChange={setRequireDecisionMaker}
        requireWarmup={requireWarmup}
        onRequireWarmupChange={setRequireWarmup}
        batchPreviewLeadCount={batchPreview.eligibleLeads.length}
        batchPreviewBatchCount={batchPreview.batches.length}
        batchPreviewSkippedCount={batchPreview.skippedLeads.length}
      />

      <LeadsTable
        filteredLeads={filteredLeads}
        selectedIds={selectedIds}
        onSelectAll={toggleSelectAll}
        onToggleSelectLead={toggleSelectLead}
        onOpenLead={setSelectedLead}
      />

      <LeadDetailDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        emailDraft={currentDraft}
        isGeneratingEmail={isGeneratingEmail}
        onGenerateEmail={generateEmail}
        onCopyToClipboard={copyToClipboard}
        isCopied={isCopied}
        activeActionKey={activeDetailAction}
        onToggleOutreachSignal={handleToggleOutreachSignal}
        onAdjustMetric={handleAdjustMetric}
        onSelectPrimaryContact={handleSelectPrimaryContact}
      />
    </div>
  );
}
