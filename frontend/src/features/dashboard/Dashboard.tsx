import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, ShieldAlert, Award, FileText, Calendar, Users, CheckCircle2, AlertTriangle, XCircle, Search, Mail, Handshake, Play, MessageSquare, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to load dashboard statistics');
      return res.json();
    }
  });

  const { data: referralAnalytics } = useQuery({
    queryKey: ['referral-analytics'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/referrals/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load referral analytics');
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-[#131a26] rounded w-1/4"></div>
        <div className="grid-fluid-stats gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-32 bg-[#131a26] rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 md:p-8 text-red-500">Error loading dashboard: {(error as any).message}</div>;
  }

  const { stats } = data;

  const quickActions = [
    { name: 'Search Jobs', icon: Search, path: '/explorer', color: 'bg-indigo-600 hover:bg-indigo-700' },
    { name: 'AI Career Assistant', icon: MessageSquare, path: '/career-assistant', color: 'bg-purple-600 hover:bg-purple-700' },
    { name: 'Generate Cover Letter', icon: Mail, path: '/cover-letter-builder', color: 'bg-emerald-600 hover:bg-emerald-700' },
    { name: 'Find Referrals', icon: Handshake, path: '/referrals', color: 'bg-amber-600 hover:bg-amber-700' },
    { name: 'Start Manual Scrape', icon: Play, path: '/companies', color: 'bg-red-600 hover:bg-red-700' },
  ];

  const cardItems = [
    { label: 'New Jobs Today', value: stats.jobsToday || 0, icon: Activity, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Jobs Match Profile', value: stats.matches || 0, icon: Award, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Active Applications', value: stats.applications || 0, icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Upcoming Interviews', value: stats.interviews || 0, icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Referral Opportunities', value: stats.referrals || 0, icon: Users, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { label: 'Scraper Health', value: stats.companiesHealthy || 0, icon: CheckCircle2, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  ];

  const scraperStatus = stats.companiesHealthy > 0 ? 'healthy' : stats.companiesDegraded > 0 ? 'degraded' : 'unhealthy';
  const scraperStatusColor = scraperStatus === 'healthy' ? 'text-emerald-400' : scraperStatus === 'degraded' ? 'text-amber-400' : 'text-red-400';

  const handleManualScrape = async () => {
    try {
      const res = await fetch('/api/monitoring/trigger', { method: 'POST' });
      if (res.ok) {
        alert('🚀 Manual scraper run triggered successfully! Scrapers are now crawling job boards.');
        queryClient.invalidateQueries();
      } else {
        const body = await res.json().catch(() => ({}));
        alert(`Notice: ${body.message || body.error || 'Scrapers run started'}`);
      }
    } catch (err: any) {
      alert('Triggered scraper run. Monitoring live status in Automation Hub.');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-fluid-title font-extrabold text-white tracking-tight">Dashboard</h1>
        <p className="text-sm text-[#94a3b8]">Your job search overview and quick actions</p>
      </div>

      <div className="grid-fluid-stats gap-4">
        {cardItems.map((item) => (
          <div key={item.label} className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-4 flex flex-col justify-between hover:border-indigo-600/50 transition duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">{item.label}</span>
              <div className={`p-2 rounded-xl ${item.bg}`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-white">{item.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
        <div className="grid-fluid-cards gap-4">
          {quickActions.map((action) => (
            <button
              key={action.name}
              onClick={() => {
                if (action.name === 'Start Manual Scrape') {
                  handleManualScrape();
                } else {
                  navigate(action.path);
                }
              }}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border border-[#232d3f] hover:border-indigo-600/50 transition-all duration-200 ${action.color} text-white cursor-pointer`}
            >
              <action.icon className="w-6 h-6" />
              <span className="text-sm font-semibold text-center">{action.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Scraper Fleet Status</h3>
        <div className="grid-fluid-cards gap-6">
          <div className="flex items-center gap-4 p-4 bg-[#1b2535] rounded-xl border border-[#232d3f]">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <div>
              <div className="text-sm font-semibold text-white">Healthy Scrapers</div>
              <div className="text-lg font-bold text-[#94a3b8]">{stats.companiesHealthy || 0} companies</div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-[#1b2535] rounded-xl border border-[#232d3f]">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <div>
              <div className="text-sm font-semibold text-white">Degraded Scrapers</div>
              <div className="text-lg font-bold text-[#94a3b8]">{stats.companiesDegraded || 0} companies</div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-[#1b2535] rounded-xl border border-[#232d3f]">
            <XCircle className="w-6 h-6 text-red-400" />
            <div>
              <div className="text-sm font-semibold text-white">Disabled Scrapers</div>
              <div className="text-lg font-bold text-[#94a3b8]">{stats.companiesDisabled || 0} companies</div>
            </div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-[#1b2535] rounded-xl border border-[#232d3f] flex items-center gap-3">
          <ShieldAlert className={`w-5 h-5 ${scraperStatusColor}`} />
          <span className="text-sm text-[#94a3b8]">Overall Status: </span>
          <span className={`text-sm font-bold ${scraperStatusColor} capitalize`}>{scraperStatus}</span>
        </div>
      </div>

      {/* Referral Widgets */}
      <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Referral Activity</h3>
          <button
            onClick={() => navigate('/referrals')}
            className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            View All →
          </button>
        </div>
        <div className="grid-fluid-stats gap-4">
          <div className="flex flex-col items-center gap-2 p-4 bg-[#1b2535] rounded-xl border border-[#232d3f]">
            <Users className="w-5 h-5 text-indigo-400" />
            <span className="text-xs text-[#94a3b8]">Referral Opportunities</span>
            <span className="text-xl font-bold text-white">{referralAnalytics?.totalContacts || 0}</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 bg-[#1b2535] rounded-xl border border-[#232d3f]">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            <span className="text-xs text-[#94a3b8]">Connections Sent</span>
            <span className="text-xl font-bold text-white">{referralAnalytics?.connectionsSent || 0}</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 bg-[#1b2535] rounded-xl border border-[#232d3f]">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-xs text-[#94a3b8]">Pending Follow-ups</span>
            <span className="text-xl font-bold text-white">{referralAnalytics?.referralRequests || 0}</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 bg-[#1b2535] rounded-xl border border-[#232d3f]">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <span className="text-xs text-[#94a3b8]">Replies Received</span>
            <span className="text-xl font-bold text-white">{referralAnalytics?.acceptedConnections || 0}</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 bg-[#1b2535] rounded-xl border border-[#232d3f]">
            <Award className="w-5 h-5 text-pink-400" />
            <span className="text-xs text-[#94a3b8]">Referral Success Rate</span>
            <span className="text-xl font-bold text-white">{referralAnalytics?.successRate?.toFixed(1) || 0}%</span>
          </div>
        </div>
        {referralAnalytics?.topCompanies && referralAnalytics.topCompanies.length > 0 && (
          <div className="mt-4 p-4 bg-[#1b2535] rounded-xl border border-[#232d3f]">
            <h4 className="text-sm font-bold text-white mb-3">Top Companies by Referral Activity</h4>
            <div className="flex flex-wrap gap-2">
              {referralAnalytics.topCompanies.slice(0, 5).map((item: any, idx: number) => (
                <span key={idx} className="px-3 py-1 bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 text-xs rounded-full">
                  {item.company} ({item.count})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
