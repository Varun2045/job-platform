import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CompanyInsightsPanel } from './CompanyInsightsPanel.js';
import { Trash2, Pencil, Check, X } from 'lucide-react';

export const CompanyMonitor: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedComp, setSelectedComp] = useState<{ id: string; name: string } | null>(null);

  // Add Company Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newPriority, setNewPriority] = useState('2');
  const [newInterval, setNewInterval] = useState('180');
  const [newAts, setNewAts] = useState('none');
  const [newEndpoint, setNewEndpoint] = useState('');
  const [newProfiles, setNewProfiles] = useState('backend');
  const [newEnableResume, setNewEnableResume] = useState(true);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInterval, setEditInterval] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editEnableResume, setEditEnableResume] = useState(true);
  const [editProfiles, setEditProfiles] = useState('');

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await fetch('/api/companies');
      if (!res.ok) throw new Error('Failed to load companies list');
      return res.json();
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/companies/${id}/toggle`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to toggle company monitor status');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/companies/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete company');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      if (selectedComp && deleteMutation.variables === selectedComp.id) {
        setSelectedComp(null);
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, interval_minutes, priority, resume_profiles }: { id: string; interval_minutes: number; priority: number; resume_profiles?: string[] }) => {
      const res = await fetch(`/api/companies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval_minutes, priority, resume_profiles })
      });
      if (!res.ok) throw new Error('Failed to update company');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setEditingId(null);
    }
  });

  const addCompanyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newId,
          name: newName,
          priority: Number(newPriority),
          interval_minutes: Number(newInterval),
          api_endpoint: newEndpoint || null,
          detected_ats: newAts,
          resume_profiles: newEnableResume
            ? newProfiles.split(',').map(s => s.trim()).filter(Boolean)
            : ['_skip_']
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to register company');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setNewId(''); setNewName(''); setNewPriority('2'); setNewInterval('180');
      setNewAts('none'); setNewEndpoint(''); setNewProfiles('backend');
      setNewEnableResume(true);
      setShowAddForm(false);
      alert('Company scraper registered successfully!');
    },
    onError: (err: any) => alert(`Error: ${err.message}`)
  });

  if (isLoading) {
    return <div className="p-8 animate-pulse text-[#94a3b8]">Loading Scraper Fleet Statuses...</div>;
  }

  const list = companies || [];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Company Monitor</h1>
          <p className="text-sm text-[#94a3b8]">Manage scraper target platforms and fleet execution health status</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-500/20"
        >
          {showAddForm ? 'Cancel' : 'Register Scraper'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 space-y-4 max-w-2xl animate-in fade-in slide-in-from-top-4 duration-200">
          <h3 className="text-md font-bold text-white">Register Target Company Scraper</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-[#94a3b8] font-semibold">Company ID (slug, e.g. netflix)</label>
              <input type="text" value={newId} onChange={(e) => setNewId(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))} placeholder="netflix" className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-colors" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#94a3b8] font-semibold">Display Name (e.g. Netflix)</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Netflix" className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-colors" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#94a3b8] font-semibold">Scraper Priority</label>
              <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-colors">
                <option value="1">High (1)</option>
                <option value="2">Medium (2)</option>
                <option value="3">Low (3)</option>
              </select>
              <p className="text-[10px] text-[#6b7280] mt-1">
                High: Scraped first, higher retry priority, faster monitoring
              </p>
              <p className="text-[10px] text-[#6b7280]">
                Medium: Normal scheduling
              </p>
              <p className="text-[10px] text-[#6b7280]">
                Low: Lower queue priority, runs after High/Medium
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#94a3b8] font-semibold">Scrape Interval (minutes)</label>
              <input type="number" value={newInterval} onChange={(e) => setNewInterval(e.target.value)} placeholder="180" className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-colors" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#94a3b8] font-semibold">Applicant Tracking System (ATS)</label>
              <select value={newAts} onChange={(e) => setNewAts(e.target.value)} className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-colors">
                <option value="none">None (Fallback Crawl)</option>
                <option value="greenhouse">Greenhouse API</option>
                <option value="lever">Lever API</option>
                <option value="workday">Workday API</option>
                <option value="google">Google API</option>
                <option value="microsoft">Microsoft API</option>
                <option value="amazon">Amazon API</option>
                <option value="apple">Apple API</option>
                <option value="meta">Meta API</option>
              </select>
            </div>
            <div className="space-y-2 flex flex-col justify-end pb-1">
              <label className="flex items-center gap-2 text-xs text-[#94a3b8] font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newEnableResume}
                  onChange={(e) => setNewEnableResume(e.target.checked)}
                  className="rounded border-[#232d3f] text-indigo-600 focus:ring-indigo-500 bg-[#1b2535]"
                />
                Enable Resume Matching
              </label>
              <p className="text-[10px] text-[#6b7280]">
                If disabled, all postings are imported with 100% match score without resume matching.
              </p>
            </div>
            {newEnableResume && (
              <div className="space-y-1 animate-in fade-in duration-200">
                <label className="text-xs text-[#94a3b8] font-semibold">Assigned Resume Profiles (comma-separated)</label>
                <input type="text" value={newProfiles} onChange={(e) => setNewProfiles(e.target.value)} placeholder="backend, ai" className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-colors" />
                <p className="text-[10px] text-[#6b7280] mt-1">
                  This resume will be used for:
                </p>
                <p className="text-[10px] text-[#6b7280]">
                  • AI job matching & tailoring
                </p>
                <p className="text-[10px] text-[#6b7280]">
                  • Auto Apply & Cover Letters
                </p>
              </div>
            )}
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs text-[#94a3b8] font-semibold">API Endpoint or Careers Page URL</label>
              <input type="text" value={newEndpoint} onChange={(e) => setNewEndpoint(e.target.value)} placeholder="https://netflix.wd5.myworkdayjobs.com/wday/cxs/netflix/ExternalCareers" className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-colors" />
            </div>
          </div>
          <button onClick={() => addCompanyMutation.mutate()} disabled={!newId || !newName || addCompanyMutation.isPending} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-500/20">
            {addCompanyMutation.isPending ? 'Registering...' : 'Register Company'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className={`${selectedComp ? 'lg:col-span-2' : 'lg:col-span-3'} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`}>

          {list.map((c: any) => {
            const status = !c.enabled
              ? 'disabled'
              : (c.total_failures > 0 && c.last_failed_scrape && (!c.last_successful_scrape || new Date(c.last_failed_scrape) > new Date(c.last_successful_scrape)))
                ? 'degraded'
                : 'healthy';

            const statusBadgeColor = status === 'healthy'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : status === 'degraded'
                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400';

            const isEditing = editingId === c.id;

            return (
              <div key={c.id} className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white">{c.name}</h3>
                    <span className="text-xs text-[#94a3b8]">Platform: {c.detected_ats || 'auto'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusBadgeColor}`}>
                      {status}
                    </span>
                    <button
                      onClick={() => {
                        if (isEditing) {
                          setEditingId(null);
                        } else {
                          setEditingId(c.id);
                          setEditInterval(String(c.interval_minutes || 180));
                          setEditPriority(String(c.priority || 2));
                          const hasResume = !(c.resume_profiles?.includes('_skip_') || c.resume_profiles?.includes('none') || c.resume_profiles?.length === 0);
                          setEditEnableResume(hasResume);
                          setEditProfiles(c.resume_profiles?.filter((p: string) => p !== '_skip_' && p !== 'none').join(', ') || 'backend');
                        }
                      }}
                      className="p-1 hover:bg-[#232d3f] rounded text-[#94a3b8] hover:text-indigo-400 cursor-pointer transition-colors"
                      title={isEditing ? 'Cancel edit' : 'Edit settings'}
                    >
                      {isEditing ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => { if (window.confirm(`Delete ${c.name} scraper? This cannot be undone.`)) deleteMutation.mutate(c.id); }}
                      className="p-1 hover:bg-[#232d3f] rounded text-[#94a3b8] hover:text-red-400 cursor-pointer transition-colors"
                      title="Delete company"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-3 bg-[#1b2535] border border-[#232d3f] rounded-xl p-3">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Edit Settings</p>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] text-[#94a3b8] font-semibold block mb-1">Check Interval (minutes)</label>
                        <input
                          type="number"
                          value={editInterval}
                          onChange={e => setEditInterval(e.target.value)}
                          className="w-full bg-[#131a26] border border-[#232d3f] rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#94a3b8] font-semibold block mb-1">Priority</label>
                        <select
                          value={editPriority}
                          onChange={e => setEditPriority(e.target.value)}
                          className="w-full bg-[#131a26] border border-[#232d3f] rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                        >
                          <option value="1">High (1)</option>
                          <option value="2">Medium (2)</option>
                          <option value="3">Low (3)</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          id={`edit-resume-${c.id}`}
                          checked={editEnableResume}
                          onChange={e => setEditEnableResume(e.target.checked)}
                          className="rounded border-[#232d3f] text-indigo-600 focus:ring-indigo-500 bg-[#131a26]"
                        />
                        <label htmlFor={`edit-resume-${c.id}`} className="text-[10px] text-[#94a3b8] font-semibold select-none cursor-pointer">
                          Enable Resume Matching
                        </label>
                      </div>
                      {editEnableResume && (
                        <div>
                          <label className="text-[10px] text-[#94a3b8] font-semibold block mb-1">Assigned Resume Profiles</label>
                          <input
                            type="text"
                            value={editProfiles}
                            onChange={e => setEditProfiles(e.target.value)}
                            placeholder="backend, ai"
                            className="w-full bg-[#131a26] border border-[#232d3f] rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                          />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => updateMutation.mutate({
                        id: c.id,
                        interval_minutes: Number(editInterval),
                        priority: Number(editPriority),
                        resume_profiles: editEnableResume
                          ? editProfiles.split(',').map(s => s.trim()).filter(Boolean)
                          : ['_skip_']
                      })}
                      disabled={updateMutation.isPending}
                      className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold py-1.5 rounded-lg cursor-pointer transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-xs text-[#94a3b8]">
                    <div className="flex justify-between">
                      <span>Check Every:</span>
                      <span className="text-white font-semibold">{c.interval_minutes ?? 180} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Scrapes Run:</span>
                      <span className="text-white font-semibold">{c.total_scrapes ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Failures:</span>
                      <span className="text-white font-semibold">{c.total_failures ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Runtime:</span>
                      <span className="text-white font-semibold">{c.avg_response_time_ms ? `${(c.avg_response_time_ms / 1000).toFixed(1)}s` : '--'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Scrape:</span>
                      <span className="text-white font-semibold">
                        {c.last_successful_scrape ? new Date(c.last_successful_scrape).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-[#232d3f] flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedComp({ id: c.id, name: c.name })}
                    className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-600/20 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer"
                  >
                    Insights
                  </button>
                  <button
                    onClick={() => toggleMutation.mutate(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                      c.enabled
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-[#1b2535] hover:bg-[#232d3f] border border-[#232d3f] text-[#94a3b8]'
                    }`}
                  >
                    {c.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {selectedComp && (
          <div className="lg:col-span-1">
            <CompanyInsightsPanel
              companyId={selectedComp.id}
              companyName={selectedComp.name}
              onClose={() => setSelectedComp(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
export default CompanyMonitor;


