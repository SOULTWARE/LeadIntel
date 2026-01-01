'use client';

import { useState } from 'react';
import type { Lead } from '@prisma/client';
import { toast } from 'sonner';
import { LeadsListToolbar } from './leads-list/LeadsListToolbar';
import { LeadsTable } from './leads-list/LeadsTable';
import { LeadDetailDrawer } from './leads-list/LeadDetailDrawer';
import { createLeadsCsv } from './leads-list/createLeadsCsv';

export default function LeadsList({ initialLeads }: { initialLeads: Lead[] }) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [emailDraft, setEmailDraft] = useState<{ subject: string; body: string } | null>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const [isFindingBatch, setIsFindingBatch] = useState(false);

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
    setEmailDraft(null);
    try {
      const response = await fetch('/api/generate/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead, leadPurpose: lead.searchQuery || '' }),
      });
      const data = await response.json();
      if (data.success && data.data?.subject && data.data?.body) {
        setEmailDraft(data.data);
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
    if (!emailDraft) return;
    const text = `Subject: ${emailDraft.subject}\n\n${emailDraft.body}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const filteredLeads = initialLeads.filter(lead => {
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
    const leadsToExport = initialLeads.filter(l => selectedIds.has(l.id));
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
        emailDraft={emailDraft}
        isGeneratingEmail={isGeneratingEmail}
        onGenerateEmail={generateEmail}
        onCopyToClipboard={copyToClipboard}
        isCopied={isCopied}
      />
    </div>
  );
}
