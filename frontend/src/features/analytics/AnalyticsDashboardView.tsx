import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart2, TrendingUp, Award, CheckCircle2, PieChart, Layers } from 'lucide-react';

export const AnalyticsDashboardView: React.FC = () => {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to load stats');
      return res.json();
    },
  });

  const { data: boardData } = useQuery({
    queryKey: ['kanban', 'board'],
    queryFn: async () => {
      const res = await fetch('/api/v1/applications/board');
      if (!res.ok) throw new Error('Failed to fetch board');
      const json = await res.json();
      return json.data;
    },
  });

  const stats = statsData?.stats || {};
  const totalApps = boardData?.totalApplications || stats.applications || 0;
  const interviewCount = boardData?.columns?.Interview?.count || stats.interviews || 0;
  const offerCount = boardData?.columns?.Offer?.count || 0;
  const rejectedCount = boardData?.columns?.Rejected?.count || 0;

  const interviewRate = totalApps > 0 ? Math.round((interviewCount / totalApps) * 100) : 0;
  const offerRate = totalApps > 0 ? Math.round((offerCount / totalApps) * 100) : 0;
  const rejectionRate = totalApps > 0 ? Math.round((rejectedCount / totalApps) * 100) : 0;

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto min-h-screen text-white">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-cyan-400 via-teal-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
          <BarChart2 className="w-8 h-8 text-cyan-400" /> Career Analytics & Conversion Metrics
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Real-time pipeline conversion rates, interview velocity, and stage distribution insights.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-[#131a26] rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Conversion Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-5 shadow-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Tracked</span>
                <span className="text-2xl font-black text-white">{totalApps}</span>
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                <Layers className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-5 shadow-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Interview Rate</span>
                <span className="text-2xl font-black text-purple-400">{interviewRate}%</span>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-5 shadow-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Offer Rate</span>
                <span className="text-2xl font-black text-emerald-400">{offerRate}%</span>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                <Award className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-5 shadow-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Rejection Rate</span>
                <span className="text-2xl font-black text-rose-400">{rejectionRate}%</span>
              </div>
              <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400">
                <PieChart className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Stage Breakdown Grid */}
          <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 shadow-xl">
            <h2 className="font-bold text-base text-slate-100 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-cyan-400" /> Pipeline Stage Breakdown
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {boardData?.columns &&
                Object.entries(boardData.columns).map(([stage, col]: [string, any]) => (
                  <div key={stage} className="bg-[#0b0f19] border border-[#232d3f] p-3.5 rounded-xl text-center">
                    <span className="text-xs text-slate-400 block truncate mb-1">{stage}</span>
                    <span className="text-lg font-bold text-indigo-400">{col.count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
