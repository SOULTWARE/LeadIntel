'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { AIAnalysisResult, LeadPlaceData } from '@/services/aiEnhanceService';
import {
  Search,
  Sparkles,
  Target,
  Settings2,
  Database,
  MapPin,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  FileDown,
  Check,
  X,
  Phone,
  Globe,
  Mail
} from 'lucide-react';
import InternalLayoutSetter from '@/components/InternalLayoutSetter';
import { COUNTRIES } from '@/lib/constants/countries';

const STORAGE_KEY = 'sourcerState.v1';

type SourceResultLead = LeadPlaceData & {
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  rating?: number | null;
  reviews?: number | null;
  type?: string | null;
  placeId?: string | null;
  aiAnalysis?: AIAnalysisResult | null;
};

export default function SourcerPage() {
  const [activeTab, setActiveTab] = useState('input');
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    categories: '',
    plainQueries: '',
    exactMatch: false,
    country: 'US',
    location: '',
    customLocations: '',
    maxResults: 20,
    language: 'en',
    placesPerQuery: 500,
    skip: 0,
    deleteDuplicates: true,
    useZipCodes: false,
    taskTitle: '',
    resultExtension: '.json',
    taskTags: '',
    columns: [],
    leadPurpose: '',
    sessionName: '',
    autoEnhance: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [results, setResults] = useState<SourceResultLead[] | null>(null);
  const [selectedResultIds, setSelectedResultIds] = useState<Set<string>>(new Set());
  const [activeResultLead, setActiveResultLead] = useState<SourceResultLead | null>(null);
  const isHydratingRef = useRef(true);

  const getResultId = (lead: SourceResultLead, index: number) => lead.placeId ?? `${lead.name}-${index}`;

  const getSelectedResults = () => {
    if (!results || selectedResultIds.size === 0) return [] as SourceResultLead[];
    return results.filter((lead, idx) => selectedResultIds.has(getResultId(lead, idx)));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    const target = e.target;
    const val = target instanceof HTMLInputElement && type === 'checkbox' ? target.checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const startCollection = async () => {
    setIsLoading(true);
    setResults(null);

    const idempotencyKey = crypto.randomUUID();

    const fetchPromise = fetch('/api/sourcer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(formData),
    });

    toast.promise(fetchPromise.then(async (res) => {
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to collect data');
      return data;
    }), {
      loading: 'Gathering verified business data...',
      success: (data) => {
        setResults(data.data.results);
        setActiveTab('results');

        if (formData.autoEnhance) {
          handleEnhanceAll(data.data.results);
        }

        return `Successfully sourced ${data.data.results.length} leads!`;
      },
      error: (err) => `Data collection failed: ${err.message}`,
    });

    try {
      await fetchPromise;
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnhanceAll = async (overrideLeads?: SourceResultLead[]) => {
    const currentLeads = overrideLeads
      ? [...overrideLeads]
      : (results ? results.filter((lead, idx) => selectedResultIds.has(getResultId(lead, idx))) : []);

    if (currentLeads.length === 0) {
      if (!overrideLeads) {
        toast.error('Select at least one lead to enhance.');
      }
      return;
    }

    if (!formData.leadPurpose) {
      toast.error("Please enter a 'Contact Purpose' in Step 3 first.");
      setCurrentStep(3);
      setActiveTab('input');
      return;
    }

    setIsEnhancing(true);

    let leadsQueue = [...currentLeads];

    try {
      while (true) {
        const unenhancedLeads = leadsQueue.filter(l => !l.aiAnalysis);

        if (unenhancedLeads.length === 0) {
          toast.success("All leads have been successfully analyzed!");
          break;
        }

        const batchSize = 10;
        const totalToProcess = unenhancedLeads.length;
        const currentBatch = unenhancedLeads.slice(0, batchSize);

        const toastId = toast.loading(`Analyzing batch of ${currentBatch.length} leads... (${totalToProcess} remaining)`);

        const response = await fetch('/api/enhance/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
          body: JSON.stringify({
            leads: currentBatch,
            leadPurpose: formData.leadPurpose
          }),
        });

        const data = await response.json();

        if (data.success) {
          const enhancedMap = new Map(
            (data.data.results as SourceResultLead[])
              .filter((r): r is SourceResultLead & { placeId: string } => typeof r.placeId === 'string' && r.placeId.length > 0)
              .map((r) => [r.placeId, r] as const)
          );

          // Update the local variable so the next loop iteration sees the new data
          leadsQueue = leadsQueue.map(oldLead => (oldLead.placeId ? enhancedMap.get(oldLead.placeId) : undefined) || oldLead);

          setResults((prev) => {
            if (!prev) return prev;
            return prev.map((oldLead) => {
              if (!oldLead.placeId) return oldLead;
              const updated = enhancedMap.get(oldLead.placeId);
              return updated ? { ...oldLead, aiAnalysis: updated.aiAnalysis } : oldLead;
            });
          });

          toast.success(`Processed batch of ${data.data.totalProcessed} leads!`, { id: toastId });

          // Delay to prevent rate limiting and allow UI updates
          await new Promise(resolve => setTimeout(resolve, 800));
        } else {
          toast.error(data.error || "Enhancement failed", { id: toastId });
          break;
        }
      }
    } catch (error) {
      console.error("[EnhanceBatch] Error:", error);
      toast.error("An error occurred during AI enhancement.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSaveResults = async () => {
    const leadsToSave = getSelectedResults();
    if (leadsToSave.length === 0) {
      toast.error('Select at least one lead to save.');
      return;
    }

    setIsSaving(true);
    const promise = fetch('/api/leads/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leads: leadsToSave,
        sessionName: formData.sessionName || `${formData.categories || formData.plainQueries} - ${formData.location}`,
        target: formData.categories || formData.plainQueries,
        location: formData.location,
        contactPurpose: formData.leadPurpose || undefined,
      }),
    });

    toast.promise(promise, {
      loading: 'Saving leads to database...',
      success: async (response) => {
        const data = await response.json();
        if (data.success) {
          setTimeout(() => window.location.href = '/results', 1500);
          return `Saved ${data.data.count} leads successfully!`;
        }
        throw new Error(data.error);
      },
      error: (err) => `Save failed: ${err.message}`,
    });

    try {
      await promise;
      setIsSaving(false);
    } catch {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    const leadsToExport = getSelectedResults();
    if (leadsToExport.length === 0) {
      toast.error('Select at least one lead to export.');
      return;
    }

    const headers = ['Name', 'Address', 'Phone', 'Website', 'Rating', 'Reviews', 'Type', 'Compatibility Score', 'Recommendation', 'Reasoning'];
    const csvContent = [
      headers.join(','),
      ...leadsToExport.map(r => [
        `"${r.name || ''}"`,
        `"${r.address || ''}"`,
        `"${r.phone || ''}"`,
        `"${r.website || ''}"`,
        r.rating || '',
        r.reviews || '',
        `"${r.type || ''}"`,
        r.aiAnalysis?.compatibilityScore || '',
        `"${r.aiAnalysis?.recommendation || ''}"`,
        `"${r.aiAnalysis?.reasoning?.replace(/"/g, '""') || ''}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sourcing_results_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Exported!');
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  useEffect(() => {
    if (!results || results.length === 0) {
      setSelectedResultIds(new Set());
      setActiveResultLead(null);
      return;
    }
    if (isHydratingRef.current) return;
    setSelectedResultIds(new Set(results.map((lead, idx) => getResultId(lead, idx))));
    setActiveResultLead(null);
  }, [results]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.formData) {
          setFormData(prev => ({ ...prev, ...parsed.formData }));
        }
        if (parsed.activeTab === 'results' || parsed.activeTab === 'input') {
          setActiveTab(parsed.activeTab);
        }
        if (typeof parsed.currentStep === 'number') {
          const clampedStep = Math.min(Math.max(parsed.currentStep, 1), 3);
          setCurrentStep(clampedStep);
        }
        if (Array.isArray(parsed.results)) {
          setResults(parsed.results);
        }
        if (Array.isArray(parsed.selectedResultIds)) {
          setSelectedResultIds(new Set(parsed.selectedResultIds));
        }
        if (parsed.activeResultLead) {
          setActiveResultLead(parsed.activeResultLead);
        }
      } catch (error) {
        console.error('[SourcerState] Failed to parse persisted state', error);
      }
    }
    isHydratingRef.current = false;
  }, []);

  useEffect(() => {
    if (isHydratingRef.current) return;
    if (typeof window === 'undefined') return;
    try {
      const payload = {
        activeTab,
        currentStep,
        formData,
        results,
        selectedResultIds: Array.from(selectedResultIds),
        activeResultLead,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.error('[SourcerState] Failed to persist state', error);
    }
  }, [activeTab, currentStep, formData, results, selectedResultIds, activeResultLead]);

  const toggleSelectAllResults = () => {
    if (!results || results.length === 0) return;
    if (selectedResultIds.size === results.length) {
      setSelectedResultIds(new Set());
      return;
    }
    const allIds = new Set(results.map((lead, idx) => getResultId(lead, idx)));
    setSelectedResultIds(allIds);
  };

  const toggleSelectResult = (lead: SourceResultLead, index: number) => {
    const id = getResultId(lead, index);
    const next = new Set(selectedResultIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedResultIds(next);
  };

  return (
    <div className="space-y-8">
      <InternalLayoutSetter
        title="Data Sourcing"
        icon={<Search className="w-4 h-4" />}
        rightSlot={(
          <div className="flex items-center gap-3">
            <Link href="/results" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-slate-50">
              Dashboard
            </Link>
            <button
              onClick={() => {
                setResults(null);
                setActiveTab('input');
                setCurrentStep(1);
              }}
              className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2 cursor-pointer"
            >
              Clear Session
            </button>
          </div>
        )}
      />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Main Tab Controls */}
          <div className="flex gap-2 bg-slate-200/50 p-1.5 rounded-2xl mb-12 w-fit mx-auto border border-slate-200 shadow-inner">
            <button
              onClick={() => setActiveTab('input')}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold cursor-pointer transition-all duration-300 ${activeTab === 'input' ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Settings2 className="w-4 h-4" />
              Configure Sourcing
            </button>
            <button
              onClick={() => { if(results) setActiveTab('results'); }}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold cursor-pointer transition-all duration-300 ${activeTab === 'results' ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-100' : 'text-slate-400 cursor-not-allowed opacity-60'}`}
              disabled={!results}
            >
              <Database className="w-4 h-4" />
              Results {results ? `(${results.length})` : ''}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'input' ? (
              <motion.div
                key="input-tab"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Wizard Progres */}
                <div className="flex items-center justify-between px-4 mb-4">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${
                        currentStep >= step ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {step}
                      </div>
                      {step < 3 && (
                        <div className={`h-1 flex-1 mx-4 rounded-full transition-all duration-700 ${
                          currentStep > step ? 'bg-blue-600' : 'bg-slate-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>

                <div
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target instanceof HTMLElement && e.target.tagName !== 'TEXTAREA') {
                      e.preventDefault();
                      if (currentStep < 3) nextStep();
                      else startCollection();
                    }
                  }}
                  className="bg-white border border-slate-200 rounded-[2rem] shadow-xl shadow-slate-100/50 overflow-hidden"
                >
                  <div className="p-10">
                    <AnimatePresence mode="wait">
                      {/* Step 1: Targets */}
                      {currentStep === 1 && (
                        <motion.div
                          key="step1"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-8"
                        >
                          <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                              <Target className="text-blue-600 w-8 h-8" />
                              Define Your Targets
                            </h3>
                            <p className="text-slate-500">What specific business categories are you looking for?</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Categories</label>
                              <input
                                name="categories"
                                value={formData.categories}
                                onChange={handleInputChange}
                                placeholder="e.g. Dental Clinics, Tech Startups"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all text-sm font-medium"
                              />
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Specific Queries</label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <span className="text-[10px] font-black text-slate-400 uppercase">Exact Match</span>
                                  <input
                                    type="checkbox"
                                    name="exactMatch"
                                    checked={formData.exactMatch}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  />
                                </label>
                              </div>
                              <textarea
                                name="plainQueries"
                                value={formData.plainQueries}
                                onChange={handleInputChange}
                                placeholder="One query per line..."
                                rows={3}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all text-sm font-medium resize-none"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Step 2: Locations */}
                      {currentStep === 2 && (
                        <motion.div
                          key="step2"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-8"
                        >
                          <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                              <MapPin className="text-emerald-500 w-8 h-8" />
                              Select Territories
                            </h3>
                            <p className="text-slate-500">Narrow down where we should search for these prospects.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Country</label>
                              <select
                                name="country"
                                value={formData.country}
                                onChange={handleInputChange}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all text-sm font-medium"
                              >
                                {COUNTRIES.map(country => (
                                  <option key={country.code} value={country.code}>
                                    {country.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-3">
                              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Target Cities</label>
                              <input
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                placeholder="e.g. San Francisco, Berlin"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all text-sm font-medium"
                              />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Custom Boundaries</label>
                            <textarea
                              name="customLocations"
                              value={formData.customLocations}
                              onChange={handleInputChange}
                              placeholder="Enter lat/long or specific neighborhoods..."
                              rows={2}
                              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all text-sm font-medium resize-none"
                            />
                          </div>
                        </motion.div>
                      )}

                      {/* Step 3: AI & Settings */}
                      {currentStep === 3 && (
                        <motion.div
                          key="step3"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-8"
                        >
                          <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                              <Sparkles className="text-indigo-500 w-8 h-8" />
                              Intelligence Setup
                            </h3>
                            <p className="text-slate-500">How should the AI evaluate these leads for you?</p>
                          </div>

                          <div className="space-y-6">
                            <div className="space-y-3">
                              <label className="text-sm font-black text-slate-700 uppercase tracking-widest block">Session Name (Optional)</label>
                              <input
                                name="sessionName"
                                value={formData.sessionName}
                                onChange={handleInputChange}
                                placeholder="e.g. Miami Dentists Jan 2025"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all text-sm font-bold placeholder:text-slate-300"
                              />
                            </div>

                            <div className="bg-indigo-50/50 border border-indigo-100 p-8 rounded-[1.5rem] space-y-4">
                               <label className="text-sm font-black text-indigo-900 uppercase tracking-widest">Contact Purpose</label>
                               <textarea
                                  name="leadPurpose"
                                  value={formData.leadPurpose}
                                  onChange={handleInputChange}
                                  placeholder="Identify if they need SEO services, specifically look for outdated web designs or missing H1 tags..."
                                  rows={4}
                                  className="w-full px-5 py-4 bg-white border border-indigo-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-medium resize-none shadow-inner"
                               />
                               <div className="flex items-center gap-4 pt-2">
                                  <div className="flex-1 space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Limit Results</label>
                                    <select
                                      name="maxResults"
                                      value={formData.maxResults}
                                      onChange={handleInputChange}
                                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                                    >
                                      <option value={10}>10 Leads</option>
                                      <option value={20}>20 Leads (1 page)</option>
                                      <option value={40}>40 Leads (2 pages)</option>
                                      <option value={60}>60 Leads (3 pages)</option>
                                      <option value={100}>100 Leads (Extended Search)</option>
                                    </select>
                                  </div>
                                  <div className="flex-1 space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Language</label>
                                    <select
                                      name="language"
                                      value={formData.language}
                                      onChange={handleInputChange}
                                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                                    >
                                      <option value="en">English</option>
                                      <option value="es">Spanish</option>
                                      <option value="de">German</option>
                                    </select>
                                  </div>
                               </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-8">
                             <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative">
                                  <input
                                    type="checkbox"
                                    name="deleteDuplicates"
                                    checked={formData.deleteDuplicates}
                                    onChange={handleInputChange}
                                    className="peer sr-only"
                                  />
                                  <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                                </div>
                                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Deduplicate Results</span>
                             </label>
                             <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative">
                                  <input
                                    type="checkbox"
                                    name="useZipCodes"
                                    checked={formData.useZipCodes}
                                    onChange={handleInputChange}
                                    className="peer sr-only"
                                  />
                                  <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                                </div>
                                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Use Postal Codes</span>
                             </label>
                             <label className="flex items-center gap-3 cursor-pointer group bg-indigo-50/50 px-4 py-2 rounded-xl border border-indigo-100">
                                <div className="relative">
                                  <input
                                    type="checkbox"
                                    name="autoEnhance"
                                    checked={formData.autoEnhance}
                                    onChange={handleInputChange}
                                    className="peer sr-only"
                                  />
                                  <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:bg-indigo-600 transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-black text-indigo-600 group-hover:text-indigo-700 transition-colors flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Auto-Enhance
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter uppercase whitespace-nowrap">AI Evaluation</span>
                                </div>
                             </label>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Wizard Footer Controls */}
                  <div className="bg-slate-50 px-10 py-6 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={prevStep}
                      disabled={currentStep === 1}
                      className="px-6 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Previous
                    </button>

                    {currentStep < 3 ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2 group cursor-pointer"
                      >
                        Next Step
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startCollection}
                        disabled={isLoading}
                        className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-base hover:bg-slate-800 transition-all shadow-2xl shadow-slate-300 disabled:opacity-50 flex items-center gap-3 relative overflow-hidden group cursor-pointer"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            Gathering...
                          </>
                        ) : (
                          <>
                            Start Extraction
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="results-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8"
              >
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
                   <div className="p-10 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="space-y-2 text-center md:text-left">
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">Extracted Leads</h3>
                        <p className="text-slate-500 font-medium flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                           Successfully found {results?.length || 0} businesses
                        </p>
                        <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-full px-4 py-1">
                          <Check className="w-3 h-3 text-blue-500" />
                          {selectedResultIds.size} selected
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-center gap-3">
                        <button
                          onClick={handleExportCSV}
                          className="px-6 py-3 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                        >
                          <FileDown className="w-4 h-4" />
                          Export CSV
                        </button>
                        <button
                          onClick={() => handleEnhanceAll()}
                          disabled={isEnhancing}
                          className="px-8 py-3 text-sm font-black bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all disabled:opacity-50 flex items-center gap-2 group cursor-pointer"
                        >
                          {isEnhancing ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                              AI Enhance
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleSaveResults}
                          disabled={isSaving}
                          className="px-8 py-3 text-sm font-black bg-slate-900 text-white rounded-xl hover:bg-slate-800 shadow-xl shadow-slate-900/10 transition-all disabled:opacity-40 flex items-center gap-2 cursor-pointer"
                        >
                           <Database className="w-4 h-4" />
                           {isSaving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                   </div>

                   <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80">
                            <th className="pl-8 py-6 w-12">
                              <div
                                onClick={toggleSelectAllResults}
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${
                                  results && selectedResultIds.size === results.length && results.length > 0
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'bg-white border-slate-300 hover:border-blue-400'
                                }`}
                              >
                                {results && results.length > 0 && selectedResultIds.size === results.length && (
                                  <Check className="w-3.5 h-3.5 text-white stroke-[4]" />
                                )}
                              </div>
                            </th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Business Name</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact Details</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">AI Intelligence</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Compatibility</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(results || []).map((r, i) => (
                            <motion.tr
                              onClick={() => setActiveResultLead(r)}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.03 }}
                              key={i}
                              className={`group hover:bg-blue-50/30 transition-all duration-300 cursor-pointer ${
                                selectedResultIds.has(getResultId(r, i)) ? 'bg-blue-50/40' : ''
                              }`}
                            >
                               <td className="pl-8 py-8 w-12" onClick={(e) => e.stopPropagation()}>
                                 <div
                                   onClick={() => toggleSelectResult(r, i)}
                                   className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                     selectedResultIds.has(getResultId(r, i))
                                       ? 'bg-blue-600 border-blue-600'
                                       : 'bg-white border-slate-300 group-hover:border-blue-400'
                                   }`}
                                 >
                                   {selectedResultIds.has(getResultId(r, i)) && (
                                     <Check className="w-3.5 h-3.5 text-white stroke-[4]" />
                                   )}
                                 </div>
                               </td>
                               <td className="px-8 py-8">
                                 <div className="font-bold text-slate-800 text-base group-hover:text-blue-600 transition-colors">{r.name}</div>
                                 <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 bg-slate-100 px-2 py-0.5 rounded w-fit">{r.type || 'Business'}</div>
                               </td>
                               <td className="px-8 py-8">
                                 <div className="text-sm text-slate-500 font-medium truncate max-w-[220px] mb-1">{r.address}</div>
                                 <div className="flex gap-4 items-center">
                                   {r.website && (
                                     <a href={r.website} target="_blank" className="text-xs text-blue-500 font-bold hover:underline">Website</a>
                                   )}
                                   {r.phone && <div className="text-[10px] text-slate-400 font-bold">{r.phone}</div>}
                                 </div>
                               </td>
                               <td className="px-8 py-8 max-w-[300px]">
                                  {r.aiAnalysis ? (
                                    <div className="space-y-2">
                                      <div className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg w-fit shadow-sm border ${
                                        r.aiAnalysis.recommendation === 'Highly Recommended' ? 'bg-green-50 text-green-700 border-green-100' :
                                        r.aiAnalysis.recommendation === 'Recommended' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                        'bg-slate-50 text-slate-600 border-slate-100'
                                      }`}>
                                        {r.aiAnalysis.recommendation}
                                      </div>
                                      <div className="text-xs text-slate-600 line-clamp-3 leading-relaxed italic border-l-2 border-slate-200 pl-3">
                                        &quot;{r.aiAnalysis.reasoning}&quot;
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium italic">
                                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />
                                      Awaiting AI verification...
                                    </div>
                                  )}
                               </td>
                               <td className="px-8 py-8">
                                 {r.aiAnalysis ? (
                                   <div className="flex flex-col items-center gap-1">
                                      <div className={`text-2xl font-black ${
                                        r.aiAnalysis.compatibilityScore >= 80 ? 'text-green-600' :
                                        r.aiAnalysis.compatibilityScore >= 50 ? 'text-blue-600' :
                                        'text-slate-300'
                                      }`}>
                                        {r.aiAnalysis.compatibilityScore}%
                                      </div>
                                      <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full transition-all duration-1000 ${
                                            r.aiAnalysis.compatibilityScore >= 80 ? 'bg-green-500' : 'bg-blue-500'
                                          }`}
                                          style={{ width: `${r.aiAnalysis.compatibilityScore}%` }}
                                        />
                                      </div>
                                   </div>
                                 ) : (
                                   <div className="text-center">-</div>
                                 )}
                               </td>
                            </motion.tr>
                          ))}
                        </tbody>
                     </table>
                   </div>
                   <AnimatePresence>
                     {activeResultLead && (
                       <>
                         <motion.div
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 0.5 }}
                           exit={{ opacity: 0 }}
                           onClick={() => setActiveResultLead(null)}
                           className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90]"
                         />
                         <motion.div
                           initial={{ x: '100%' }}
                           animate={{ x: 0 }}
                           exit={{ x: '100%' }}
                           transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                           className="fixed top-0 right-0 w-full md:w-[520px] h-full bg-white shadow-2xl z-[100] overflow-y-auto"
                         >
                           <div className="p-8 space-y-8">
                             <div className="flex items-center justify-between">
                               <div>
                                 <div className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Live Preview</div>
                                 <h3 className="text-3xl font-black text-slate-900 tracking-tight">{activeResultLead.name}</h3>
                               </div>
                               <button
                                 onClick={() => setActiveResultLead(null)}
                                 className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
                               >
                                 <X className="w-5 h-5" />
                               </button>
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                               <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Category</div>
                                 <div className="text-lg font-black text-slate-900">{activeResultLead.type || 'Business'}</div>
                               </div>
                               <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rating</div>
                                 <div className="text-lg font-black text-slate-900">
                                   {activeResultLead.rating ? `${activeResultLead.rating} ★` : 'N/A'}
                                 </div>
                               </div>
                             </div>

                             <div className="space-y-4">
                               <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">AI Analysis</h4>
                               {activeResultLead.aiAnalysis ? (
                                 <div className="space-y-4">
                                   <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase w-fit border ${
                                     activeResultLead.aiAnalysis.recommendation === 'Highly Recommended'
                                       ? 'bg-green-50 text-green-700 border-green-100'
                                       : activeResultLead.aiAnalysis.recommendation === 'Recommended'
                                         ? 'bg-blue-50 text-blue-700 border-blue-100'
                                         : 'bg-slate-50 text-slate-600 border-slate-100'
                                   }`}>
                                     {activeResultLead.aiAnalysis.recommendation}
                                   </div>
                                   <div className="text-sm text-slate-600 italic border-l-2 border-slate-200 pl-4">
                                     “{activeResultLead.aiAnalysis.reasoning}”
                                   </div>
                                   <div>
                                     <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Compatibility Hooks</div>
                                     <ul className="space-y-2 text-sm text-slate-600">
                                       {activeResultLead.aiAnalysis.compatibilityHooks.map((hook, idx) => (
                                         <li key={idx} className="flex items-center gap-2">
                                           <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                           {hook}
                                         </li>
                                       ))}
                                     </ul>
                                   </div>
                                 </div>
                               ) : (
                                 <p className="text-sm text-slate-500 italic">No AI summary yet. Run AI Enhance to generate insights.</p>
                               )}
                             </div>

                             <div className="space-y-4">
                               <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Contact Details</h4>
                               <div className="space-y-3 text-sm text-slate-600">
                                 {activeResultLead.address && (
                                   <div className="flex items-center gap-3">
                                     <MapPin className="w-4 h-4 text-slate-400" />
                                     {activeResultLead.address}
                                   </div>
                                 )}
                                 {activeResultLead.phone && (
                                   <div className="flex items-center gap-3">
                                     <Phone className="w-4 h-4 text-slate-400" />
                                     {activeResultLead.phone}
                                   </div>
                                 )}
                                 {activeResultLead.website && (
                                   <a
                                     href={activeResultLead.website}
                                     target="_blank"
                                     className="flex items-center gap-3 text-blue-600 font-semibold"
                                   >
                                     <Globe className="w-4 h-4" />
                                     Visit website
                                   </a>
                                 )}
                               </div>
                             </div>

                             <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 space-y-3">
                               <div className="flex items-center gap-3">
                                 <Mail className="w-4 h-4 text-indigo-500" />
                                 <div className="text-sm font-bold text-slate-700">Need personalized outreach?</div>
                               </div>
                               <p className="text-xs text-slate-500">Save this lead to your results dashboard to use full outreach workflows.</p>
                             </div>
                           </div>
                         </motion.div>
                       </>
                     )}
                   </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
