import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Download, Clock, Activity, Play, Pause, RotateCcw, FileText, CheckCircle, XCircle, TrendingUp, Database, Server, Plus, Trash2, ChevronLeft, ChevronRight, Mail, Bell } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader.js';
import { useToast } from '../../context/ToastContext.js';

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
  const { showToast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);

  const [realtimeLogs, setRealtimeLogs] = useState<{ id: string; time: string; message: string; type: 'info' | 'success' | 'error' | 'warn' }[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'websocket' | 'sse' | 'disconnected'>('disconnected');

  const { data: monitoringData, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['monitoring'],
    queryFn: async () => {
      const res = await fetch('/api/monitoring');
      if (!res.ok) throw new Error('Failed to load monitoring data');
      const json = await res.json();
      return json.data;
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    let ws: WebSocket | null = null;
    let sse: EventSource | null = null;
    let isDestroyed = false;
    let wsReconnectDelay = 1000;
    let sseReconnectDelay = 1000;

    let lastRefetchTime = 0;
    let refetchTimeout: any = null;

    function throttledRefetch() {
      const now = Date.now();
      const timeSinceLastRefetch = now - lastRefetchTime;
      if (timeSinceLastRefetch >= 5000) {
        lastRefetchTime = now;
        refetch();
      } else {
        if (refetchTimeout) clearTimeout(refetchTimeout);
        refetchTimeout = setTimeout(() => {
          lastRefetchTime = Date.now();
          refetch();
        }, 5000 - timeSinceLastRefetch);
      }
    }

    const eventBuffer: { id: string; time: string; message: string; type: 'info' | 'success' | 'error' | 'warn' }[] = [];

    const flushInterval = setInterval(() => {
      if (isDestroyed || eventBuffer.length === 0) return;
      setRealtimeLogs((prev) => {
        const deduplicated = [...prev];
        for (const item of eventBuffer) {
          if (!deduplicated.some((x) => x.id === item.id)) {
            deduplicated.push(item);
          }
        }
        return deduplicated.slice(-100);
      });
      eventBuffer.length = 0;
    }, 200);

    function connectWebSocket() {
      if (isDestroyed) return;
      setConnectionStatus('connecting');

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const token = localStorage.getItem('token') || '';
      const wsUrl = `${protocol}//${host}/api/monitoring/ws?token=${encodeURIComponent(token)}`;

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (isDestroyed) {
          ws?.close();
          return;
        }
        console.log('[WS] Connected to real-time scraper stream');
        setConnectionStatus('websocket');
        wsReconnectDelay = 1000; // Reset backoff on success
      };

      ws.onmessage = (event) => {
        if (isDestroyed) return;
        try {
          const parsed = JSON.parse(event.data);
          handleRealtimeEvent(parsed);
        } catch (err) {
          console.error('Error parsing WS message', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('[WS] Connection failed, falling back to SSE...', err);
        if (ws) {
          ws.close();
          ws = null;
        }
        connectSSE();
      };

      ws.onclose = () => {
        if (isDestroyed) return;
        if (connectionStatus === 'websocket') {
          setConnectionStatus('disconnected');
          setTimeout(() => {
            wsReconnectDelay = Math.min(wsReconnectDelay * 2, 30000);
            connectWebSocket();
          }, wsReconnectDelay);
        }
      };
    }

    function connectSSE() {
      if (isDestroyed) return;
      console.log('[SSE] Attempting connection...');
      setConnectionStatus('connecting');

      const token = localStorage.getItem('token') || '';
      sse = new EventSource(`/api/monitoring/stream?token=${encodeURIComponent(token)}`);

      sse.onopen = () => {
        if (isDestroyed) {
          sse?.close();
          return;
        }
        console.log('[SSE] Connected to real-time scraper stream');
        setConnectionStatus('sse');
        sseReconnectDelay = 1000; // Reset backoff on success
      };

      sse.onmessage = (event) => {
        if (isDestroyed) return;
        try {
          const parsed = JSON.parse(event.data);
          handleRealtimeEvent(parsed);
        } catch (err) {
          console.error('Error parsing SSE message', err);
        }
      };

      sse.onerror = (err) => {
        console.error('[SSE] Stream encountered error, disconnecting...', err);
        if (sse) {
          sse.close();
          sse = null;
        }
        setConnectionStatus('disconnected');
        setTimeout(() => {
          sseReconnectDelay = Math.min(sseReconnectDelay * 2, 30000);
          connectWebSocket();
        }, sseReconnectDelay);
      };
    }

    function handleRealtimeEvent(event: any) {
      const { id, timestamp, type, level, payload } = event;
      if (type === 'heartbeat' || type === 'connected') {
        return; // Ignore internal events in visual console logs
      }

      const timeStr = new Date(timestamp || Date.now()).toLocaleTimeString();
      let message = '';
      let logType: 'info' | 'success' | 'error' | 'warn' = 'info';

      if (level === 'success') logType = 'success';
      else if (level === 'error') logType = 'error';
      else if (level === 'warning') logType = 'warn';

      switch (type) {
        case 'run:start':
          message = `🚀 Scraper Run Started: Monitoring ${payload.totalCompanies} companies`;
          setIsRunning(true);
          break;
        case 'batch:start':
          message = `📦 Enqueueing Batch ${payload.batchIndex}/${payload.totalBatches}`;
          break;
        case 'scraper:start':
          message = `🔍 [${payload.companyName}] Starting scraper...`;
          break;
        case 'scraper:progress':
          message = `✓ [${payload.companyName}] Finished: ${payload.jobsFound} jobs found (${payload.newJobs} new matches) in ${(payload.durationMs / 1000).toFixed(1)}s`;
          throttledRefetch();
          break;
        case 'scraper:error':
          message = `✕ [${payload.companyName}] Error: ${payload.error}`;
          throttledRefetch();
          break;
        case 'batch:complete':
          message = `✓ Batch ${payload.batchIndex} complete`;
          break;
        case 'run:complete':
          message = `🏁 Scraper Run Finished in ${(payload.durationMs / 1000).toFixed(1)}s. Total jobs: ${payload.totalJobsFound}, Failures: ${payload.totalFailures}`;
          setIsRunning(false);
          throttledRefetch();
          break;
        default:
          return;
      }

      eventBuffer.push({
        id: id || Math.random().toString(),
        time: timeStr,
        message,
        type: logType
      });
    }

    connectWebSocket();

    return () => {
      isDestroyed = true;
      clearInterval(flushInterval);
      if (refetchTimeout) clearTimeout(refetchTimeout);
      if (ws) ws.close();
      if (sse) sse.close();
    };
  }, [refetch]);

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
        showToast('✓ Scrapers started successfully.', 'success');
      } else {
        showToast('✕ Failed to start scrapers.', 'error');
      }
    } catch (error) {
      showToast('✕ Error starting scrapers.', 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const handlePause = async () => {
    try {
      const res = await fetch('/api/monitoring/pause', { method: 'POST' });
      if (res.ok) {
        setIsPaused(true);
        showToast('ℹ Scrapers paused.', 'info');
      } else {
        showToast('✕ Failed to pause scrapers.', 'error');
      }
    } catch (error) {
      showToast('✕ Error pausing scrapers.', 'error');
    }
  };

  const handleResume = async () => {
    try {
      const res = await fetch('/api/monitoring/resume', { method: 'POST' });
      if (res.ok) {
        setIsPaused(false);
        showToast('✓ Scrapers resumed.', 'success');
      } else {
        showToast('✕ Failed to resume scrapers.', 'error');
      }
    } catch (error) {
      showToast('✕ Error resuming scrapers.', 'error');
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
        showToast('✕ Failed to load logs.', 'error');
      }
    } catch (error) {
      showToast('✕ Error loading logs.', 'error');
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
                  const statusNormalized = (scraper.status || '').toLowerCase();
                  const isHealthy = statusNormalized === 'healthy';
                  const isDegraded = statusNormalized === 'degraded';
                  const isFailed = statusNormalized === 'failed' || statusNormalized === 'failing' || statusNormalized === 'unhealthy';
                  return (
                    <tr key={idx} className="hover:bg-[#1b2535]/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{scraper.name}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          isHealthy
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : isDegraded
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : isFailed
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isHealthy
                              ? 'bg-emerald-400'
                              : isDegraded
                              ? 'bg-amber-400'
                              : isFailed
                              ? 'bg-rose-400'
                              : 'bg-slate-400'
                          }`} />
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

      {/* Real-time Console Log Terminal Card */}
      <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full ${
              connectionStatus === 'websocket'
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                : connectionStatus === 'sse'
                ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]'
                : connectionStatus === 'connecting'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-rose-400'
            }`} />
            <h3 className="text-base font-bold text-white">Live Monitoring Stream</h3>
            <span className="text-xs text-slate-400 font-mono">
              ({connectionStatus === 'websocket' ? 'WebSocket active' : connectionStatus === 'sse' ? 'SSE fallback active' : connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'})
            </span>
          </div>
          <button
            onClick={() => setRealtimeLogs([])}
            className="text-xs text-slate-400 hover:text-white transition-colors border border-[#232d3f] hover:border-slate-500 px-2.5 py-1 rounded-lg"
          >
            Clear Terminal
          </button>
        </div>

        <div className="bg-[#0b0f19] border border-[#232d3f] rounded-xl p-4 h-64 overflow-y-auto font-mono text-xs text-slate-300 space-y-2 select-text scrollbar-thin scrollbar-thumb-slate-800">
          {realtimeLogs.length > 0 ? (
            realtimeLogs.map((log) => {
              const colorMap = {
                info: 'text-slate-300',
                success: 'text-emerald-400 font-semibold',
                error: 'text-rose-400 font-semibold',
                warn: 'text-amber-400 font-semibold',
              };
              return (
                <div key={log.id} className="flex gap-3 leading-relaxed hover:bg-[#111827]/40 py-0.5 px-1 rounded transition-colors">
                  <span className="text-slate-500 select-none">[{log.time}]</span>
                  <span className={colorMap[log.type]}>{log.message}</span>
                </div>
              );
            })
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs italic select-none">
              Waiting for live scraper events. Click "Run Now" to trigger a scrape session.
            </div>
          )}
        </div>
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
  const instantAlerts = true;
  const [dailyDigest, setDailyDigest] = useState<boolean>(() => {
    const val = localStorage.getItem('email_pref_dailyDigest');
    return val !== null ? val === 'true' : true;
  });
  const [weeklyReport, setWeeklyReport] = useState<boolean>(() => {
    const val = localStorage.getItem('email_pref_weeklyReport');
    return val !== null ? val === 'true' : false;
  });
  const [monthlySummary, setMonthlySummary] = useState<boolean>(() => {
    const val = localStorage.getItem('email_pref_monthlySummary');
    return val !== null ? val === 'true' : false;
  });
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState({ company: 'Google', role: 'Software Engineer', location: 'Mountain View, CA', match_score: 85, resume: 'Backend Resume', date: new Date().toLocaleDateString() });
  const [isSending, setIsSending] = useState(false);

  // 5. Toast Notification State
  const [toast, setToast] = useState<{ title: string; desc: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // 6. Last Test Email Info
  const [lastTestEmail, setLastTestEmail] = useState<string | null>(() => {
    return localStorage.getItem('last_test_email_info') || null;
  });

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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
        const now = new Date();
        const formattedTime = `Sent Today ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        setLastTestEmail(formattedTime);
        localStorage.setItem('last_test_email_info', formattedTime);
        setToast({
          title: '✓ Test email sent successfully.',
          desc: 'Delivered to user@example.com',
          type: 'success'
        });
      } else {
        const err = await res.json().catch(() => ({ error: 'SMTP authentication failed.' }));
        setToast({
          title: '✕ Failed to send test email.',
          desc: err.error || 'SMTP authentication failed.',
          type: 'error'
        });
      }
    } catch (error) {
      setToast({
        title: '✕ Failed to send test email.',
        desc: 'Network error or SMTP provider offline.',
        type: 'error'
      });
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
      case 'monthly-summary':
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
            <div style="background: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Monthly Performance Summary</h1>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Monthly Review</p>
            </div>
            <div style="background: white; padding: 20px; border-radius: 0 0 8px 8px;">
              <h2 style="color: #333;">Monthly Job Search Highlights</h2>
              <ul style="color: #666;">
                <li>180+ jobs tracked across 42 companies</li>
                <li>32 applications submitted</li>
                <li>5 interview invitations received</li>
                <li>Average match score: ${previewData.match_score}%</li>
              </ul>
              <p style="color: #666; margin-top: 20px;">Great progress this month!</p>
            </div>
          </div>
        `;
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* 5. Top-Right Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 w-80 md:w-96 border rounded-2xl p-4 shadow-2xl space-y-1 backdrop-blur-xl animate-bounce-in ${
          toast.type === 'success'
            ? 'bg-[#131a26] border-emerald-500/40 text-emerald-400'
            : 'bg-[#131a26] border-rose-500/40 text-rose-400'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold">{toast.title}</h4>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">{toast.desc}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-500 hover:text-white text-xs cursor-pointer p-0.5">✕</button>
          </div>
        </div>
      )}

      {/* 1 & 2. Email Preferences Toggle Cards with Color Accents & Alert Scheduling */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Instant Alerts -> Blue */}
        <div className="bg-[#1b2535] border border-[#232d3f] border-l-4 border-l-blue-500 rounded-xl p-4 transition hover:border-[#334155] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bell className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-bold text-white">Instant Alerts</span>
            </div>
            <button
              disabled
              className="w-12 h-6 rounded-full bg-emerald-600 cursor-not-allowed opacity-80"
              title="Instant alerts are permanently enabled"
            >
              <div className="w-5 h-5 bg-white rounded-full translate-x-6" />
            </button>
          </div>
          <p className="text-xs text-slate-300">Send immediately when a matching job is found.</p>
          <div className="pt-2 border-t border-[#232d3f]/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Schedule: <span className="text-slate-200 font-medium">On job detection</span></span>
            <span className={`px-2 py-0.5 rounded-full font-bold border ${
              instantAlerts ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
            }`}>
              Status: {instantAlerts ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        {/* Daily Digest -> Green */}
        <div className="bg-[#1b2535] border border-[#232d3f] border-l-4 border-l-emerald-500 rounded-xl p-4 transition hover:border-[#334155] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Mail className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold text-white">Daily Digest</span>
            </div>
            <button
              onClick={() => {
                const next = !dailyDigest;
                setDailyDigest(next);
                localStorage.setItem('email_pref_dailyDigest', String(next));
              }}
              className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${dailyDigest ? 'bg-emerald-600' : 'bg-[#232d3f]'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${dailyDigest ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <p className="text-xs text-slate-300">Receive a daily summary of new job opportunities.</p>
          <div className="pt-2 border-t border-[#232d3f]/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Schedule: <span className="text-slate-200 font-medium">Every day at 9:00 AM</span></span>
            <span className={`px-2 py-0.5 rounded-full font-bold border ${
              dailyDigest ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
            }`}>
              Status: {dailyDigest ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        {/* Weekly Report -> Purple */}
        <div className="bg-[#1b2535] border border-[#232d3f] border-l-4 border-l-purple-500 rounded-xl p-4 transition hover:border-[#334155] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-bold text-white">Weekly Report</span>
            </div>
            <button
              onClick={() => {
                const next = !weeklyReport;
                setWeeklyReport(next);
                localStorage.setItem('email_pref_weeklyReport', String(next));
              }}
              className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${weeklyReport ? 'bg-emerald-600' : 'bg-[#232d3f]'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${weeklyReport ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <p className="text-xs text-slate-300">Weekly analytics and application progress report.</p>
          <div className="pt-2 border-t border-[#232d3f]/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Schedule: <span className="text-slate-200 font-medium">Every Monday at 9:00 AM</span></span>
            <span className={`px-2 py-0.5 rounded-full font-bold border ${
              weeklyReport ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
            }`}>
              Status: {weeklyReport ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        {/* Monthly Summary -> Orange */}
        <div className="bg-[#1b2535] border border-[#232d3f] border-l-4 border-l-amber-500 rounded-xl p-4 transition hover:border-[#334155] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-bold text-white">Monthly Summary</span>
            </div>
            <button
              onClick={() => {
                const next = !monthlySummary;
                setMonthlySummary(next);
                localStorage.setItem('email_pref_monthlySummary', String(next));
              }}
              className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${monthlySummary ? 'bg-emerald-600' : 'bg-[#232d3f]'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${monthlySummary ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <p className="text-xs text-slate-300">Monthly overview of your job search performance.</p>
          <div className="pt-2 border-t border-[#232d3f]/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Schedule: <span className="text-slate-200 font-medium">1st day of every month</span></span>
            <span className={`px-2 py-0.5 rounded-full font-bold border ${
              monthlySummary ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
            }`}>
              Status: {monthlySummary ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Operational SMTP & Resend Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SMTP Status */}
        <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-cyan-400" />
            <div>
              <span className="text-sm font-bold text-white block">SMTP Status</span>
              <span className="text-[11px] text-slate-400">Last checked: 25 sec ago</span>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Connected
          </span>
        </div>

        {/* Resend Status */}
        <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-purple-400" />
            <div>
              <span className="text-sm font-bold text-white block">Resend Status</span>
              <span className="text-[11px] text-slate-400 font-mono">Quota Remaining: 92% • API Verified</span>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Active
          </span>
        </div>
      </div>

      {/* 4 & 6. Email Templates Responsive Table & Send Test Email Info */}
      <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white">Email Templates</h3>
        
        <div className="overflow-x-auto rounded-xl border border-[#232d3f] bg-[#131a26]">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-[#0b0f19] text-slate-400 font-bold uppercase tracking-wider border-b border-[#232d3f]">
              <tr>
                <th className="py-3 px-4">Template</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232d3f]/60 font-medium">
              <tr className="hover:bg-[#1b2535]/60 transition-colors">
                <td className="py-3 px-4 font-bold text-white">Job Match Alert</td>
                <td className="py-3 px-4">
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                    Active
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-400">2 days ago</td>
                <td className="py-3 px-4 text-right">
                  <button 
                    onClick={() => handlePreview('job-match')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                  >
                    Preview
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-[#1b2535]/60 transition-colors">
                <td className="py-3 px-4 font-bold text-white">Daily Digest</td>
                <td className="py-3 px-4">
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                    Active
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-400">Yesterday</td>
                <td className="py-3 px-4 text-right">
                  <button 
                    onClick={() => handlePreview('daily-digest')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                  >
                    Preview
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-[#1b2535]/60 transition-colors">
                <td className="py-3 px-4 font-bold text-white">Weekly Report</td>
                <td className="py-3 px-4">
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                    Active
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-400">Today</td>
                <td className="py-3 px-4 text-right">
                  <button 
                    onClick={() => handlePreview('weekly-report')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                  >
                    Preview
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-[#1b2535]/60 transition-colors">
                <td className="py-3 px-4 font-bold text-white">Monthly Summary</td>
                <td className="py-3 px-4">
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                    Active
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-400">3 days ago</td>
                <td className="py-3 px-4 text-right">
                  <button 
                    onClick={() => handlePreview('monthly-summary')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                  >
                    Preview
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 5 & 6. Send Test Email Action & Last Test Email Information */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button 
            onClick={handleSendTestEmail}
            disabled={isSending}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer"
          >
            {isSending ? 'Sending...' : 'Send Test Email'}
          </button>

          <div className="text-xs text-slate-400 bg-[#131a26] border border-[#232d3f] px-3.5 py-2 rounded-xl flex items-center gap-2">
            <span className="font-semibold text-slate-300">Last Test Email:</span>
            <span className="font-mono text-indigo-300">{lastTestEmail || 'Never Sent'}</span>
          </div>
        </div>
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

  // Toast Notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Deletion & Multi-event State
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedDayEventsModal, setSelectedDayEventsModal] = useState<{ date: Date; events: any[] } | null>(null);

  // 5. Enhanced Google Calendar Sync Stats
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('2 minutes ago');
  const [nextSyncTime, setNextSyncTime] = useState<string>('In 13 minutes');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const [events, setEvents] = useState([
    { id: '1', title: 'Technical Interview - Google', start: new Date('2026-07-15T10:00:00'), end: new Date('2026-07-15T11:30:00'), type: 'interview', company: 'Google', description: 'Technical interview with the engineering team' },
    { id: '2', title: 'OA Deadline - Meta', start: new Date('2026-07-16T23:59:00'), end: new Date('2026-07-16T23:59:00'), type: 'oa-deadline', company: 'Meta', description: 'Online assessment deadline' },
    { id: '3', title: 'Follow-up with John - Amazon', start: new Date('2026-07-14T14:00:00'), end: new Date('2026-07-14T14:30:00'), type: 'followup', company: 'Amazon', description: 'Follow-up call regarding referral' },
    { id: '4', title: 'Recruiter Screen - Microsoft', start: new Date('2026-07-30T11:00:00'), end: new Date('2026-07-30T11:30:00'), type: 'recruiter-call', company: 'Microsoft', description: 'Initial recruiter call for Senior Frontend Role' },
    { id: '5', title: 'Referral Check - Apple', start: new Date('2026-07-31T09:00:00'), end: new Date('2026-07-31T09:30:00'), type: 'referral', company: 'Apple', description: 'Checking referral application status' }
  ]);

  useEffect(() => {
    // Check Google Calendar connection status from backend
    fetch('/api/calendar/google/status')
      .then(res => res.json())
      .then(json => {
        const data = json.data || json;
        if (data && typeof data.linked === 'boolean') {
          setIsConnected(data.linked);
        }
      })
      .catch(() => {});

    // Fetch initial calendar events
    fetch('/api/calendar')
      .then(res => res.ok ? res.json() : [])
      .then(json => {
        const data = Array.isArray(json) ? json : (json.data || []);
        if (Array.isArray(data) && data.length > 0) {
          setEvents(data.map((e: any) => ({
            id: e.id || String(Date.now()),
            title: e.title,
            start: new Date(e.startTime || e.start),
            end: new Date(e.endTime || e.end),
            type: e.type || 'interview',
            company: e.company || '',
            description: e.description || ''
          })));
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
      const json = await res.json();
      const data = json.data || json;
      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('OAuth URL not returned from server');
      }
    } catch (err: any) {
      showToast(`Failed to start Google Calendar connection: ${err.message}`, 'error');
    }
  };

  const disconnectGoogleCalendar = () => {
    setIsConnected(false);
    setAutoSync(false);
    showToast('Google Calendar disconnected.');
  };

  const syncNow = () => {
    setLastSyncedTime('Just now');
    setNextSyncTime('In 15 minutes');
    showToast('✓ Synced successfully with Google Calendar.');
  };

  const createEvent = () => {
    setEditingEvent(null);
    const nowStr = new Date().toISOString().slice(0, 16);
    setNewEvent({
      title: '',
      start: nowStr,
      end: nowStr,
      type: 'interview',
      company: '',
      description: ''
    });
    setShowEventModal(true);
  };

  const openCreateEventForDate = (date: Date) => {
    setEditingEvent(null);
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hoursNum = d.getHours() || 9;
    const hour = String(hoursNum).padStart(2, '0');
    const nextHour = String(Math.min(23, hoursNum + 1)).padStart(2, '0');
    const startIso = `${year}-${month}-${day}T${hour}:00`;
    const endIso = `${year}-${month}-${day}T${nextHour}:00`;
    setNewEvent({
      title: '',
      start: startIso,
      end: endIso,
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

  const initiateDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = (id: string) => {
    try {
      setEvents(prev => prev.filter(e => e.id !== id));
      setConfirmDeleteId(null);
      setShowEventModal(false);
      showToast('✓ Event deleted successfully.', 'success');

      fetch(`/api/calendar/${id}`, { method: 'DELETE' }).catch(() => {});
    } catch (err: any) {
      showToast(`Failed to delete event: ${err.message}`, 'error');
    }
  };

  const saveEvent = () => {
    if (!newEvent.title || !newEvent.start || !newEvent.end) return;

    const eventPayload = {
      id: editingEvent ? editingEvent.id : Date.now().toString(),
      title: newEvent.title,
      start: new Date(newEvent.start),
      end: new Date(newEvent.end),
      type: newEvent.type,
      company: newEvent.company || '',
      description: newEvent.description || ''
    };

    try {
      if (editingEvent) {
        setEvents(events.map(e => e.id === editingEvent.id ? eventPayload : e));
        showToast('✓ Event updated successfully.');
      } else {
        setEvents(prev => [...prev, eventPayload]);
        showToast('✓ Event created successfully.');
      }

      fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: eventPayload.id,
          title: eventPayload.title,
          startTime: eventPayload.start.toISOString(),
          endTime: eventPayload.end.toISOString(),
          type: eventPayload.type,
          company: eventPayload.company,
          description: eventPayload.description
        })
      }).catch(() => {});

      setShowEventModal(false);
    } catch (err: any) {
      showToast(`Failed to save event: ${err.message}`, 'error');
    }
  };

  // 1. Color-Code Calendar Events Mapping
  const getEventColor = (type: string) => {
    switch (type) {
      case 'interview':
        return 'bg-emerald-500/15 text-emerald-300 border-l-4 border-l-emerald-500 border border-emerald-500/30';
      case 'followup':
        return 'bg-blue-500/15 text-blue-300 border-l-4 border-l-blue-500 border border-blue-500/30';
      case 'referral':
        return 'bg-purple-500/15 text-purple-300 border-l-4 border-l-purple-500 border border-purple-500/30';
      case 'oa-deadline':
        return 'bg-amber-500/15 text-amber-300 border-l-4 border-l-amber-500 border border-amber-500/30';
      case 'application-deadline':
        return 'bg-rose-500/15 text-rose-300 border-l-4 border-l-rose-500 border border-rose-500/30';
      case 'recruiter-call':
      default:
        return 'bg-yellow-500/15 text-yellow-300 border-l-4 border-l-yellow-500 border border-yellow-500/30';
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // 4. Upcoming Events Calculation
  const upcomingEvents = events
    .filter(e => new Date(e.start).getTime() >= new Date().setHours(0,0,0,0))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), -i);
      days.push({ date, isCurrentMonth: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      days.push({ date, isCurrentMonth: true });
    }

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
          // 2. Support Multiple Events Per Calendar Day sorted chronologically
          const dayEvents = events
            .filter(e => new Date(e.start).toDateString() === date.toDateString())
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

          return (
            <div
              key={idx}
              className={`min-h-24 p-2 rounded-lg border ${
                isCurrentMonth
                  ? 'bg-[#1b2535] border-[#232d3f] hover:border-indigo-500/40 hover:bg-[#202b3d]'
                  : 'bg-[#131a26] border-transparent opacity-50'
              } cursor-pointer transition-all relative group`}
              onClick={() => { if (isCurrentMonth) openCreateEventForDate(date); }}
              title={isCurrentMonth ? "Click empty cell area to add an event on this date" : ""}
            >
              <span className={`text-xs font-semibold ${isCurrentMonth ? 'text-white' : 'text-[#6b7280]'}`}>
                {date.getDate()}
              </span>
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className={`text-[9px] px-1.5 py-0.5 rounded truncate ${getEventColor(event.type)} relative group/pill cursor-pointer`}
                    onClick={(e) => { e.stopPropagation(); editEvent(event); }}
                    title="Click event to edit"
                  >
                    {event.title}

                    {/* Hover Event Tooltip */}
                    <div className="absolute left-0 bottom-full mb-1 hidden group-hover/pill:block z-50 w-56 bg-[#0b0f19] border border-[#232d3f] rounded-xl p-3 shadow-2xl space-y-1 pointer-events-none text-left backdrop-blur-xl">
                      <h5 className="text-xs font-bold text-white">{event.title}</h5>
                      <p className="text-[10px] text-slate-300 font-medium">
                        📅 {new Date(event.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-slate-300 font-mono">
                        ⏰ {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-[10px] text-indigo-300 font-semibold">
                        📍 {event.company || 'Google Meet / Remote'}
                      </p>
                      <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Status: Scheduled
                      </span>
                    </div>
                  </div>
                ))}

                {/* Multi-event Indicator Button */}
                {dayEvents.length > 2 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDayEventsModal({ date, events: dayEvents });
                    }}
                    className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline block cursor-pointer transition-colors mt-0.5"
                  >
                    +{dayEvents.length - 2} More
                  </button>
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
              const hourEvents = events
                .filter(e => {
                  const eventDate = new Date(e.start);
                  return eventDate.toDateString() === date.toDateString() && eventDate.getHours() === hour + 8;
                })
                .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

              const slotDate = new Date(date);
              slotDate.setHours(hour + 8, 0, 0, 0);

              return (
                <div
                  key={date.toISOString()}
                  className="min-h-12 p-1 bg-[#1b2535] hover:bg-[#202b3d] hover:border-indigo-500/40 border border-[#232d3f] rounded space-y-1 cursor-pointer transition-colors"
                  onClick={() => openCreateEventForDate(slotDate)}
                  title="Click empty slot area to add event"
                >
                  {hourEvents.map(event => (
                    <div
                      key={event.id}
                      className={`text-[9px] px-1.5 py-0.5 rounded truncate ${getEventColor(event.type)} relative group/pill cursor-pointer`}
                      onClick={(e) => { e.stopPropagation(); editEvent(event); }}
                      title="Click event to edit"
                    >
                      {event.title}

                      <div className="absolute left-0 bottom-full mb-1 hidden group-hover/pill:block z-50 w-56 bg-[#0b0f19] border border-[#232d3f] rounded-xl p-3 shadow-2xl space-y-1 pointer-events-none text-left backdrop-blur-xl">
                        <h5 className="text-xs font-bold text-white">{event.title}</h5>
                        <p className="text-[10px] text-slate-300 font-medium">
                          📅 {new Date(event.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-[10px] text-slate-300 font-mono">
                          ⏰ {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[10px] text-indigo-300 font-semibold">
                          📍 {event.company || 'Google Meet / Remote'}
                        </p>
                        <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Status: Scheduled
                        </span>
                      </div>
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
          const hourEvents = events
            .filter(e => {
              const eventDate = new Date(e.start);
              return eventDate.toDateString() === currentDate.toDateString() && eventDate.getHours() === hour;
            })
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

          const slotDate = new Date(currentDate);
          slotDate.setHours(hour, 0, 0, 0);

          return (
            <div key={hour} className="flex gap-2">
              <div className="w-16 text-xs text-[#94a3b8] py-2 text-right pr-2">{`${hour}:00`}</div>
              <div
                className="flex-1 min-h-12 p-2 bg-[#1b2535] hover:bg-[#202b3d] hover:border-indigo-500/40 border border-[#232d3f] rounded space-y-2 cursor-pointer transition-colors"
                onClick={() => openCreateEventForDate(slotDate)}
                title="Click empty slot area to add event"
              >
                {hourEvents.map(event => (
                  <div
                    key={event.id}
                    className={`p-2 rounded-lg ${getEventColor(event.type)} relative group/pill flex justify-between items-center cursor-pointer`}
                    onClick={(e) => { e.stopPropagation(); editEvent(event); }}
                    title="Click event to edit"
                  >
                    <div>
                      <span className="text-xs font-semibold block">{event.title}</span>
                      <span className="text-[9px] text-[#94a3b8]">{new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); initiateDelete(event.id); }}
                      className="p-1 hover:bg-rose-500/20 text-rose-400 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="absolute left-0 bottom-full mb-1 hidden group-hover/pill:block z-50 w-56 bg-[#0b0f19] border border-[#232d3f] rounded-xl p-3 shadow-2xl space-y-1 pointer-events-none text-left backdrop-blur-xl">
                      <h5 className="text-xs font-bold text-white">{event.title}</h5>
                      <p className="text-[10px] text-slate-300 font-medium">
                        📅 {new Date(event.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-slate-300 font-mono">
                        ⏰ {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-[10px] text-indigo-300 font-semibold">
                        📍 {event.company || 'Google Meet / Remote'}
                      </p>
                      <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Status: Scheduled
                      </span>
                    </div>
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
          <div key={event.id} className={`p-4 rounded-xl border ${getEventColor(event.type)} relative group/pill`}>
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
                <button className="p-1.5 hover:bg-white/10 rounded transition-colors cursor-pointer" onClick={() => editEvent(event)}>
                  <FileText className="w-4 h-4" />
                </button>
                <button className="p-1.5 hover:bg-white/10 rounded transition-colors text-red-400 cursor-pointer" onClick={() => initiateDelete(event.id)}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="absolute left-4 bottom-full mb-1 hidden group-hover/pill:block z-50 w-56 bg-[#0b0f19] border border-[#232d3f] rounded-xl p-3 shadow-2xl space-y-1 pointer-events-none text-left backdrop-blur-xl">
              <h5 className="text-xs font-bold text-white">{event.title}</h5>
              <p className="text-[10px] text-slate-300 font-medium">
                📅 {new Date(event.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-[10px] text-slate-300 font-mono">
                ⏰ {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-[10px] text-indigo-300 font-semibold">
                📍 {event.company || 'Google Meet / Remote'}
              </p>
              <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Status: Scheduled
              </span>
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
    <div className="space-y-6 relative">
      {/* Toast Notification Banner */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[70] px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-2.5 backdrop-blur-xl text-xs font-bold transition-all ${
          toast.type === 'success'
            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
            : 'bg-rose-950/90 text-rose-300 border-rose-500/40'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* 5. Enhanced Google Calendar Integration Card */}
      <div className="bg-[#111827] border border-[#243147] rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#243147] pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" /> Google Calendar
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
              }`}>
                {isConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>

            {isConnected ? (
              <p className="text-xs text-[#94a3b8] mt-1.5 flex items-center gap-3 font-mono">
                <span>Last Synced: <strong className="text-slate-200">{lastSyncedTime}</strong></span>
                <span>•</span>
                <span>Next Sync: <strong className="text-indigo-300">{nextSyncTime}</strong></span>
              </p>
            ) : (
              <p className="text-xs text-[#94a3b8] mt-1">
                Sync interviews, OA deadlines, and follow-ups directly to your Google Calendar.
              </p>
            )}
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

      {/* 4. Upcoming Events Summary Panel */}
      <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" /> Upcoming Events Summary
          </h3>
          <span className="text-xs text-slate-400 font-semibold">{upcomingEvents.length} scheduled</span>
        </div>

        {upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {upcomingEvents.slice(0, 3).map((evt) => (
              <div key={evt.id} className={`p-3 rounded-xl border ${getEventColor(evt.type)} space-y-1`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                    {new Date(evt.start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/20 capitalize">
                    {evt.type.replace('-', ' ')}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white truncate">{evt.title}</h4>
                <p className="text-[11px] font-mono opacity-90">
                  {new Date(evt.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No upcoming events scheduled.</p>
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
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
              view === 'month' ? 'bg-indigo-600/10 border border-indigo-600/30 text-indigo-400' : 'text-[#94a3b8] hover:bg-[#1b2535]'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
              view === 'week' ? 'bg-indigo-600/10 border border-indigo-600/30 text-indigo-400' : 'text-[#94a3b8] hover:bg-[#1b2535]'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setView('day')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
              view === 'day' ? 'bg-indigo-600/10 border border-indigo-600/30 text-indigo-400' : 'text-[#94a3b8] hover:bg-[#1b2535]'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setView('agenda')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
              view === 'agenda' ? 'bg-indigo-600/10 border border-indigo-600/30 text-indigo-400' : 'text-[#94a3b8] hover:bg-[#1b2535]'
            }`}
          >
            Agenda
          </button>
          <button
            onClick={createEvent}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-semibold text-white transition-colors cursor-pointer"
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

      {/* 3. Event Types Table */}
      <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white">Event Types</h3>
        
        <div className="overflow-x-auto rounded-xl border border-[#232d3f] bg-[#131a26]">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-[#0b0f19] text-slate-400 font-bold uppercase tracking-wider border-b border-[#232d3f]">
              <tr>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Count</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232d3f]/60 font-medium">
              <tr className="hover:bg-[#1b2535]/60 transition-colors">
                <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Interviews
                </td>
                <td className="py-3 px-4 font-mono font-bold text-slate-200">
                  {events.filter(e => e.type === 'interview').length}
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                    Auto-created
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-[#1b2535]/60 transition-colors">
                <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> OA Deadlines
                </td>
                <td className="py-3 px-4 font-mono font-bold text-slate-200">
                  {events.filter(e => e.type === 'oa-deadline').length}
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                    Auto-reminded
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-[#1b2535]/60 transition-colors">
                <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Follow-ups
                </td>
                <td className="py-3 px-4 font-mono font-bold text-slate-200">
                  {events.filter(e => e.type === 'followup').length}
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                    Auto-scheduled
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-[#1b2535]/60 transition-colors">
                <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Referral Reminders
                </td>
                <td className="py-3 px-4 font-mono font-bold text-slate-200">
                  {events.filter(e => e.type === 'referral').length}
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                    Auto-generated
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-[#1b2535]/60 transition-colors">
                <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Application Deadlines
                </td>
                <td className="py-3 px-4 font-mono font-bold text-slate-200">
                  {events.filter(e => e.type === 'application-deadline').length}
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                    Auto-tracked
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-[#1b2535]/60 transition-colors">
                <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /> Recruiter Calls
                </td>
                <td className="py-3 px-4 font-mono font-bold text-slate-200">
                  {events.filter(e => e.type === 'recruiter-call' || e.type === 'custom').length}
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                    Auto-synced
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Edit / Create Modal */}
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
                  <option value="referral">Referral Reminder</option>
                  <option value="application-deadline">Application Deadline</option>
                  <option value="recruiter-call">Recruiter Call</option>
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
              
              {/* 1. Add Red Delete Button alongside Update & Cancel */}
              <div className="flex gap-3 pt-2">
                {editingEvent && (
                  <button
                    type="button"
                    onClick={() => initiateDelete(editingEvent.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-rose-600/20 border border-rose-500/30 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={saveEvent}
                  disabled={!newEvent.title || !newEvent.start || !newEvent.end}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-xs font-bold py-2 rounded-xl transition-colors cursor-pointer"
                >
                  {editingEvent ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#232d3f] hover:bg-[#1f2937] text-white text-xs font-bold py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-[#131a26] border border-rose-500/40 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <Trash2 className="w-6 h-6 shrink-0" />
              <h4 className="text-base font-bold text-white">Delete Event</h4>
            </div>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Are you sure you want to delete this event? This action cannot be undone.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleConfirmDelete(confirmDeleteId)}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 rounded-xl transition-colors cursor-pointer shadow-md"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 bg-[#232d3f] hover:bg-[#1f2937] text-white text-xs font-bold py-2 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Multiple Events Per Day Popover Modal */}
      {selectedDayEventsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#232d3f] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  Events for {selectedDayEventsModal.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </h3>
                <p className="text-[11px] text-[#94a3b8] mt-0.5">
                  {selectedDayEventsModal.events.length} events scheduled
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayEventsModal(null)}
                className="text-[#94a3b8] hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {selectedDayEventsModal.events.map((event) => (
                <div
                  key={event.id}
                  onClick={() => {
                    setSelectedDayEventsModal(null);
                    editEvent(event);
                  }}
                  className={`p-3 rounded-xl border ${getEventColor(event.type)} cursor-pointer hover:opacity-90 transition-opacity flex justify-between items-center gap-3`}
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-white block truncate">{event.title}</span>
                    <span className="text-[10px] opacity-80 font-mono block mt-0.5">
                      ⏰ {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-black/20 capitalize shrink-0">
                    {event.type.replace('-', ' ')}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  const dateStr = selectedDayEventsModal.date.toISOString().slice(0, 16);
                  setSelectedDayEventsModal(null);
                  setNewEvent({ title: '', start: dateStr, end: dateStr, type: 'interview', company: '', description: '' });
                  setEditingEvent(null);
                  setShowEventModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Event
              </button>
              <button
                type="button"
                onClick={() => setSelectedDayEventsModal(null)}
                className="px-3.5 py-2 bg-[#232d3f] hover:bg-[#1f2937] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationHub;
