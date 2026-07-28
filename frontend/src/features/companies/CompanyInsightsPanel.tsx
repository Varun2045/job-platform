import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Clock, Pencil, Check, X, ExternalLink, Globe } from 'lucide-react';

interface CompanyInsightsPanelProps {
  companyId: string;
  companyName: string;
  onClose: () => void;
}

export const CompanyInsightsPanel: React.FC<CompanyInsightsPanelProps> = ({ companyId, companyName, onClose }) => {
  const queryClient = useQueryClient();
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [editUrlVal, setEditUrlVal] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['company-insights', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/insights`);
      if (!res.ok) throw new Error('Failed to load company insights');
      return res.json();
    }
  });

  useEffect(() => {
    if (data?.api_endpoint) {
      setEditUrlVal(data.api_endpoint);
    }
  }, [data?.api_endpoint]);

  const updateUrlMutation = useMutation({
    mutationFn: async (newEndpoint: string) => {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_endpoint: newEndpoint || null })
      });
      if (!res.ok) throw new Error('Failed to update career URL');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-insights', companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setIsEditingUrl(false);
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
    }
  });

  const handleSaveUrl = () => {
    updateUrlMutation.mutate(editUrlVal.trim());
  };

  if (isLoading) {
    return <div className="p-6 text-center text-[#94a3b8] animate-pulse">Loading Insights and Trends...</div>;
  }

  if (error || !data) {
    return <div className="p-6 text-center text-red-400">Error loading insights: {(error as any)?.message}</div>;
  }

  const { api_endpoint, hiringTrend, averageJobs, commonTechnologies, mostFrequentRoles, typicalExperience, mostActiveLocations, scraperHealth } = data;

  return (
    <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-[#232d3f] pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">{companyName} Insights</h2>
          <p className="text-xs text-[#94a3b8]">Telemetry, portal settings, and hiring trends</p>
        </div>
        <button onClick={onClose} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer">
          Close Insights
        </button>
      </div>

      {/* Editable Career Portal URL Section */}
      <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Career Portal URL</span>
            {saveSuccessMsg && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" /> Updated Live
              </span>
            )}
          </div>

          {isEditingUrl ? (
            <div className="flex items-center gap-2 mt-2 w-full">
              <input
                type="url"
                value={editUrlVal}
                onChange={(e) => setEditUrlVal(e.target.value)}
                placeholder="https://careers.company.com"
                className="bg-[#0b0f19] border border-indigo-500/60 rounded-lg px-3 py-1.5 text-xs text-white w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={handleSaveUrl}
                disabled={updateUrlMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 text-xs rounded-lg font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Check className="w-3.5 h-3.5" /> Save
              </button>
              <button
                onClick={() => {
                  setIsEditingUrl(false);
                  setEditUrlVal(api_endpoint || '');
                }}
                className="bg-[#232d3f] hover:bg-[#2e3b52] text-[#94a3b8] px-2.5 py-1.5 text-xs rounded-lg font-bold transition cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1.5 min-w-0">
              <span className="text-xs font-semibold text-indigo-300 truncate">
                {api_endpoint || 'No career URL configured'}
              </span>
              {api_endpoint && (
                <a href={api_endpoint} target="_blank" rel="noopener noreferrer" className="text-[#64748b] hover:text-white shrink-0">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
        </div>

        {!isEditingUrl && (
          <button
            onClick={() => setIsEditingUrl(true)}
            className="bg-[#0b0f19] hover:bg-[#192438] text-indigo-400 hover:text-indigo-300 border border-[#232d3f] px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit Link
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Scraper Health</span>
            <div className="text-sm font-bold text-white mt-1">
              {scraperHealth.totalFailures === 0 ? 'Healthy' : `${scraperHealth.totalFailures} Failures`}
            </div>
          </div>
          <Activity className={`w-5 h-5 ${scraperHealth.totalFailures === 0 ? 'text-emerald-400' : 'text-red-400'}`} />
        </div>

        <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Avg Latency</span>
            <div className="text-sm font-bold text-white mt-1">
              {scraperHealth.avgResponseTimeMs ? `${(scraperHealth.avgResponseTimeMs / 1000).toFixed(1)}s` : '--'}
            </div>
          </div>
          <Clock className="w-5 h-5 text-indigo-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#94a3b8]">
        <div className="bg-[#1b2535] p-3 rounded-xl border border-[#232d3f]">
          <span className="font-bold text-white block mb-1">Most Frequent Roles</span>
          <ul className="list-disc list-inside space-y-0.5">
            {mostFrequentRoles.map((r: string) => <li key={r}>{r}</li>)}
          </ul>
        </div>
        <div className="bg-[#1b2535] p-3 rounded-xl border border-[#232d3f]">
          <span className="font-bold text-white block mb-1">Active Locations</span>
          <ul className="list-disc list-inside space-y-0.5">
            {mostActiveLocations.map((l: string) => <li key={l}>{l}</li>)}
          </ul>
        </div>
        <div className="bg-[#1b2535] p-3 rounded-xl border border-[#232d3f]">
          <span className="font-bold text-white block mb-1">Typical Profile</span>
          <div className="text-white font-bold mt-1 text-sm">{typicalExperience}</div>
          <div className="text-[10px] mt-0.5">Avg jobs per sync: {averageJobs}</div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Hiring Volume Trend</h4>
        <div className="h-44">
          {hiringTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hiringTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232d3f" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} />
                <YAxis stroke="#94a3b8" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: '#131a26', borderColor: '#232d3f', color: '#fff' }} />
                <Line type="monotone" dataKey="count" stroke="#818cf8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-[#94a3b8] py-12 text-xs">No trend logs recorded yet.</div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Common Technologies Used</h4>
        <div className="h-44">
          {commonTechnologies.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={commonTechnologies}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232d3f" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                <YAxis stroke="#94a3b8" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: '#131a26', borderColor: '#232d3f', color: '#fff' }} />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-[#94a3b8] py-12 text-xs">No technical keywords parsed.</div>
          )}
        </div>
      </div>
    </div>
  );
};
