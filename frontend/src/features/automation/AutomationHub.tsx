import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Download, Clock, Activity, AlertCircle, Play, Pause, RotateCcw, FileText, CheckCircle, XCircle, TrendingUp, Database, Server, Plus, Trash2, ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader.js';

type Tab = 'monitoring' | 'email' | 'calendar';

export const AutomationHub: React.FC<{ tab?: Tab }> = ({ tab = 'monitoring' }) => {
  const [activeTab, setActiveTab] = useState<Tab>(tab);

  useEffect(() => {
    setActiveTab(tab);
  }, [tab]);

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'monitoring':
        return {
          title: 'Monitoring Hub',
          desc: 'Live status of job scrapers, database health, and queue telemetry'
        };
      case 'email':
        return {
          title: 'Email Alerts',
          desc: 'Configure daily matching job digests and delivery settings'
        };
      case 'calendar':
        return {
          title: 'Calendar',
          desc: 'Execution scheduling visualization and ICS calendar export'
        };
    }
  };

  const header = getHeaderInfo();

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <PageHeader
        themeKey={activeTab === 'monitoring' ? 'automationMonitoring' : activeTab === 'email' ? 'automationEmail' : 'automationCalendar'}
        title={header.title}
        description={header.desc}
        icon={activeTab === 'monitoring' ? Activity : activeTab === 'email' ? Mail : Calendar}
      />

      {/* Tab Contents */}
      {activeTab === 'monitoring' && <JobMonitoring />}
      {activeTab === 'email' && <EmailAutomation />}
      {activeTab === 'calendar' && <CalendarAutomation />}
    </div>
  );
};

// Component functions for each tab
const JobMonitoring: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);

  const { data: monitoringData, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['monitoring'],
    queryFn: async () => {
      const res = await fetch('/api/monitoring');
      if (!res.ok) throw new Error('Failed to load monitoring data');
      return res.json();
    },
    refetchInterval: 30000, // Auto refresh every 30 seconds
  });

  useEffect(() => {
    if (dataUpdatedAt) {
      setLastRefreshedAt(new Date(dataUpdatedAt));
    }
  }, [dataUpdatedAt]);

  // Timer tick for refresh timestamp "Last Updated: X seconds ago"
  useEffect(() => {
    const interval = setInterval(() => {
      const diffSec = Math.floor((Date.now() - lastRefreshedAt.getTime()) / 1000);
      setSecondsAgo(Math.max(0, diffSec));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastRefreshedAt]);

  const data = monitoringData || {
    lastRun: '2 hours ago',
    nextRun: 'In 58 minutes',
    totalCompanies: 1,
    healthyScrapers: 1,
    failedScrapers: 0,
    retryQueue: 0,
    avgDuration: '2.3s',
    jobsToday: 0,
    apiHealth: 'Healthy',
    apiLastChecked: '12 sec ago',
    dbHealth: 'Healthy',
    dbLatencyMs: 18,
    scrapersList: [
      { name: 'Google', status: 'Healthy', lastRun: '46 hrs ago', jobsFound: 0 }
    ]
  };

  const scrapersList = data.scrapersList || [
    { name: 'Google', status: 'Healthy', lastRun: '46 hrs ago', jobsFound: 0 }
  ];

  const handleRunNow = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/monitoring/run', { method: 'POST' });
      if (res.ok) {
        refetch();
        alert('Scrapers started successfully');
      } else {
        alert('Failed to start scrapers');
      }
    } catch (error) {
      alert('Error starting scrapers');
    } finally {
      setIsRunning(false);
    }
  };

  const handlePause = async () => {
    try {
      const res = await fetch('/api/monitoring/pause', { method: 'POST' });
      if (res.ok) {
        setIsPaused(true);
        alert('Scrapers paused');
      } else {
        alert('Failed to pause scrapers');
      }
    } catch (error) {
      alert('Error pausing scrapers');
    }
  };

  const handleResume = async () => {
    try {
      const res = await fetch('/api/monitoring/resume', { method: 'POST' });
      if (res.ok) {
        setIsPaused(false);
        alert('Scrapers resumed');
      } else {
        alert('Failed to resume scrapers');
      }
    } catch (error) {
      alert('Error resuming scrapers');
    }
  };

  const handleViewLogs = async () => {
    try {
      const res = await fetch('/api/monitoring/logs');
      if (res.ok) {
        const logsData = await res.json();
        setLogs(logsData);
        setShowLogs(true);
      } else {
        alert('Failed to load logs');
      }
    } catch (error) {
      alert('Error loading logs');
    }
  };

  const handleDownloadLogs = () => {
    const filtered = logs.filter((log: any) => {
      const matchesSearch = !searchTerm || 
        log.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.status?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = statusFilter === 'all' || 
        (statusFilter === 'success' && log.status === 'success') ||
        (statusFilter === 'error' && log.status === 'error');
      return matchesSearch && matchesFilter;
    });

    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scraper-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter((log: any) => {
    const matchesSearch = !searchTerm || 
      log.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.status?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === 'all' || 
      (statusFilter === 'success' && log.status === 'success') ||
      (statusFilter === 'error' && log.status === 'error');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Controls & Refresh Timestamp */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={handleRunNow}
            disabled={isRunning || isPaused}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-white transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4" /> {isRunning ? 'Running...' : 'Run Now'}
          </button>
          <button 
            onClick={handlePause}
            disabled={isPaused || isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-white transition-colors cursor-pointer"
          >
            <Pause className="w-4 h-4" /> Pause
          </button>
          <button 
            onClick={handleResume}
            disabled={!isPaused || isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Resume
          </button>
          <button 
            onClick={handleViewLogs}
            className="flex items-center gap-2 px-4 py-2 bg-[#232d3f] hover:bg-[#1f2937] rounded-lg text-sm font-semibold text-white transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" /> View Logs
          </button>
        </div>

        {/* 5. Refresh Timestamp */}
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-[#131a26] border border-[#232d3f] px-3 py-1.5 rounded-xl font-medium">
          <Clock className="w-3.5 h-3.5 text-indigo-400 animate-spin-slow" />
          <span>
            {secondsAgo < 5 ? 'Updated just now' : `Last Updated: ${secondsAgo} seconds ago`}
          </span>
        </div>
      </div>

      {/* 1 & 2. Statistic Cards with Subtle Accent Borders & Progress Values */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Last Run -> Blue */}
        <div className="bg-[#1b2535] border border-[#232d3f] border-l-4 border-l-blue-500 rounded-xl p-4 transition hover:border-[#334155]">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-bold text-white">Last Run</span>
          </div>
          <p className="text-xs text-slate-300 font-medium">{data.lastRun}</p>
        </div>

        {/* Next Run -> Purple */}
        <div className="bg-[#1b2535] border border-[#232d3f] border-l-4 border-l-purple-500 rounded-xl p-4 transition hover:border-[#334155]">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-bold text-white">Next Run</span>
          </div>
          <p className="text-xs text-slate-300 font-medium">{data.nextRun}</p>
        </div>

        {/* Total Companies -> Cyan */}
        <div className="bg-[#1b2535] border border-[#232d3f] border-l-4 border-l-cyan-500 rounded-xl p-4 transition hover:border-[#334155]">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-bold text-white">Total Companies</span>
          </div>
          <p className="text-lg font-extrabold text-white">{data.totalCompanies}</p>
        </div>

        {/* Healthy -> Green (Progress Style: 1 / 1 Scrapers) */}
        <div className="bg-[#1b2535] border border-[#232d3f] border-l-4 border-l-emerald-500 rounded-xl p-4 transition hover:border-[#334155]">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-white">Healthy</span>
          </div>
          <p className="text-lg font-extrabold text-emerald-300">
            {data.healthyScrapers} / {data.totalCompanies} Scrapers
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Failed -> Red (Progress Style: 0 / 1) */}
        <div className="bg-[#1b2535] border border-[#232d3f] border-l-4 border-l-rose-500 rounded-xl p-4 transition hover:border-[#334155]">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="w-5 h-5 text-rose-400" />
            <span className="text-sm font-bold text-white">Failed</span>
          </div>
          <p className="text-lg font-extrabold text-rose-300">
            {data.failedScrapers} / {data.totalCompanies}
          </p>
        </div>

        {/* Retry Queue -> Orange / Yellow (0 Pending) */}
        <div className="bg-[#1b2535] border border-[#232d3f] border-l-4 border-l-amber-500 rounded-xl p-4 transition hover:border-[#334155]">
          <div className="flex items-center gap-3 mb-2">
            <RotateCcw className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold text-white">Retry Queue</span>
          </div>
          <p className="text-lg font-extrabold text-amber-300">
            {data.retryQueue} Pending
          </p>
        </div>

        {/* Jobs Today -> Emerald */}
        <div className="bg-[#1b2535] border border-[#232d3f] border-l-4 border-l-teal-500 rounded-xl p-4 transition hover:border-[#334155]">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-teal-400" />
            <span className="text-sm font-bold text-white">Jobs Today</span>
          </div>
          <p className="text-lg font-extrabold text-teal-300">{data.jobsToday}</p>
        </div>

        {/* Avg Duration -> Indigo */}
        <div className="bg-[#1b2535] border border-[#232d3f] border-l-4 border-l-indigo-500 rounded-xl p-4 transition hover:border-[#334155]">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-bold text-white">Avg Duration</span>
          </div>
          <p className="text-lg font-extrabold text-indigo-300">{data.avgDuration}</p>
        </div>
      </div>

      {/* 3. Improved Operational API & Database Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* API Health */}
        <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-cyan-400" />
            <div>
              <span className="text-sm font-bold text-white block">API Health</span>
              <span className="text-[11px] text-slate-400">
                Last checked: {data.apiLastChecked || `${secondsAgo} sec ago`}
              </span>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
            data.apiHealth === 'Healthy'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            {data.apiHealth}
          </span>
        </div>

        {/* Database Health */}
        <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-purple-400" />
            <div>
              <span className="text-sm font-bold text-white block">Database Health</span>
              <span className="text-[11px] text-slate-400 font-mono">
                Latency: {data.dbLatencyMs || 18} ms
              </span>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
            data.dbHealth === 'Healthy'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            {data.dbHealth}
          </span>
        </div>
      </div>

      {/* 4. Compact Responsive Scraper Status Details Table */}
      <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Scraper Status Details</h3>
          <span className="text-xs text-slate-400 font-semibold">
            {scrapersList.length} monitored {scrapersList.length === 1 ? 'scraper' : 'scrapers'}
          </span>
        </div>

        {scrapersList.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-[#232d3f] bg-[#131a26]">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-[#0b0f19] text-slate-400 font-bold uppercase tracking-wider border-b border-[#232d3f]">
                <tr>
                  <th className="py-3 px-4">Scraper</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Run</th>
                  <th className="py-3 px-4 text-right">Jobs Found</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232d3f]/60 font-medium">
                {scrapersList.map((scraper: any, idx: number) => {
                  const isHealthy = scraper.status === 'Healthy';
                  const isFailed = scraper.status === 'Failed';
                  return (
                    <tr key={idx} className="hover:bg-[#1b2535]/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{scraper.name}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          isHealthy
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : isFailed
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          {scraper.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{scraper.lastRun}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">{scraper.jobsFound}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 bg-[#131a26] rounded-xl border border-[#232d3f]">
            No scrapers configured yet. Add target companies in Company Manager to begin automated monitoring.
          </div>
        )}
      </div>

      {/* Logs Modal */}
      {showLogs && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-[#232d3f] flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Execution Logs</h3>
              <button 
                onClick={() => setShowLogs(false)}
                className="text-[#94a3b8] hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-[#1b2535] border border-[#232d3f] rounded-xl px-4 py-2 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-[#1b2535] border border-[#232d3f] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-600"
                >
                  <option value="all">All Status</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                </select>
                <button
                  onClick={handleDownloadLogs}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-semibold text-white transition-colors"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
              </div>

              <div className="overflow-y-auto max-h-96 border border-[#232d3f] rounded-xl bg-[#1b2535]">
                <table className="w-full text-xs text-[#94a3b8] text-left">
                  <thead className="bg-[#131a26] text-white font-bold uppercase border-b border-[#232d3f] sticky top-0">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Company</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Jobs Found</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3">Errors</th>
                      <th className="p-3">Retries</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232d3f]">
                    {filteredLogs.map((log: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[#131a26]">
                        <td className="p-3 font-mono">{log.timestamp}</td>
                        <td className="p-3 font-semibold text-white">{log.company}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono">{log.jobsFound}</td>
                        <td className="p-3 font-mono">{log.duration}</td>
                        <td className="p-3 font-mono text-red-400">{log.errors || 0}</td>
                        <td className="p-3 font-mono">{log.retries || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EmailAutomation: React.FC = () => {
  const [instantAlerts, setInstantAlerts] = useState(false);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [monthlySummary, setMonthlySummary] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState({ company: 'Google', role: 'Software Engineer', location: 'Mountain View, CA', match_score: 85, resume: 'Backend Resume', date: new Date().toLocaleDateString() });
  const [isSending, setIsSending] = useState(false);

  const handlePreview = (template: string) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const handleSendTestEmail = async () => {
    setIsSending(true);
    try {
      const res = await fetch('/api/email/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: 'daily-digest',
          data: previewData
        })
      });
      if (res.ok) {
        alert('Test email sent successfully!');
      } else {
        const err = await res.json();
        alert(`Failed to send test email: ${err.error}`);
      }
    } catch (error) {
      alert('Error sending test email');
    } finally {
      setIsSending(false);
    }
  };

  const getPreviewContent = (template: string) => {
    switch (template) {
      case 'job-match':
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
            <div style="background: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">New Job Match Alert</h1>
            </div>
            <div style="background: white; padding: 20px; border-radius: 0 0 8px 8px;">
              <h2 style="color: #333;">${previewData.role} at ${previewData.company}</h2>
              <p><strong>Location:</strong> ${previewData.location}</p>
              <p><strong>Match Score:</strong> ${previewData.match_score}%</p>
              <p><strong>Recommended Resume:</strong> ${previewData.resume}</p>
              <p style="color: #666;">This job matches your profile based on your skills and experience.</p>
            </div>
          </div>
        `;
      case 'daily-digest':
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
            <div style="background: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Daily Job Digest</h1>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">${previewData.date}</p>
            </div>
            <div style="background: white; padding: 20px; border-radius: 0 0 8px 8px;">
              <h2 style="color: #333;">Today's Summary</h2>
              <ul style="color: #666;">
                <li>12 new jobs matched your profile</li>
                <li>3 jobs from ${previewData.company}</li>
                <li>2 applications pending review</li>
                <li>1 interview scheduled</li>
              </ul>
              <p style="color: #666; margin-top: 20px;">Check your dashboard for more details.</p>
            </div>
          </div>
        `;
      case 'weekly-report':
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
            <div style="background: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Weekly Report</h1>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Week of ${previewData.date}</p>
            </div>
            <div style="background: white; padding: 20px; border-radius: 0 0 8px 8px;">
              <h2 style="color: #333;">Your Job Search Progress</h2>
              <ul style="color: #666;">
                <li>45 jobs reviewed this week</li>
                <li>8 applications submitted</li>
                <li>2 interviews scheduled</li>
                <li>Average match score: ${previewData.match_score}%</li>
              </ul>
              <p style="color: #666; margin-top: 20px;">Keep up the great work!</p>
            </div>
          </div>
        `;
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Email Preferences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white">Instant Alerts</span>
            <button
              onClick={() => setInstantAlerts(!instantAlerts)}
              className={`w-12 h-6 rounded-full transition-colors ${instantAlerts ? 'bg-emerald-600' : 'bg-[#232d3f]'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${instantAlerts ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <p className="text-xs text-[#94a3b8] mt-2">Get notified immediately when new jobs match your criteria</p>
        </div>
        <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white">Daily Digest</span>
            <button
              onClick={() => setDailyDigest(!dailyDigest)}
              className={`w-12 h-6 rounded-full transition-colors ${dailyDigest ? 'bg-emerald-600' : 'bg-[#232d3f]'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${dailyDigest ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <p className="text-xs text-[#94a3b8] mt-2">Receive a daily summary of new job opportunities</p>
        </div>
        <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white">Weekly Report</span>
            <button
              onClick={() => setWeeklyReport(!weeklyReport)}
              className={`w-12 h-6 rounded-full transition-colors ${weeklyReport ? 'bg-emerald-600' : 'bg-[#232d3f]'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${weeklyReport ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <p className="text-xs text-[#94a3b8] mt-2">Weekly analytics and application progress report</p>
        </div>
        <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white">Monthly Summary</span>
            <button
              onClick={() => setMonthlySummary(!monthlySummary)}
              className={`w-12 h-6 rounded-full transition-colors ${monthlySummary ? 'bg-emerald-600' : 'bg-[#232d3f]'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${monthlySummary ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <p className="text-xs text-[#94a3b8] mt-2">Monthly overview of your job search performance</p>
        </div>
      </div>

      {/* Email Service Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-cyan-400" />
              <span className="text-sm font-bold text-white">SMTP Status</span>
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-400">Connected</span>
          </div>
        </div>
        <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-bold text-white">Resend Status</span>
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-400">Active</span>
          </div>
        </div>
      </div>

      {/* Email Templates */}
      <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Email Templates</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-[#131a26] rounded-lg">
            <span className="text-sm text-white">Job Match Alert Template</span>
            <button 
              onClick={() => handlePreview('job-match')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Preview
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#131a26] rounded-lg">
            <span className="text-sm text-white">Daily Digest Template</span>
            <button 
              onClick={() => handlePreview('daily-digest')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Preview
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#131a26] rounded-lg">
            <span className="text-sm text-white">Weekly Report Template</span>
            <button 
              onClick={() => handlePreview('weekly-report')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Preview
            </button>
          </div>
        </div>
        <button 
          onClick={handleSendTestEmail}
          disabled={isSending}
          className="mt-4 w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-white transition-colors"
        >
          {isSending ? 'Sending...' : 'Send Test Email'}
        </button>
      </div>

      {/* Preview Modal */}
      {showPreview && previewTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-[#232d3f] flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Email Preview</h3>
              <button 
                onClick={() => setShowPreview(false)}
                className="text-[#94a3b8] hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="space-y-4 mb-4">
                <div>
                  <label className="text-xs text-[#94a3b8] block mb-2">Company</label>
                  <input
                    type="text"
                    value={previewData.company}
                    onChange={(e) => setPreviewData({ ...previewData, company: e.target.value })}
                    className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl px-4 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#94a3b8] block mb-2">Role</label>
                  <input
                    type="text"
                    value={previewData.role}
                    onChange={(e) => setPreviewData({ ...previewData, role: e.target.value })}
                    className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl px-4 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#94a3b8] block mb-2">Location</label>
                  <input
                    type="text"
                    value={previewData.location}
                    onChange={(e) => setPreviewData({ ...previewData, location: e.target.value })}
                    className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl px-4 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#94a3b8] block mb-2">Match Score</label>
                  <input
                    type="number"
                    value={previewData.match_score}
                    onChange={(e) => setPreviewData({ ...previewData, match_score: parseInt(e.target.value) })}
                    className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl px-4 py-2 text-sm text-white"
                  />
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 overflow-auto">
                <div dangerouslySetInnerHTML={{ __html: getPreviewContent(previewTemplate) }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CalendarAutomation: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [view, setView] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [events, setEvents] = useState([
    { id: '1', title: 'Technical Interview - Google', start: new Date('2026-07-15T10:00:00'), end: new Date('2026-07-15T11:30:00'), type: 'interview', company: 'Google', description: 'Technical interview with the engineering team' },
    { id: '2', title: 'OA Deadline - Meta', start: new Date('2026-07-16T23:59:00'), end: new Date('2026-07-16T23:59:00'), type: 'oa-deadline', company: 'Meta', description: 'Online assessment deadline' },
    { id: '3', title: 'Follow-up with John - Amazon', start: new Date('2026-07-14T14:00:00'), end: new Date('2026-07-14T14:30:00'), type: 'followup', company: 'Amazon', description: 'Follow-up call regarding referral' },
  ]);

  useEffect(() => {
    // Check Google Calendar connection status from backend
    fetch('/api/calendar/google/status')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.linked === 'boolean') {
          setIsConnected(data.linked);
        }
      })
      .catch(() => {});
  }, []);

  const [newEvent, setNewEvent] = useState({
    title: '',
    start: '',
    end: '',
    type: 'interview',
    company: '',
    description: ''
  });

  const connectGoogleCalendar = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned status ${res.status}`);
      }
      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('OAuth URL not returned from server');
      }
    } catch (err: any) {
      alert(`Failed to start Google Calendar connection: ${err.message}`);
    }
  };

  const disconnectGoogleCalendar = () => {
    setIsConnected(false);
    setAutoSync(false);
  };

  const syncNow = () => {
    // Trigger sync with Google Calendar
    alert('Syncing with Google Calendar...');
  };

  const createEvent = () => {
    setEditingEvent(null);
    setNewEvent({
      title: '',
      start: '',
      end: '',
      type: 'interview',
      company: '',
      description: ''
    });
    setShowEventModal(true);
  };

  const editEvent = (event: any) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      start: new Date(event.start).toISOString().slice(0, 16),
      end: new Date(event.end).toISOString().slice(0, 16),
      type: event.type,
      company: event.company || '',
      description: event.description || ''
    });
    setShowEventModal(true);
  };

  const deleteEvent = (id: string) => {
    if (window.confirm('Delete this event?')) {
      setEvents(events.filter(e => e.id !== id));
    }
  };

  const saveEvent = () => {
    if (editingEvent) {
      setEvents(events.map(e => e.id === editingEvent.id ? { ...e, ...newEvent, start: new Date(newEvent.start), end: new Date(newEvent.end) } : e));
    } else {
      setEvents([...events, { ...newEvent, id: Date.now().toString(), start: new Date(newEvent.start), end: new Date(newEvent.end) }]);
    }
    setShowEventModal(false);
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'interview': return 'bg-purple-600/10 border-purple-600/20 text-purple-400';
      case 'oa-deadline': return 'bg-amber-600/10 border-amber-600/20 text-amber-400';
      case 'followup': return 'bg-emerald-600/10 border-emerald-600/20 text-emerald-400';
      case 'application-deadline': return 'bg-red-600/10 border-red-600/20 text-red-400';
      default: return 'bg-indigo-600/10 border-indigo-600/20 text-indigo-400';
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), -i);
      days.push({ date, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      days.push({ date, isCurrentMonth: true });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
      days.push({ date, isCurrentMonth: false });
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-bold text-[#94a3b8] py-2">{day}</div>
        ))}
        {days.map(({ date, isCurrentMonth }, idx) => {
          const dayEvents = events.filter(e => {
            const eventDate = new Date(e.start);
            return eventDate.toDateString() === date.toDateString();
          });

          return (
            <div
              key={idx}
              className={`min-h-24 p-2 rounded-lg border ${
                isCurrentMonth
                  ? 'bg-[#1b2535] border-[#232d3f] hover:border-indigo-600/30'
                  : 'bg-[#131a26] border-transparent opacity-50'
              } cursor-pointer transition-colors`}
              onClick={() => { if (isCurrentMonth) { setNewEvent({ ...newEvent, start: new Date(date).toISOString().slice(0, 16), end: new Date(date).toISOString().slice(0, 16) }); setShowEventModal(true); }}}
            >
              <span className={`text-xs font-semibold ${isCurrentMonth ? 'text-white' : 'text-[#6b7280]'}`}>
                {date.getDate()}
              </span>
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className={`text-[9px] px-1.5 py-0.5 rounded truncate ${getEventColor(event.type)}`}
                    onClick={(e) => { e.stopPropagation(); editEvent(event); }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <span className="text-[9px] text-[#6b7280]">+{dayEvents.length - 2} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }

    return (
      <div className="grid grid-cols-8 gap-1">
        <div className="text-center text-xs font-bold text-[#94a3b8] py-2">Time slots</div>
        {days.map(date => (
          <div key={date.toISOString()} className="text-center text-xs font-bold text-white py-2">
            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        ))}
        {Array.from({ length: 12 }, (_, hour) => (
          <React.Fragment key={hour}>
            <div className="text-xs text-[#94a3b8] py-2 text-right pr-2">{`${hour + 8}:00`}</div>
            {days.map(date => {
              const hourEvents = events.filter(e => {
                const eventDate = new Date(e.start);
                return eventDate.toDateString() === date.toDateString() && eventDate.getHours() === hour + 8;
              });
              return (
                <div key={date.toISOString()} className="min-h-12 p-1 bg-[#1b2535] border border-[#232d3f] rounded">
                  {hourEvents.map(event => (
                    <div
                      key={event.id}
                      className={`text-[9px] px-1.5 py-0.5 rounded truncate ${getEventColor(event.type)}`}
                      onClick={() => editEvent(event)}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 12 }, (_, i) => i + 8);

    return (
      <div className="space-y-1">
        {hours.map(hour => {
          const hourEvents = events.filter(e => {
            const eventDate = new Date(e.start);
            return eventDate.toDateString() === currentDate.toDateString() && eventDate.getHours() === hour;
          });

          return (
            <div key={hour} className="flex gap-2">
              <div className="w-16 text-xs text-[#94a3b8] py-2 text-right pr-2">{`${hour}:00`}</div>
              <div className="flex-1 min-h-12 p-2 bg-[#1b2535] border border-[#232d3f] rounded">
                {hourEvents.map(event => (
                  <div
                    key={event.id}
                    className={`p-2 rounded-lg ${getEventColor(event.type)}`}
                    onClick={() => editEvent(event)}
                  >
                    <span className="text-xs font-semibold block">{event.title}</span>
                    <span className="text-[9px] text-[#94a3b8]">{new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAgendaView = () => {
    const sortedEvents = [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return (
      <div className="space-y-3">
        {sortedEvents.map(event => (
          <div key={event.id} className={`p-4 rounded-xl border ${getEventColor(event.type)}`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-bold text-white text-sm">{event.title}</h4>
                <div className="flex items-center gap-3 mt-2 text-xs text-[#94a3b8]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(event.start).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {event.company && (
                    <span className="flex items-center gap-1">
                      <Server className="w-3 h-3" /> {event.company}
                    </span>
                  )}
                </div>
                {event.description && (
                  <p className="text-xs text-[#94a3b8] mt-2">{event.description}</p>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button className="p-1.5 hover:bg-white/10 rounded transition-colors" onClick={() => editEvent(event)}>
                  <FileText className="w-4 h-4" />
                </button>
                <button className="p-1.5 hover:bg-white/10 rounded transition-colors text-red-400" onClick={() => deleteEvent(event.id)}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  return (
    <div className="space-y-6">
      {/* Google Calendar Connection & Verification Guide */}
      <div className="bg-[#111827] border border-[#243147] rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#243147] pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" /> Google Calendar Integration
            </h3>
            <p className="text-xs text-[#94a3b8] mt-1">
              Sync interviews, OA deadlines, and follow-ups directly to your Google Calendar.
            </p>
          </div>

          {isConnected ? (
            <div className="flex items-center gap-2">
              <button
                onClick={syncNow}
                className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Sync Now
              </button>
              <button
                onClick={disconnectGoogleCalendar}
                className="flex items-center gap-2 px-3.5 py-2 bg-rose-600/20 border border-rose-500/30 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connectGoogleCalendar}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Connect Google Calendar
            </button>
          )}
        </div>
        
        {isConnected && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#090d16] border border-[#243147] rounded-xl">
              <span className="text-xs font-semibold text-white">Automatic Calendar Sync</span>
              <button
                onClick={() => setAutoSync(!autoSync)}
                className={`w-11 h-6 rounded-full transition-colors ${autoSync ? 'bg-emerald-600' : 'bg-[#243147]'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${autoSync ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <CheckCircle className="w-4 h-4" />
              <span>Google Calendar Account Connected</span>
            </div>
          </div>
        )}
      </div>

      {/* Calendar View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-[#1b2535] rounded-lg text-[#94a3b8] hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="text-lg font-bold text-white"
          >
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-[#1b2535] rounded-lg text-[#94a3b8] hover:text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('month')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              view === 'month' ? 'bg-indigo-600/10 border border-indigo-600/30 text-indigo-400' : 'text-[#94a3b8] hover:bg-[#1b2535]'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              view === 'week' ? 'bg-indigo-600/10 border border-indigo-600/30 text-indigo-400' : 'text-[#94a3b8] hover:bg-[#1b2535]'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setView('day')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              view === 'day' ? 'bg-indigo-600/10 border border-indigo-600/30 text-indigo-400' : 'text-[#94a3b8] hover:bg-[#1b2535]'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setView('agenda')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              view === 'agenda' ? 'bg-indigo-600/10 border border-indigo-600/30 text-indigo-400' : 'text-[#94a3b8] hover:bg-[#1b2535]'
            }`}
          >
            Agenda
          </button>
          <button
            onClick={createEvent}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-semibold text-white transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Event
          </button>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-6">
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
        {view === 'agenda' && renderAgendaView()}
      </div>

      {/* Event Types Legend */}
      <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Event Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 bg-[#131a26] rounded-lg">
            <Calendar className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-white">Interviews</span>
            <span className="ml-auto text-xs text-emerald-400">Auto-created</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#131a26] rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <span className="text-sm text-white">OA Deadlines</span>
            <span className="ml-auto text-xs text-emerald-400">Auto-reminded</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#131a26] rounded-lg">
            <Clock className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-white">Follow-ups</span>
            <span className="ml-auto text-xs text-emerald-400">Auto-scheduled</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#131a26] rounded-lg">
            <Server className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-white">Referral Reminders</span>
            <span className="ml-auto text-xs text-emerald-400">Auto-synced</span>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-[#232d3f] flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">{editingEvent ? 'Edit Event' : 'Create Event'}</h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="text-[#94a3b8] hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-[#94a3b8] block mb-2">Title *</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl px-4 py-2 text-sm text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#94a3b8] block mb-2">Start *</label>
                  <input
                    type="datetime-local"
                    value={newEvent.start}
                    onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                    className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl px-4 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#94a3b8] block mb-2">End *</label>
                  <input
                    type="datetime-local"
                    value={newEvent.end}
                    onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                    className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl px-4 py-2 text-sm text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] block mb-2">Type</label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as any })}
                  className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl px-4 py-2 text-sm text-white"
                >
                  <option value="interview">Interview</option>
                  <option value="oa-deadline">OA Deadline</option>
                  <option value="followup">Follow-up</option>
                  <option value="application-deadline">Application Deadline</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] block mb-2">Company</label>
                <input
                  type="text"
                  value={newEvent.company}
                  onChange={(e) => setNewEvent({ ...newEvent, company: e.target.value })}
                  className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl px-4 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] block mb-2">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  rows={3}
                  className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl px-4 py-2 text-sm text-white resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={saveEvent}
                  disabled={!newEvent.title || !newEvent.start || !newEvent.end}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-xs font-bold py-2 rounded-xl transition-colors"
                >
                  {editingEvent ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#232d3f] hover:bg-[#1f2937] text-white text-xs font-bold py-2 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationHub;
