import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#a855f7'];

export const Analytics: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to load telemetry');
      return res.json();
    }
  });

  if (isLoading) {
    return <div className="p-8 animate-pulse text-[#94a3b8]">Loading System Analytics...</div>;
  }

  const { stats, charts } = data;

  const funnelData = [
    { name: 'Matches', value: stats.matches },
    { name: 'Applications', value: stats.applications },
    { name: 'Interviews', value: stats.interviews },
    { name: 'Offers', value: stats.offers }
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">System Analytics</h1>
        <p className="text-sm text-[#94a3b8]">Scrape patterns and job application conversion rates</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Application Pipeline Funnel</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#232d3f" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#131a26', borderColor: '#232d3f', color: '#fff' }} />
                <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Scraped Jobs Share</h3>
          <div className="h-64 flex justify-center items-center">
            {charts.companies && charts.companies.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.companies}
                    dataKey="jobsFound"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {charts.companies.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#131a26', borderColor: '#232d3f', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-[#94a3b8] text-xs">No active scrapers logs found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
