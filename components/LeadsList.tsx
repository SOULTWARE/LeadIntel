'use client';

import { useEffect, useState } from 'react';
import type { Lead } from '@prisma/client';
import { toast } from 'sonner';
import { LeadsListToolbar } from './leads-list/LeadsListToolbar';
import { LeadsTable } from './leads-list/LeadsTable';
import { LeadDetailDrawer } from './leads-list/LeadDetailDrawer';
import { createLeadsCsv } from './leads-list/createLeadsCsv';

export default function LeadsList({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const [isFindingBatch, setIsFindingBatch] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [leadPurpose, setLeadPurpose] = useState(initialLeads[0]?.searchQuery || '');

  useEffect(() => {
    setLeads(initialLeads);
    setSelectedIds(new Set());
    setLeadPurpose(initialLeads[0]?.searchQuery || '');
  }, [initialLeads]);

  const handleFindEmailsBatch = async () => {
    if (selectedIds.size === 0) {
      toast.error("Please select leads to find emails for");
      return;
    }

    setIsFindingBatch(true);
    const leadIds = Array.from(selectedIds);

    try {
      const response = await fetch('/api/leads/find-emails-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds }),
      });

      const data = await response.json();

      if (data.success) {
        const queuedCount = typeof data?.data?.queuedCount === 'number' ? data.data.queuedCount : 0;
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

  const generateEmail = async (lead: Lead) => {
    setIsGeneratingEmail(true);
    try {
      const response = await fetch('/api/generate/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ lead, leadPurpose: lead.searchQuery || '' }),
      });
      const data = await response.json();
      if (data.success && data.data?.subject && data.data?.body) {
        const generatedAt = data.data.generatedAt ? new Date(data.data.generatedAt) : new Date();

        setLeads((prev) =>
          prev.map((item) =>
            item.id === lead.id
              ? {
                  ...item,
                  emailDraftSubject: data.data.subject,
                  emailDraftBody: data.data.body,
                  emailDraftGeneratedAt: generatedAt,
                }
              : item
          )
        );

        setSelectedLead((prev) =>
          prev && prev.id === lead.id
            ? {
                ...prev,
                emailDraftSubject: data.data.subject,
                emailDraftBody: data.data.body,
                emailDraftGeneratedAt: generatedAt,
              }
            : prev
        );

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

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.address?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === 'all' || lead.recommendation === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map(l => l.id)));
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

  const handleExport = () => {
    const leadsToExport = leads.filter(l => selectedIds.has(l.id));
    if (leadsToExport.length === 0) {
      toast.error("Please select leads to export");
      return;
    }

    const csvContent = createLeadsCsv(leadsToExport);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `lead-intel-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${leadsToExport.length} leads`);
  };

  const handleEnhanceSelected = async () => {
    if (selectedIds.size === 0) {
      toast.error('Please select leads to enhance');
      return;
    }

    if (!leadPurpose.trim()) {
      toast.error("Add a 'Contact Purpose' before running AI Enhance.");
      return;
    }

    const selectedLeads = leads.filter(lead => selectedIds.has(lead.id));
    const pending = selectedLeads.filter(lead => !lead.isEnhanced);

    if (pending.length === 0) {
      toast.success('All selected leads already include AI insights.');
      return;
    }

    setIsEnhancing(true);

    try {
      let queue = [...pending];

      while (queue.length > 0) {
        const batch = queue.slice(0, 10);
        const remainingAfterBatch = queue.length - batch.length;
        const toastId = toast.loading(`Analyzing ${batch.length} leads... (${remainingAfterBatch} remaining)`);

        const response = await fetch('/api/enhance/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
          body: JSON.stringify({
            leads: batch,
            leadPurpose: leadPurpose.trim(),
          }),
        });

        const data = await response.json();

        if (!data.success) {
          toast.error(data.error || 'AI enhancement failed.', { id: toastId });
          break;
        }

        const enhancedById = new Map<string, any>();
        const enhancedResults = (data?.data?.results ?? []) as Array<Record<string, unknown>>;
        for (const result of enhancedResults) {
          if (!result) continue;
          const id = typeof result.id === 'string'
            ? result.id
            : typeof result.placeId === 'string'
              ? result.placeId
              : null;
          const analysis = (result as { aiAnalysis?: any }).aiAnalysis;
          if (!id || !analysis) continue;
          enhancedById.set(id, analysis);
        }

        setLeads(prev => prev.map(lead => {
          const analysis = enhancedById.get(lead.id);
          if (!analysis) return lead;
          return {
            ...lead,
            isEnhanced: true,
            compatibilityScore: analysis.compatibilityScore ?? lead.compatibilityScore,
            recommendation: analysis.recommendation ?? lead.recommendation,
            reasoning: analysis.reasoning ?? lead.reasoning,
            identifiedProblems: analysis.identifiedProblems ?? lead.identifiedProblems,
            compatibilityHooks: analysis.compatibilityHooks ?? lead.compatibilityHooks,
          };
        }));

        toast.success(`Processed ${enhancedById.size} lead${enhancedById.size === 1 ? '' : 's'}.`, { id: toastId });

        queue = queue.slice(batch.length);
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    } catch (error) {
      console.error('[LeadsList] AI enhance error:', error);
      toast.error('An error occurred while enhancing leads.');
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
        leadPurpose={leadPurpose}
        onLeadPurposeChange={setLeadPurpose}
        onEnhanceSelected={handleEnhanceSelected}
        isEnhancing={isEnhancing}
      />

      <LeadsTable
        filteredLeads={filteredLeads}
        selectedIds={selectedIds}
        onSelectAll={toggleSelectAll}
        onToggleSelectLead={toggleSelectLead}
        onOpenLead={setSelectedLead}
      />

      {/* Detail Drawer */}
      <LeadDetailDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        emailDraft={currentDraft}
        isGeneratingEmail={isGeneratingEmail}
        onGenerateEmail={generateEmail}
        onCopyToClipboard={copyToClipboard}
        isCopied={isCopied}
      />
    </div>
  );
}
