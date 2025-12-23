'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ScraperPage() {
  const [activeTab, setActiveTab] = useState('input');
  const [formData, setFormData] = useState({
    categories: '',
    plainQueries: '',
    exactMatch: false,
    country: 'US',
    location: '',
    customLocations: '',
    maxResults: 0,
    language: 'en',
    placesPerQuery: 500,
    skip: 0,
    deleteDuplicates: true,
    useZipCodes: false,
    taskTitle: '',
    resultExtension: '.json',
    taskTags: '',
    columns: [],
    leadPurpose: '', // Added for AI Enhance later
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const val = type === 'checkbox' ? e.target.checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setResults(data.results);
        setActiveTab('results');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to connect to scraper API');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnhanceAll = async () => {
    if (!results || results.length === 0) return;
    if (!formData.leadPurpose) {
      alert("Please enter a 'Contact Purpose' in the Input tab first.");
      setActiveTab('input');
      return;
    }

    setIsEnhancing(true);
    try {
      const response = await fetch('/api/enhance/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: results,
          leadPurpose: formData.leadPurpose
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResults(data.results);
      } else {
        alert('Enhancement failed: ' + data.error);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to connect to enhancement API');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSaveResults = async () => {
    if (!results || results.length === 0) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/leads/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: results }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Successfully saved ${data.count} leads to results!`);
        window.location.href = '/results';
      } else {
        alert('Save failed: ' + data.error);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to connect to save API');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    if (!results || results.length === 0) return;

    const headers = ['Name', 'Address', 'Phone', 'Website', 'Rating', 'Reviews', 'Type', 'Compatibility Score', 'Recommendation', 'Reasoning'];
    const csvContent = [
      headers.join(','),
      ...results.map(r => [
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
    link.setAttribute('download', `scraper_results_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 font-sans">
      {/* Header */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-bold text-xl tracking-tight text-blue-600">LeadIntel</Link>
            <div className="h-6 w-px bg-slate-200" />
            <h2 className="text-slate-600 font-medium">Google Maps Scraper</h2>
          </div>
          <div className="flex items-center gap-3">
             <Link href="/results" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2">View Results</Link>
             <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all shadow-sm shadow-blue-200">
               New Scrape
             </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Info */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-slate-800">Google Maps Scraper</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Returns places data from Google Maps. Get names, addresses, ratings, websites and more.
              </p>

              <div className="space-y-3">
                <a href="#" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <span className="w-5 h-5 flex items-center justify-center bg-blue-50 rounded text-[10px] font-bold">$$</span>
                  Pricing
                </a>
                <a href="#" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <span className="w-5 h-5 flex items-center justify-center bg-blue-50 rounded text-[10px] font-bold">DOC</span>
                  API Docs
                </a>
                <a href="#" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                    <span className="w-5 h-5 flex items-center justify-center bg-blue-50 rounded text-[10px] font-bold">PRD</span>
                  Product Page
                </a>
              </div>
            </div>

            <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-100 relative overflow-hidden group">
               <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
               <h4 className="font-bold mb-2 relative">New! AI Enhance</h4>
               <p className="text-blue-100 text-xs mb-4 relative">
                 Check compatibility of leads with your contact purpose automatically.
               </p>
               <button className="bg-white text-blue-600 w-full py-2 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors relative">
                 How it works
               </button>
            </div>
          </div>

          {/* Main Form Area */}
          <div className="lg:col-span-9">
            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
              <button
                onClick={() => setActiveTab('input')}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'input' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Input
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'results' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                disabled={!results}
              >
                Results {results ? `(${results.length})` : ''}
              </button>
            </div>

            {activeTab === 'input' && (
              <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* Section 1: Categories & Queries */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div className="border-l-4 border-blue-600 pl-4">
                    <h3 className="text-xl font-bold text-slate-800">1. Define Targets</h3>
                    <p className="text-slate-500 text-sm">Choose what kind of places you want to find.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700">Categories/brands</label>
                       <input
                         name="categories"
                         value={formData.categories}
                         onChange={handleInputChange}
                         placeholder="e.g. Doctor, Restaurant, F&B"
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm"
                       />
                       <p className="text-[10px] text-slate-400">Try: Doctor, Restaurant, Top 250, Top 500</p>
                    </div>

                    <div className="space-y-2">
                       <div className="flex items-center justify-between">
                         <label className="text-sm font-bold text-slate-700">Plain queries</label>
                         <div className="flex items-center gap-2">
                           <span className="text-[10px] font-bold text-slate-500">Exact match</span>
                           <input
                             type="checkbox"
                             name="exactMatch"
                             checked={formData.exactMatch}
                             onChange={handleInputChange}
                             className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                           />
                         </div>
                       </div>
                       <textarea
                         name="plainQueries"
                         value={formData.plainQueries}
                         onChange={handleInputChange}
                         placeholder="Enter search queries (one per line)"
                         rows={2}
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm resize-none"
                       />
                    </div>
                  </div>
                </div>

                {/* Section 2: Locations */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div className="border-l-4 border-emerald-500 pl-4">
                    <h3 className="text-xl font-bold text-slate-800">2. Locations</h3>
                    <p className="text-slate-500 text-sm">Where should we look for these leads?</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700">Country</label>
                       <select
                         name="country"
                         value={formData.country}
                         onChange={handleInputChange}
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm"
                       >
                         <option value="US">United States</option>
                         <option value="GB">United Kingdom</option>
                         <option value="DE">Germany</option>
                         <option value="CA">Canada</option>
                         <option value="AU">Australia</option>
                       </select>
                       <p className="text-[10px] text-slate-400">Try: US, GB, DE, CA, AU</p>
                    </div>

                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700">Cities/Jurisdictions</label>
                       <input
                         name="location"
                         value={formData.location}
                         onChange={handleInputChange}
                         placeholder="Search states/cities..."
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm"
                       />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Custom locations</label>
                    <textarea
                      name="customLocations"
                      value={formData.customLocations}
                      onChange={handleInputChange}
                      placeholder="Add custom locations if needed"
                      rows={2}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm resize-none"
                    />
                  </div>
                </div>

                {/* Section 3: Parameters & Filters */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                   <div className="border-l-4 border-amber-500 pl-4">
                    <h3 className="text-xl font-bold text-slate-800">3. Advanced Parameters</h3>
                    <p className="text-slate-500 text-sm">Refine your search results and limits.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700">Max Results limit</label>
                       <input
                         type="number"
                         name="maxResults"
                         value={formData.maxResults}
                         onChange={handleInputChange}
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm"
                       />
                       <p className="text-[10px] text-slate-400">0 = unlimited</p>
                     </div>

                     <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700">Places per query</label>
                       <input
                         type="number"
                         name="placesPerQuery"
                         value={formData.placesPerQuery}
                         onChange={handleInputChange}
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm"
                       />
                       <p className="text-[10px] text-slate-400">Default: 500</p>
                     </div>

                     <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Language</label>
                        <select
                          name="language"
                          value={formData.language}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm"
                        >
                          <option value="en">English (US)</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                        </select>
                     </div>
                  </div>

                  <div className="flex flex-wrap gap-6 pt-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        name="deleteDuplicates"
                        checked={formData.deleteDuplicates}
                        onChange={handleInputChange}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Delete duplicates</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        name="useZipCodes"
                        checked={formData.useZipCodes}
                        onChange={handleInputChange}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Use zip codes</span>
                    </label>
                  </div>
                </div>

                {/* Section 4: AI Enhance - The Special Field */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-100 shadow-sm space-y-6">
                  <div className="border-l-4 border-indigo-600 pl-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-slate-800">4. AI Enhancement</h3>
                        <span className="bg-indigo-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded">NEW</span>
                    </div>
                    <p className="text-slate-500 text-sm">Automatically verify leads against your sales goals.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Why do you need these leads? (Contact Purpose)</label>
                    <textarea
                      name="leadPurpose"
                      value={formData.leadPurpose}
                      onChange={handleInputChange}
                      placeholder="e.g. I need leads to create websites for, offering SEO and performance optimization..."
                      rows={3}
                      className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm resize-none"
                    />
                    <p className="text-xs text-indigo-400">This will be used to analyze compatibility after the data is gathered.</p>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                   <button
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-200"
                   >
                     {isLoading ? (
                       <>
                         <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                         Gathering Data...
                       </>
                     ) : (
                       'Get Data →'
                     )}
                   </button>
                </div>
              </form>
            )}

            {activeTab === 'results' && results && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                   <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-slate-800">Scraped Results</h3>
                        <p className="text-xs text-slate-500">Found {results.length} places</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleExportCSV}
                          className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-white border border-slate-200 rounded-lg transition-colors"
                        >
                          Export CSV
                        </button>
                        <button
                          onClick={handleEnhanceAll}
                          disabled={isEnhancing}
                          className="px-6 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all disabled:opacity-50"
                        >
                          {isEnhancing ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                              Analyzing...
                            </div>
                          ) : '✨ AI Enhance'}
                        </button>
                        <button
                          onClick={handleSaveResults}
                          disabled={isSaving}
                          className="px-6 py-2 text-sm font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-md shadow-slate-100 transition-all disabled:opacity-50"
                        >
                           {isSaving ? 'Saving...' : 'Save to Results'}
                        </button>
                      </div>
                   </div>

                   <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Business Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Info</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Analysis</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Score</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {results.map((r, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                               <td className="px-6 py-4">
                                 <div className="font-bold text-slate-800">{r.name}</div>
                                 <div className="text-[10px] text-slate-400 uppercase tracking-wider">{r.type || 'Business'}</div>
                               </td>
                               <td className="px-6 py-4">
                                 <div className="text-sm text-slate-600 truncate max-w-[200px]">{r.address}</div>
                                 {r.website && <div className="text-sm text-blue-500 font-medium truncate max-w-[200px]">{r.website}</div>}
                                 {r.phone && <div className="text-[10px] text-slate-400">{r.phone}</div>}
                               </td>
                               <td className="px-6 py-4">
                                  {r.aiAnalysis ? (
                                    <div className="space-y-1">
                                      <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded w-fit ${
                                        r.aiAnalysis.recommendation === 'Highly Recommended' ? 'bg-green-100 text-green-700' :
                                        r.aiAnalysis.recommendation === 'Recommended' ? 'bg-blue-100 text-blue-700' :
                                        'bg-slate-100 text-slate-600'
                                      }`}>
                                        {r.aiAnalysis.recommendation}
                                      </div>
                                      <div className="text-[10px] text-slate-600 italic line-clamp-2 max-w-[250px]">
                                        {r.aiAnalysis.reasoning}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-slate-400">Not analyzed yet</div>
                                  )}
                               </td>
                               <td className="px-6 py-4">
                                 {r.aiAnalysis ? (
                                   <div className={`text-lg font-black ${
                                     r.aiAnalysis.compatibilityScore >= 80 ? 'text-green-600' :
                                     r.aiAnalysis.compatibilityScore >= 50 ? 'text-blue-600' :
                                     'text-slate-400'
                                   }`}>
                                     {r.aiAnalysis.compatibilityScore}%
                                   </div>
                                 ) : '-'}
                               </td>
                               <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                    r.aiAnalysis ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {r.aiAnalysis ? 'ENHANCED' : 'RAW DATA'}
                                  </span>
                               </td>
                            </tr>
                          ))}
                        </tbody>
                     </table>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modern Footer style */}
      <footer className="mt-20 border-t border-slate-200 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="text-slate-400 text-sm italic">"Intelligence is the ultimate leverage."</div>
           <div className="flex gap-8 text-slate-400 text-sm font-medium">
              <a href="#" className="hover:text-slate-900 transition-colors">Documentation</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Support</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
           </div>
        </div>
      </footer>
    </div>
  );
}
