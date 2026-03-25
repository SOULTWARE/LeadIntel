"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import type {
  AIAnalysisResult,
  LeadPlaceData,
} from "@/services/aiEnhanceService";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Database,
  FileDown,
  Globe,
  MapPin,
  Phone,
  Search,
  Sparkles,
  Target,
  X,
} from "lucide-react";

import InternalLayoutSetter from "@/components/InternalLayoutSetter";
import { COUNTRIES } from "@/lib/constants/countries";

const STORAGE_KEY = "sourcerState.v2";

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

type FormState = {
  categories: string;
  plainQueries: string;
  exactMatch: boolean;
  country: string;
  location: string;
  customLocations: string;
  maxResults: number;
  language: string;
  deleteDuplicates: boolean;
  useZipCodes: boolean;
  leadPurpose: string;
  sessionName: string;
  autoEnhance: boolean;
};

const initialFormState: FormState = {
  categories: "",
  plainQueries: "",
  exactMatch: false,
  country: "US",
  location: "",
  customLocations: "",
  maxResults: 20,
  language: "en",
  deleteDuplicates: true,
  useZipCodes: false,
  leadPurpose: "",
  sessionName: "",
  autoEnhance: false,
};

const workflowSteps = [
  {
    step: 1,
    title: "Define markets",
    description:
      "Set categories and specific queries for the businesses you want to source.",
  },
  {
    step: 2,
    title: "Set territories",
    description:
      "Narrow geography with country, city, and custom location hints.",
  },
  {
    step: 3,
    title: "Qualify results",
    description:
      "Define the contact purpose and runtime settings that shape the session.",
  },
] as const;

function ResultRecommendationBadge({ lead }: { lead: SourceResultLead }) {
  if (!lead.aiAnalysis) {
    return <span className="text-xs text-slate-400">Awaiting AI analysis</span>;
  }

  const recommendation = lead.aiAnalysis.recommendation;
  const classes =
    recommendation === "Highly Recommended"
      ? "chip-success"
      : recommendation === "Recommended"
        ? "chip-accent"
        : "chip-muted";

  return <span className={classes}>{recommendation}</span>;
}

export default function SourcerWorkspaceRevamp() {
  const [activeTab, setActiveTab] = useState<"input" | "results">("input");
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<FormState>(initialFormState);

  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [results, setResults] = useState<SourceResultLead[] | null>(null);
  const [selectedResultIds, setSelectedResultIds] = useState<Set<string>>(
    new Set(),
  );
  const [activeResultLead, setActiveResultLead] =
    useState<SourceResultLead | null>(null);

  const isHydratingRef = useRef(true);

  const getResultId = (lead: SourceResultLead, index: number) =>
    lead.placeId ?? `${lead.name}-${index}`;

  const getSelectedResults = () => {
    if (!results || selectedResultIds.size === 0)
      return [] as SourceResultLead[];
    return results.filter((lead, index) =>
      selectedResultIds.has(getResultId(lead, index)),
    );
  };

  const handleInputChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = event.target;
    const nextValue =
      event.target instanceof HTMLInputElement && type === "checkbox"
        ? event.target.checked
        : value;
    setFormData((previous) => ({ ...previous, [name]: nextValue }));
  };

  const startCollection = async () => {
    setIsLoading(true);
    setResults(null);

    const requestPromise = fetch("/api/sourcer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(formData),
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to collect data");
      }

      return data.data.results as SourceResultLead[];
    });

    toast.promise(requestPromise, {
      loading: "Gathering verified business data...",
      success: (sourcedResults) =>
        `Successfully sourced ${sourcedResults.length} leads.`,
      error: (error) => `Data collection failed: ${error.message}`,
    });

    try {
      const sourcedResults = await requestPromise;
      setResults(sourcedResults);
      setActiveTab("results");
      if (formData.autoEnhance) {
        void handleEnhanceAll(sourcedResults);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnhanceAll = async (overrideLeads?: SourceResultLead[]) => {
    const currentLeads = overrideLeads
      ? [...overrideLeads]
      : results
        ? results.filter((lead, index) =>
            selectedResultIds.has(getResultId(lead, index)),
          )
        : [];

    if (currentLeads.length === 0) {
      if (!overrideLeads) {
        toast.error("Select at least one lead to enhance.");
      }
      return;
    }

    if (!formData.leadPurpose.trim()) {
      toast.error("Enter a contact purpose before running AI Enhance.");
      setCurrentStep(3);
      setActiveTab("input");
      return;
    }

    setIsEnhancing(true);
    let queue = [...currentLeads];

    try {
      while (true) {
        const unenhancedLeads = queue.filter((lead) => !lead.aiAnalysis);

        if (unenhancedLeads.length === 0) {
          toast.success("All selected leads have been analyzed.");
          break;
        }

        const batch = unenhancedLeads.slice(0, 10);
        const toastId = toast.loading(
          `Analyzing ${batch.length} leads... (${unenhancedLeads.length} remaining)`,
        );

        const response = await fetch("/api/enhance/batch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": crypto.randomUUID(),
          },
          body: JSON.stringify({
            leads: batch,
            leadPurpose: formData.leadPurpose.trim(),
          }),
        });

        const data = await response.json();

        if (!data.success) {
          toast.error(data.error || "AI enhancement failed.", { id: toastId });
          break;
        }

        const enhancedMap = new Map(
          (data.data.results as SourceResultLead[])
            .filter(
              (result): result is SourceResultLead & { placeId: string } =>
                typeof result.placeId === "string" && result.placeId.length > 0,
            )
            .map((result) => [result.placeId, result] as const),
        );

        queue = queue.map(
          (oldLead) =>
            (oldLead.placeId ? enhancedMap.get(oldLead.placeId) : undefined) ||
            oldLead,
        );

        setResults((previous) => {
          if (!previous) return previous;
          return previous.map((oldLead) => {
            if (!oldLead.placeId) return oldLead;
            const updated = enhancedMap.get(oldLead.placeId);
            return updated
              ? { ...oldLead, aiAnalysis: updated.aiAnalysis }
              : oldLead;
          });
        });

        if (
          activeResultLead?.placeId &&
          enhancedMap.has(activeResultLead.placeId)
        ) {
          setActiveResultLead((previous) => {
            if (!previous?.placeId) return previous;
            return enhancedMap.get(previous.placeId) || previous;
          });
        }

        toast.success(
          `Processed ${data.data.totalProcessed} lead${data.data.totalProcessed === 1 ? "" : "s"}.`,
          { id: toastId },
        );
        await new Promise((resolve) => setTimeout(resolve, 700));
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
      toast.error("Select at least one lead to save.");
      return;
    }

    setIsSaving(true);

    const requestPromise = fetch("/api/leads/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leads: leadsToSave,
        sessionName:
          formData.sessionName ||
          `${formData.categories || formData.plainQueries} - ${formData.location}`,
        target: formData.categories || formData.plainQueries,
        location: formData.location,
        contactPurpose: formData.leadPurpose || undefined,
      }),
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save leads");
      }
      return data.data.count as number;
    });

    toast.promise(requestPromise, {
      loading: "Saving leads to the workspace...",
      success: (count) =>
        `Saved ${count} lead${count === 1 ? "" : "s"} successfully.`,
      error: (error) => `Save failed: ${error.message}`,
    });

    try {
      await requestPromise;
      setTimeout(() => {
        window.location.href = "/results";
      }, 1000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    const leadsToExport = getSelectedResults();
    if (leadsToExport.length === 0) {
      toast.error("Select at least one lead to export.");
      return;
    }

    const headers = [
      "Name",
      "Address",
      "Phone",
      "Website",
      "Rating",
      "Reviews",
      "Type",
      "Compatibility Score",
      "Recommendation",
      "Reasoning",
    ];
    const csvContent = [
      headers.join(","),
      ...leadsToExport.map((lead) =>
        [
          `"${lead.name || ""}"`,
          `"${lead.address || ""}"`,
          `"${lead.phone || ""}"`,
          `"${lead.website || ""}"`,
          lead.rating || "",
          lead.reviews || "",
          `"${lead.type || ""}"`,
          lead.aiAnalysis?.compatibilityScore || "",
          `"${lead.aiAnalysis?.recommendation || ""}"`,
          `"${lead.aiAnalysis?.reasoning?.replace(/"/g, '""') || ""}"`,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sourcing-results-${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported.");
  };

  useEffect(() => {
    if (!results || results.length === 0) {
      setSelectedResultIds(new Set());
      setActiveResultLead(null);
      return;
    }
    if (isHydratingRef.current) return;
    setSelectedResultIds(
      new Set(results.map((lead, index) => getResultId(lead, index))),
    );
  }, [results]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as {
          activeTab?: "input" | "results";
          currentStep?: number;
          formData?: Partial<FormState>;
          results?: SourceResultLead[];
          selectedResultIds?: string[];
          activeResultLead?: SourceResultLead | null;
        };

        if (parsed.formData) {
          setFormData((previous) => ({ ...previous, ...parsed.formData }));
        }
        if (parsed.activeTab === "input" || parsed.activeTab === "results") {
          setActiveTab(parsed.activeTab);
        }
        if (typeof parsed.currentStep === "number") {
          const step = Math.max(1, Math.min(parsed.currentStep, 3)) as
            | 1
            | 2
            | 3;
          setCurrentStep(step);
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
        console.error("[SourcerState] Failed to parse persisted state", error);
      }
    }

    isHydratingRef.current = false;
  }, []);

  useEffect(() => {
    if (isHydratingRef.current) return;
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          activeTab,
          currentStep,
          formData,
          results,
          selectedResultIds: Array.from(selectedResultIds),
          activeResultLead,
        }),
      );
    } catch (error) {
      console.error("[SourcerState] Failed to persist state", error);
    }
  }, [
    activeTab,
    currentStep,
    formData,
    results,
    selectedResultIds,
    activeResultLead,
  ]);

  const toggleSelectAllResults = () => {
    if (!results || results.length === 0) return;
    if (selectedResultIds.size === results.length) {
      setSelectedResultIds(new Set());
      return;
    }
    setSelectedResultIds(
      new Set(results.map((lead, index) => getResultId(lead, index))),
    );
  };

  const toggleSelectResult = (lead: SourceResultLead, index: number) => {
    const id = getResultId(lead, index);
    setSelectedResultIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const activeSummary = {
    categories: formData.categories || "Not set",
    location: formData.location || "Not set",
    maxResults: formData.maxResults,
    selected: selectedResultIds.size,
  };

  return (
    <div className="page-stack">
      <InternalLayoutSetter
        title="Sourcing workspace"
        icon={<Search className="h-4 w-4" />}
        rightSlot={
          <div className="flex items-center gap-3">
            <Link href="/results" className="btn-secondary">
              <Database className="h-4 w-4" />
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                setResults(null);
                setSelectedResultIds(new Set());
                setActiveResultLead(null);
                setActiveTab("input");
                setCurrentStep(1);
                setFormData(initialFormState);
                localStorage.removeItem(STORAGE_KEY);
              }}
              className="btn-secondary"
            >
              Clear session
            </button>
          </div>
        }
      />

      <section className="surface grid gap-6 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
        <div className="space-y-4">
          <div className="eyebrow">
            <Search className="h-4 w-4" />
            Sourcing workflow
          </div>
          <h2 className="section-title">
            Build the search, review the results, and save only the leads worth
            working.
          </h2>
          <p className="section-copy max-w-3xl">
            The workspace is organized into a short sequence: define the market,
            define the territory, add the qualification brief, then review the
            sourced businesses with AI before saving them into the main results
            dashboard.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div className="metric-card bg-slate-950 text-white">
            <div className="metric-label text-slate-400">Target</div>
            <div className="metric-value text-white">
              {activeSummary.categories}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Territory</div>
            <div className="metric-value text-blue-700">
              {activeSummary.location}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Result cap</div>
            <div className="metric-value">{activeSummary.maxResults}</div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <section className="surface space-y-4 p-5">
            <div className="section-label">Workspace mode</div>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("input")}
                className={`btn justify-start ${activeTab === "input" ? "border-blue-700 bg-blue-700 text-white hover:bg-blue-600" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}
              >
                <Target className="h-4 w-4" />
                Configure search
              </button>
              <button
                type="button"
                onClick={() => results && setActiveTab("results")}
                disabled={!results}
                className={`btn justify-start ${activeTab === "results" ? "border-blue-700 bg-blue-700 text-white hover:bg-blue-600" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}
              >
                <Database className="h-4 w-4" />
                Results {results ? `(${results.length})` : ""}
              </button>
            </div>
          </section>

          <section className="surface space-y-4 p-5">
            <div className="section-label">Workflow steps</div>
            <div className="space-y-2">
              {workflowSteps.map((item) => (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => {
                    setCurrentStep(item.step);
                    setActiveTab("input");
                  }}
                  className={`w-full rounded-md border px-4 py-4 text-left transition-colors ${
                    currentStep === item.step
                      ? "border-blue-700 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-950">
                      {item.title}
                    </div>
                    <span className="section-label">
                      {String(item.step).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="surface-muted space-y-3 p-5">
            <div className="section-label">Session summary</div>
            <div className="text-sm text-slate-600">
              <div>
                <span className="font-semibold text-slate-900">
                  Categories:
                </span>{" "}
                {formData.categories || "Not set"}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Location:</span>{" "}
                {formData.location || "Not set"}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Purpose:</span>{" "}
                {formData.leadPurpose || "Not set"}
              </div>
            </div>
            {results ? (
              <div className="border-t border-slate-200 pt-3 text-sm text-slate-600">
                <div>
                  <span className="font-semibold text-slate-900">Results:</span>{" "}
                  {results.length}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">
                    Selected:
                  </span>{" "}
                  {selectedResultIds.size}
                </div>
              </div>
            ) : null}
          </section>
        </aside>

        <div className="space-y-6">
          {activeTab === "input" ? (
            <section className="surface space-y-6 p-6 lg:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="section-label">Step {currentStep} of 3</div>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                    {workflowSteps[currentStep - 1].title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {workflowSteps[currentStep - 1].description}
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  {workflowSteps.map((item) => (
                    <div
                      key={item.step}
                      className={`h-2 w-12 rounded-full ${currentStep >= item.step ? "bg-blue-700" : "bg-slate-200"}`}
                    />
                  ))}
                </div>
              </div>

              {currentStep === 1 ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="section-label">Categories</span>
                    <input
                      name="categories"
                      value={formData.categories}
                      onChange={handleInputChange}
                      placeholder="Dental clinics, orthodontists, HVAC contractors"
                      className="field-input"
                    />
                    <p className="field-hint">
                      Use broad market categories when you want the search to
                      expand organically.
                    </p>
                  </label>

                  <div className="space-y-4">
                    <label className="block space-y-2">
                      <span className="section-label">Specific queries</span>
                      <textarea
                        name="plainQueries"
                        value={formData.plainQueries}
                        onChange={handleInputChange}
                        rows={5}
                        placeholder="One custom search query per line"
                        className="field-textarea"
                      />
                    </label>
                    <label className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-950">
                          Exact match
                        </div>
                        <div className="text-sm text-slate-500">
                          Keep the query phrasing as literal as possible.
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        name="exactMatch"
                        checked={formData.exactMatch}
                        onChange={handleInputChange}
                        className="h-4 w-4"
                      />
                    </label>
                  </div>
                </div>
              ) : null}

              {currentStep === 2 ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="section-label">Country</span>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="field-select"
                    >
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="section-label">Target cities</span>
                    <input
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Miami, Orlando, Tampa"
                      className="field-input"
                    />
                  </label>

                  <label className="block space-y-2 lg:col-span-2">
                    <span className="section-label">Custom boundaries</span>
                    <textarea
                      name="customLocations"
                      value={formData.customLocations}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Neighborhoods, lat/long pairs, or notes for location targeting"
                      className="field-textarea"
                    />
                    <p className="field-hint">
                      This field is useful for documenting territory intent even
                      if the API call currently uses the main location field.
                    </p>
                  </label>
                </div>
              ) : null}

              {currentStep === 3 ? (
                <div className="space-y-6">
                  <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                    <label className="block space-y-2">
                      <span className="section-label">Session name</span>
                      <input
                        name="sessionName"
                        value={formData.sessionName}
                        onChange={handleInputChange}
                        placeholder="Florida dental clinics - March"
                        className="field-input"
                      />
                    </label>

                    <label className="block space-y-2">
                      <span className="section-label">Contact purpose</span>
                      <textarea
                        name="leadPurpose"
                        value={formData.leadPurpose}
                        onChange={handleInputChange}
                        rows={4}
                        placeholder="Explain what a qualified lead looks like and which problems the AI should search for."
                        className="field-textarea"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block space-y-2">
                      <span className="section-label">Result cap</span>
                      <select
                        name="maxResults"
                        value={formData.maxResults}
                        onChange={handleInputChange}
                        className="field-select"
                      >
                        <option value={10}>10 leads</option>
                        <option value={20}>20 leads</option>
                        <option value={40}>40 leads</option>
                        <option value={60}>60 leads</option>
                        <option value={100}>100 leads</option>
                      </select>
                    </label>
                    <label className="block space-y-2">
                      <span className="section-label">Language</span>
                      <select
                        name="language"
                        value={formData.language}
                        onChange={handleInputChange}
                        className="field-select"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {[
                      {
                        name: "deleteDuplicates",
                        title: "Deduplicate results",
                        description:
                          "Keep only unique records inside the saved session.",
                        checked: formData.deleteDuplicates,
                      },
                      {
                        name: "useZipCodes",
                        title: "Use ZIP context",
                        description:
                          "Store location intent for denser geographic filtering.",
                        checked: formData.useZipCodes,
                      },
                      {
                        name: "autoEnhance",
                        title: "Auto-run AI",
                        description:
                          "Start AI qualification automatically after sourcing finishes.",
                        checked: formData.autoEnhance,
                      },
                    ].map((toggle) => (
                      <label
                        key={toggle.name}
                        className="rounded-md border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-950">
                              {toggle.title}
                            </div>
                            <div className="mt-2 text-sm text-slate-500">
                              {toggle.description}
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            name={toggle.name}
                            checked={toggle.checked}
                            onChange={handleInputChange}
                            className="mt-1 h-4 w-4"
                          />
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentStep(
                      (previous) => Math.max(1, previous - 1) as 1 | 2 | 3,
                    )
                  }
                  className="btn-secondary"
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </button>

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentStep(
                        (previous) => Math.min(3, previous + 1) as 1 | 2 | 3,
                      )
                    }
                    className="btn-primary"
                  >
                    Next step
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void startCollection()}
                    disabled={isLoading}
                    className="btn-accent"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                        Running search...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        Run sourcing search
                      </>
                    )}
                  </button>
                )}
              </div>
            </section>
          ) : (
            <section className="surface overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="section-label">Results</div>
                    <h3 className="text-2xl font-semibold text-slate-950">
                      Review sourced businesses
                    </h3>
                    <p className="text-sm text-slate-600">
                      {results?.length || 0} records sourced. Save the strongest
                      leads, export a CSV, or run AI enhancement on the selected
                      rows.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="chip-muted">
                      {selectedResultIds.size} selected
                    </span>
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="btn-secondary"
                    >
                      <FileDown className="h-4 w-4" />
                      Export CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleEnhanceAll()}
                      disabled={isEnhancing}
                      className="btn-accent"
                    >
                      {isEnhancing ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                          Enhancing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          AI Enhance
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveResults}
                      disabled={isSaving}
                      className="btn-primary"
                    >
                      <Database className="h-4 w-4" />
                      {isSaving ? "Saving..." : "Save to dashboard"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="table-header">
                    <tr>
                      <th className="w-12 py-4 pl-5">
                        <button
                          type="button"
                          onClick={toggleSelectAllResults}
                          className={`flex h-5 w-5 items-center justify-center rounded-sm border ${
                            results &&
                            selectedResultIds.size === results.length &&
                            results.length > 0
                              ? "border-blue-700 bg-blue-700"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {results &&
                          results.length > 0 &&
                          selectedResultIds.size === results.length ? (
                            <Check className="h-3.5 w-3.5 text-white" />
                          ) : null}
                        </button>
                      </th>
                      <th className="px-5 py-4 table-cell-label">Business</th>
                      <th className="px-5 py-4 table-cell-label">Contact</th>
                      <th className="px-5 py-4 table-cell-label">
                        AI analysis
                      </th>
                      <th className="px-5 py-4 table-cell-label">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(results || []).map((lead, index) => (
                      <tr
                        key={getResultId(lead, index)}
                        onClick={() => setActiveResultLead(lead)}
                        className={`table-row cursor-pointer ${selectedResultIds.has(getResultId(lead, index)) ? "bg-blue-50/60" : ""}`}
                      >
                        <td
                          className="w-12 py-5 pl-5"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => toggleSelectResult(lead, index)}
                            className={`flex h-5 w-5 items-center justify-center rounded-sm border ${
                              selectedResultIds.has(getResultId(lead, index))
                                ? "border-blue-700 bg-blue-700"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {selectedResultIds.has(getResultId(lead, index)) ? (
                              <Check className="h-3.5 w-3.5 text-white" />
                            ) : null}
                          </button>
                        </td>
                        <td className="px-5 py-5">
                          <div className="text-base font-semibold text-slate-950">
                            {lead.name}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="chip-muted">
                              {lead.type || "Business"}
                            </span>
                            {lead.rating ? (
                              <span className="chip-muted">
                                {lead.rating} / 5
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-5 py-5">
                          <div className="space-y-1 text-sm text-slate-600">
                            <div>{lead.address || "No address"}</div>
                            <div className="flex flex-wrap gap-3">
                              {lead.website ? (
                                <span className="text-blue-700">Website</span>
                              ) : null}
                              {lead.phone ? <span>{lead.phone}</span> : null}
                            </div>
                          </div>
                        </td>
                        <td className="max-w-sm px-5 py-5">
                          <div className="space-y-2">
                            <ResultRecommendationBadge lead={lead} />
                            <p className="line-clamp-2 text-sm text-slate-500">
                              {lead.aiAnalysis?.reasoning ||
                                "Open the record or run AI Enhance to generate a summary."}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-5">
                          {lead.aiAnalysis ? (
                            <div className="space-y-2">
                              <div className="text-lg font-semibold text-slate-950">
                                {lead.aiAnalysis.compatibilityScore}%
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className={
                                    lead.aiAnalysis.compatibilityScore >= 80
                                      ? "h-full bg-green-600"
                                      : "h-full bg-blue-700"
                                  }
                                  style={{
                                    width: `${lead.aiAnalysis.compatibilityScore}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </div>

      <AnimatePresence>
        {activeResultLead ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveResultLead(null)}
              className="fixed inset-0 z-[90] bg-slate-950/40 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              className="fixed right-0 top-0 z-[91] h-full w-full overflow-y-auto border-l border-slate-200 bg-[rgba(243,245,247,0.98)] md:w-[520px]"
            >
              <div className="space-y-5 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="section-label">Lead preview</div>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                      {activeResultLead.name}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveResultLead(null)}
                    className="btn-secondary px-3"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <section className="surface space-y-4 p-5">
                  <div className="flex flex-wrap gap-2">
                    <span className="chip-accent">
                      {activeResultLead.type || "Business"}
                    </span>
                    {activeResultLead.rating ? (
                      <span className="chip-muted">
                        {activeResultLead.rating} / 5
                      </span>
                    ) : null}
                  </div>
                  <div className="grid gap-3">
                    {activeResultLead.address ? (
                      <div className="surface-muted flex items-center gap-3 p-4 text-sm text-slate-700">
                        <MapPin className="h-4 w-4 text-blue-700" />
                        {activeResultLead.address}
                      </div>
                    ) : null}
                    {activeResultLead.phone ? (
                      <div className="surface-muted flex items-center gap-3 p-4 text-sm text-slate-700">
                        <Phone className="h-4 w-4 text-blue-700" />
                        {activeResultLead.phone}
                      </div>
                    ) : null}
                    {activeResultLead.website ? (
                      <a
                        href={activeResultLead.website}
                        target="_blank"
                        rel="noreferrer"
                        className="surface-muted flex items-center gap-3 p-4 text-sm font-medium text-blue-700"
                      >
                        <Globe className="h-4 w-4" />
                        Visit website
                      </a>
                    ) : null}
                  </div>
                </section>

                <section className="surface space-y-4 p-5">
                  <div className="section-label">AI summary</div>
                  {activeResultLead.aiAnalysis ? (
                    <>
                      <ResultRecommendationBadge lead={activeResultLead} />
                      <p className="text-sm leading-7 text-slate-600">
                        {activeResultLead.aiAnalysis.reasoning}
                      </p>
                      <div className="space-y-2">
                        <div className="section-label">Hooks</div>
                        {activeResultLead.aiAnalysis.compatibilityHooks.map(
                          (hook, index) => (
                            <div
                              key={`${hook}-${index}`}
                              className="surface-muted p-3 text-sm text-slate-700"
                            >
                              {hook}
                            </div>
                          ),
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Run AI Enhance to generate a compatibility summary before
                      saving this lead.
                    </p>
                  )}
                </section>

                <section className="surface-muted p-5">
                  <div className="section-label">Next step</div>
                  <p className="mt-2 text-sm text-slate-600">
                    Save this lead into the dashboard if you want to run email
                    discovery, generate outreach drafts, or work it alongside
                    the rest of the session.
                  </p>
                </section>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
