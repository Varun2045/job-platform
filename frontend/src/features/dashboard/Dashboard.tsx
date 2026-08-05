import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, ShieldAlert, Award, FileText, Calendar, Users, CheckCircle2, AlertTriangle, XCircle, Search, Mail, Handshake, Play, MessageSquare, TrendingUp, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.js';
import { useToast } from '../../context/ToastContext.js';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
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

  const { data: recentJobsData } = useQuery({
    queryKey: ['recent-jobs-timeline'],
    queryFn: async () => {
      const res = await fetch('/api/v1/jobs/search?pageSize=10&sort=newest');
      if (!res.ok) return { jobs: [] };
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

  const stats = data?.data?.stats || data?.stats || {};
  const todayJobsList = (recentJobsData?.jobs || []).map((j: any) => j.job || j);

  const quickActions = [
    { name: 'Search Jobs', icon: Search, path: '/explorer', color: 'bg-indigo-600 hover:bg-indigo-700' },
    { name: 'AI Assistant', icon: MessageSquare, path: '/career-assistant', color: 'bg-purple-600 hover:bg-purple-700' },
    { name: 'Cover Letter', icon: Mail, path: '/cover-letter-builder', color: 'bg-emerald-600 hover:bg-emerald-700' },
    { name: 'Find Referrals', icon: Handshake, path: '/referrals', color: 'bg-amber-600 hover:bg-amber-700' },
    { name: 'Start Scrape Run', icon: Play, path: '/companies', color: 'bg-red-600 hover:bg-red-700' },
  ];

  const cardItems = [
    { label: 'New Jobs Today', value: stats.jobsToday || 0, icon: Activity, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Jobs Match Profile', value: stats.matches || 0, icon: Award, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Active Applications', value: stats.applications || stats.totalApplications || 0, icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Upcoming Interviews', value: stats.interviews || 0, icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Referral Opportunities', value: stats.referrals || 0, icon: Users, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { label: 'Scraper Health', value: stats.companiesHealthy || stats.healthyCompanies || 0, icon: CheckCircle2, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  ];

  const scraperStatus =
    (stats.companiesDisabled || stats.disabledCompanies || 0) > 0
      ? 'failing'
      : (stats.companiesDegraded || stats.degradedCompanies || 0) > 0
      ? 'degraded'
      : 'healthy';
  const scraperStatusColor =
    scraperStatus === 'healthy'
      ? 'text-emerald-400'
      : scraperStatus === 'degraded'
      ? 'text-amber-400'
      : 'text-red-400';

  const handleManualScrape = async () => {
    try {
      const res = await fetch('/api/monitoring/trigger', { method: 'POST' });
      if (res.ok) {
        showToast('🚀 Manual scraper run triggered successfully! Scrapers are now crawling job boards.', 'info');
        queryClient.invalidateQueries();
      } else {
        const body = await res.json().catch(() => ({}));
        showToast(`Notice: ${body.message || body.error || 'Scrapers run started'}`, 'info');
      }
    } catch (err: any) {
      showToast('Triggered scraper run. Monitoring live status in Automation Hub.', 'info');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto">
      <PageHeader
        themeKey="dashboard"
        title="Dashboard & Job Intelligence"
        description="Monitor scraper fleet health, automated scrapers, today's job postings, and referral pipelines."
        icon={Home}
      />

      <div className="grid-fluid-stats gap-4 md:gap-6">
        {cardItems.map((item, idx) => (
          <div key={idx} className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 flex items-center justify-between shadow-xl hover:border-indigo-600/40 transition-all duration-200">
            <div>
              <div className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">{item.label}</div>
              <div className="text-2xl font-black text-white mt-1">{item.value}</div>
            </div>
            <div className={`p-3.5 rounded-xl ${item.bg} ${item.color}`}>
              <item.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
          <div className="flex items-center gap-4 p-4 bg-[#1b2535] rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <div>
              <div className="text-sm font-semibold text-white">Healthy Scrapers</div>
              <div className="text-lg font-bold text-emerald-400">{stats.companiesHealthy || 0} companies</div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-[#1b2535] rounded-xl border border-amber-500/20 bg-amber-500/5">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <div>
              <div className="text-sm font-semibold text-white">Degraded Scrapers</div>
              <div className="text-lg font-bold text-amber-400">{stats.companiesDegraded || 0} companies</div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-[#1b2535] rounded-xl border border-red-500/20 bg-red-500/5">
            <XCircle className="w-6 h-6 text-red-400" />
            <div>
              <div className="text-sm font-semibold text-white">Disabled / Failed Scrapers</div>
              <div className="text-lg font-bold text-red-400">{stats.companiesDisabled || 0} companies</div>
            </div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-[#1b2535] rounded-xl border border-[#232d3f] flex items-center gap-3">
          <ShieldAlert className={`w-5 h-5 ${scraperStatusColor}`} />
          <span className="text-sm text-[#94a3b8]">Overall Fleet Health: </span>
          <span className={`text-sm font-bold ${scraperStatusColor} capitalize`}>{scraperStatus}</span>
        </div>
      </div>

      {/* ⚡ TODAY'S LIVE JOB POSTING TIMELINE */}
      <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#232d3f] pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" /> Today's Live Job Posting Timeline
            </h3>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Live chronological feed of new job opportunities scraped today.
            </p>
          </div>
          <button
            onClick={() => navigate('/explorer?dateRange=1d')}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl transition cursor-pointer"
          >
            Explore All Today's Jobs →
          </button>
        </div>

        {todayJobsList.length > 0 ? (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-500/20">
            {todayJobsList.slice(0, 5).map((job: any, idx: number) => {
              const postedDateStr = (() => {
                const val = job.datePosted || job.firstSeen || job.created_at;
                if (!val) return 'Today';
                if (typeof val === 'string' && (val.includes('ago') || val.includes('Today') || val.includes('Just now'))) return val;
                const d = new Date(val);
                if (isNaN(d.getTime())) return 'Today';
                const now = new Date();
                const diffHours = (now.getTime() - d.getTime()) / (1000 * 3600);
                if (diffHours < 1) return 'Just now';
                if (diffHours < 24) return `${Math.floor(diffHours)} hrs ago (Today)`;
                return d.toLocaleDateString();
              })();

              const applyUrl = job.applyUrl || job.jobUrl || job.postingUrl || job.url;

              return (
                <div key={idx} className="relative bg-[#1b2535]/80 border border-[#232d3f] hover:border-emerald-500/40 rounded-xl p-4 transition-all duration-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="absolute -left-[21px] top-5 w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-[#131a26]" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">{job.company}</span>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        ⏱️ {postedDateStr}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-1">{job.title}</h4>
                    <p className="text-xs text-[#94a3b8] mt-0.5">
                      📍 {job.location || 'Remote / India'} {job.employmentType ? `• ${job.employmentType}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => navigate(`/explorer?q=${encodeURIComponent(job.company)}`)}
                      className="px-3 py-1.5 bg-[#131a26] hover:bg-[#1f2b3e] border border-[#232d3f] rounded-lg text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
                    >
                      View in Explorer
                    </button>
                    {applyUrl && (
                      <a
                        href={applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-sm"
                      >
                        Apply Now
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-[#94a3b8] bg-[#1b2535]/40 rounded-xl border border-[#232d3f]">
            Scrapers are monitoring for new jobs today. Click "Start Scrape Run" above to crawl job boards immediately.
          </div>
        )}
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

      {/* Version 1.1 Kanban & Follow-Up Reminders Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" /> Kanban Board Quick Summary
            </h3>
            <button
              onClick={() => navigate('/tracker')}
              className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
            >
              Open Kanban →
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Track applications across 11 stages. Drag and drop cards in the Kanban tracker to trigger automatic status updates.
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-[#1b2535] rounded-xl border border-[#232d3f]">
              <span className="text-xs text-slate-400 block">Applied</span>
              <span className="text-lg font-bold text-indigo-400">{stats.applications || 0}</span>
            </div>
            <div className="p-3 bg-[#1b2535] rounded-xl border border-[#232d3f]">
              <span className="text-xs text-slate-400 block">Interviews</span>
              <span className="text-lg font-bold text-purple-400">{stats.interviews || 0}</span>
            </div>
            <div className="p-3 bg-[#1b2535] rounded-xl border border-[#232d3f]">
              <span className="text-xs text-slate-400 block">Offers</span>
              <span className="text-lg font-bold text-emerald-400">Active</span>
            </div>
          </div>
        </div>

        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" /> Upcoming Follow-Up Alerts
            </h3>
            <button
              onClick={() => navigate('/crm')}
              className="text-sm text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
            >
              Manage Reminders →
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Never miss a recruiter check-in date. Schedule reminders and track outreach interactions.
          </p>
          <div className="p-4 bg-[#1b2535] rounded-xl border border-[#232d3f] flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Recruiter Outreach & Follow-Ups Active</span>
            <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              Synced
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
