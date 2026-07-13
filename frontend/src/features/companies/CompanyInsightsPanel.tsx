import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Clock } from 'lucide-react';

interface CompanyInsightsPanelProps {
  companyId: string;
  companyName: string;
  onClose: () => void;
}

export const CompanyInsightsPanel: React.FC<CompanyInsightsPanelProps> = ({ companyId, companyName, onClose }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['company-insights', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/insights`);
      if (!res.ok) throw new Error('Failed to load company insights');
      return res.json();
    }
  });

  if (isLoading) {
    return <div className="p-6 text-center text-[#94a3b8] animate-pulse">Loading Insights and Trends...</div>;
  }

  if (error || !data) {
    return <div className="p-6 text-center text-red-400">Error loading insights: {(error as any)?.message}</div>;
  }

  const { hiringTrend, averageJobs, commonTechnologies, mostFrequentRoles, typicalExperience, mostActiveLocations, scraperHealth } = data;

  return (
    <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-[#232d3f] pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">{companyName} Insights</h2>
          <p className="text-xs text-[#94a3b8]">Telemetry and hiring trends overview</p>
        </div>
        <button onClick={onClose} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer">
          Close Insights
        </button>
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
