import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Activity, Cpu, Database, Mail, RefreshCw, Download, Upload, Server, CheckCircle, ToggleRight, List, AlertTriangle } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'health' | 'flags' | 'audits'>('health');
  const [importJson, setImportJson] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Telemetry Query
  const { data: telemetryData, isLoading: isTelemetryLoading, refetch: refetchTelemetry } = useQuery({
    queryKey: ['admin-telemetry'],
    queryFn: async () => {
      const res = await fetch('/api/admin/telemetry');
      if (!res.ok) throw new Error('Failed to load admin stats');
      return res.json();
    },
    refetchInterval: 10000,
    enabled: activeTab === 'health'
  });

  // 1b. Scraper Watchdog Query
  const { data: watchdogData, refetch: refetchWatchdog } = useQuery({
    queryKey: ['admin-scraper-watchdog'],
    queryFn: async () => {
      const res = await fetch('/api/admin/scraper-watchdog');
      if (!res.ok) throw new Error('Failed to load scraper watchdog data');
      return res.json();
    },
    refetchInterval: 15000,
    enabled: activeTab === 'health'
  });

  // 2. Feature Flags Query
  const { data: flags = {}, refetch: refetchFlags } = useQuery<Record<string, boolean>>({
    queryKey: ['admin-flags'],
    queryFn: async () => {
      const res = await fetch('/api/admin/feature-flags');
      if (!res.ok) throw new Error('Failed to load feature flags');
      const list = await res.json();
      const record: Record<string, boolean> = {};
      if (Array.isArray(list)) {
        list.forEach((item: any) => {
          if (item && item.key) {
            record[item.key] = item.enabled !== false;
          }
        });
      }
      return record;
    },
    enabled: activeTab === 'flags'
  });

  // 3. Audit Logs Query
  const { data: auditLogs = [], refetch: refetchAudits } = useQuery<any[]>({
    queryKey: ['admin-audits'],
    queryFn: async () => {
      const res = await fetch('/api/admin/audit-logs');
      if (!res.ok) throw new Error('Failed to load audit logs');
      return res.json();
    },
    enabled: activeTab === 'audits'
  });

  // Mutations
  const toggleFlagMutation = useMutation({
    mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }) => {
      const res = await fetch(`/api/admin/feature-flags/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      if (!res.ok) throw new Error('Failed to update feature flag');
      return res.json();
    },
    onSuccess: () => {
      refetchFlags();
    }
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/backup/export', { method: 'POST' });
      if (!res.ok) throw new Error('Export failed');
      return res.json();
    },
    onSuccess: (backupData) => {
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `job-monitor-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  });

  const importMutation = useMutation({
    mutationFn: async (jsonStr: string) => {
      const payload = JSON.parse(jsonStr);
      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Import failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setSuccessMsg('System configuration and states successfully restored!');
      setImportJson('');
      setTimeout(() => setSuccessMsg(''), 5000);
    },
    onError: (err: any) => {
      alert(`Restore failed: ${err.message}`);
    }
  });

  const handleRefresh = () => {
    if (activeTab === 'health') {
      refetchTelemetry();
      refetchWatchdog();
    }
    if (activeTab === 'flags') refetchFlags();
    if (activeTab === 'audits') refetchAudits();
  };

  const { metrics, health } = telemetryData || {};
  const sysHealth = health?.status || 'healthy';

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-400" /> Admin Console
          </h1>
          <p className="text-sm text-[#94a3b8]">Production health metrics, real-time worker pools, and data backups</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 bg-[#1b2535] hover:bg-[#232d3f] border border-[#232d3f] text-white px-4 py-2 rounded-xl text-xs font-bold transition duration-200 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#232d3f] gap-4">
        {[
          { id: 'health', label: 'System Health & Backups', icon: Activity },
          { id: 'flags', label: 'Feature Flags', icon: ToggleRight },
          { id: 'audits', label: 'Audit Logs Trail', icon: List },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 pb-3 px-1 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === t.id
                ? 'border-indigo-600 text-white'
                : 'border-transparent text-[#94a3b8] hover:text-white'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'health' && (
        <>
          {isTelemetryLoading ? (
            <div className="p-8 animate-pulse text-[#94a3b8]">Loading Administrative Telemetry...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">System State</span>
                    <div className={`text-xl font-bold uppercase ${
                      sysHealth === 'healthy' ? 'text-emerald-400' : sysHealth === 'degraded' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {sysHealth}
                    </div>
                  </div>
                  <Activity className={`w-8 h-8 ${
                    sysHealth === 'healthy' ? 'text-emerald-400' : sysHealth === 'degraded' ? 'text-amber-400' : 'text-red-400'
                  }`} />
                </div>

                <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Active Workers</span>
                    <div className="text-2xl font-black text-white">{metrics?.activeWorkers ?? 0} / 5</div>
                  </div>
                  <Server className="w-8 h-8 text-indigo-400" />
                </div>

                <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Enqueued Jobs</span>
                    <div className="text-2xl font-black text-white">{metrics?.queueSize ?? 0}</div>
                  </div>
                  <Cpu className="w-8 h-8 text-purple-400" />
                </div>

                <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Database Link</span>
                    <div className={`text-xl font-bold uppercase ${
                      metrics?.dbStatus === 'connected' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {metrics?.dbStatus}
                    </div>
                  </div>
                  <Database className="w-8 h-8 text-emerald-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 space-y-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Scraper Engine Analytics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#94a3b8]">
                      <div className="bg-[#1b2535] p-4 rounded-xl border border-[#232d3f] space-y-2">
                        <span className="font-bold text-white block">Active Fleet</span>
                        <div className="flex justify-between"><span>Healthy:</span><span className="text-emerald-400 font-bold">{health?.checks?.scrapers?.healthy ?? 0}</span></div>
                        <div className="flex justify-between"><span>Degraded:</span><span className="text-amber-400 font-bold">{health?.checks?.scrapers?.degraded ?? 0}</span></div>
                        <div className="flex justify-between"><span>Disabled:</span><span className="text-red-400 font-bold">{health?.checks?.scrapers?.disabled ?? 0}</span></div>
                      </div>

                      <div className="bg-[#1b2535] p-4 rounded-xl border border-[#232d3f] space-y-2">
                        <span className="font-bold text-white block">API Latency</span>
                        <div className="text-3xl font-extrabold text-white">{metrics?.avgLatencyMs ?? 0}ms</div>
                        <span className="text-[10px] text-[#6b7280]">Total requests served: {metrics?.totalRequests ?? 0}</span>
                      </div>

                      <div className="bg-[#1b2535] p-4 rounded-xl border border-[#232d3f] space-y-2">
                        <span className="font-bold text-white block flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-indigo-400" /> Resend Dispatcher</span>
                        <div className="flex justify-between"><span>Delivered:</span><span className="text-white font-bold">{metrics?.emailSuccessCount ?? 0}</span></div>
                        <div className="flex justify-between"><span>Failures:</span><span className="text-red-400 font-bold">{metrics?.emailFailureCount ?? 0}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 space-y-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Node.js Production Environment</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-[#94a3b8]">
                      <div className="bg-[#1b2535] p-4 rounded-xl border border-[#232d3f] flex justify-between items-center">
                        <span>Heap Allocated Memory:</span>
                        <span className="text-white font-bold">{health?.checks?.system?.memoryHeapUsedMb ?? 0} MB / {health?.checks?.system?.memoryHeapTotalMb ?? 0} MB</span>
                      </div>
                      <div className="bg-[#1b2535] p-4 rounded-xl border border-[#232d3f] flex justify-between items-center">
                        <span>Uptime Clock:</span>
                        <span className="text-white font-bold">{Math.round((health?.checks?.system?.uptimeSeconds ?? 0) / 3600)} Hours</span>
                      </div>
                      <div className="bg-[#1b2535] p-4 rounded-xl border border-[#232d3f] flex justify-between items-center">
                        <span>CPU Usage:</span>
                        <span className="text-white font-bold">{health?.checks?.system?.cpuUsagePercent ?? 0}%</span>
                      </div>
                      <div className="bg-[#1b2535] p-4 rounded-xl border border-[#232d3f] flex justify-between items-center">
                        <span>Disk Usage:</span>
                        <span className="text-white font-bold">{health?.checks?.system?.diskUsagePercent ?? 0}%</span>
                      </div>
                      <div className="bg-[#1b2535] p-4 rounded-xl border border-[#232d3f] flex justify-between items-center">
                        <span>API Status:</span>
                        <span className={`text-white font-bold ${sysHealth === 'healthy' ? 'text-emerald-400' : 'text-red-400'}`}>{sysHealth}</span>
                      </div>
                      <div className="bg-[#1b2535] p-4 rounded-xl border border-[#232d3f] flex justify-between items-center">
                        <span>Database Status:</span>
                        <span className={`text-white font-bold ${metrics?.dbStatus === 'connected' ? 'text-emerald-400' : 'text-red-400'}`}>{metrics?.dbStatus}</span>
                      </div>
                      <div className="bg-[#1b2535] p-4 rounded-xl border border-[#232d3f] flex justify-between items-center">
                        <span>Queue Status:</span>
                        <span className="text-white font-bold">{metrics?.queueSize ?? 0} jobs</span>
                      </div>
                      <div className="bg-[#1b2535] p-4 rounded-xl border border-[#232d3f] flex justify-between items-center">
                        <span>Worker Status:</span>
                        <span className="text-white font-bold">{metrics?.activeWorkers ?? 0} / 5 active</span>
                      </div>
                      <div className="bg-[#1b2535] p-4 rounded-xl border border-[#232d3f] flex justify-between items-center">
                        <span>Scraper Status:</span>
                        <span className="text-white font-bold">{health?.checks?.scrapers?.healthy ?? 0} healthy</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Configuration Backups */}
                  <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 space-y-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-400" /> Configuration Backups
                    </h3>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-xs text-[#94a3b8]">
                        <div className="bg-[#1b2535] p-3 rounded-xl border border-[#232d3f] flex justify-between items-center">
                          <span>Last Backup:</span>
                          <span className="text-white font-bold">{telemetryData?.lastBackupTime || 'Never'}</span>
                        </div>
                        <div className="bg-[#1b2535] p-3 rounded-xl border border-[#232d3f] flex justify-between items-center">
                          <span>Backup Size:</span>
                          <span className="text-white font-bold">{telemetryData?.backupSize || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => exportMutation.mutate()}
                          className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition duration-200 cursor-pointer"
                        >
                          <Download className="w-4 h-4" /> Export Configuration
                        </button>
                        <button
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '.json';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (evt) => {
                                  setImportJson(evt.target?.result as string);
                                };
                                reader.readAsText(file);
                              }
                            };
                            input.click();
                          }}
                          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition duration-200 cursor-pointer"
                        >
                          <Upload className="w-4 h-4" /> Import Configuration
                        </button>
                      </div>

                      {importJson && (
                        <div className="border-t border-[#232d3f] pt-4 space-y-3">
                          <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider block">Restore Preview</span>
                          
                          {successMsg && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold p-3 rounded-xl flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" /> {successMsg}
                            </div>
                          )}

                          <div className="bg-[#1b2535] p-3 rounded-xl border border-[#232d3f] max-h-40 overflow-y-auto">
                            <pre className="text-[9px] text-[#94a3b8] font-mono whitespace-pre-wrap">{importJson.substring(0, 500)}{importJson.length > 500 ? '...' : ''}</pre>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => importMutation.mutate(importJson)}
                              disabled={importMutation.isPending}
                              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl transition duration-200 cursor-pointer disabled:opacity-50"
                            >
                              {importMutation.isPending ? 'Restoring...' : 'Confirm Restore'}
                            </button>
                            <button
                              onClick={() => setImportJson('')}
                              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 rounded-xl transition duration-200 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scraper Failure Watchdog Widget */}
                  <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 space-y-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" /> Scraper Failure Watchdog
                    </h3>
                    
                    {watchdogData && watchdogData.length > 0 ? (
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {watchdogData.map((w: any) => (
                          <div key={w.id} className="bg-[#1b2535] border border-red-500/20 p-3 rounded-xl space-y-2 text-xs">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-white">{w.name}</span>
                              <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                                {w.consecutiveFailures} Failures
                              </span>
                            </div>
                            <div className="text-[10px] text-[#94a3b8] space-y-1">
                              <div><span className="font-semibold text-gray-500">ATS:</span> {w.detectedAts || 'fallback'}</div>
                              <div><span className="font-semibold text-gray-500">Last Scraper:</span> {w.lastScraperUsed || 'none'}</div>
                              <div><span className="font-semibold text-gray-500">Failed:</span> {w.lastFailedScrape ? new Date(w.lastFailedScrape).toLocaleString() : 'N/A'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs p-4 rounded-xl flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        <div>
                          <p className="font-bold">System Healthy</p>
                          <p className="text-[10px] text-[#94a3b8] mt-0.5">All configured company scraper routines are executing normally.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'flags' && (
        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 space-y-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">System Feature Flags</h3>
          <p className="text-xs text-[#94a3b8]">Toggle live system components and AI analyzers in production runtime.</p>
          
          <div className="grid grid-cols-1 gap-4">
            {[
              { key: 'ai_suggestions', label: 'AI Match & Tailoring', desc: 'Allows generation of plain English summaries, ATS resume optimization, and cover letters.', environment: 'Production' },
              { key: 'email_alerts', label: 'Email Dispatcher Alerting', desc: 'Sends email digests of matched jobs to users.', environment: 'Production' },
              { key: 'reports_generation', label: 'Weekly Reports PDF Generation', desc: 'Enables compiling weekly match activity logs into downloadable exports.', environment: 'Production' },
              { key: 'scrapers_active', label: 'Background Scraper Fleet', desc: 'Toggles cron task scrapers and matching worker engine.', environment: 'Production' },
              { key: 'realtime_notifications', label: 'Live Notifications Sync', desc: 'Enables realtime notification broadcast to active dashboard panels.', environment: 'Production' }
            ].map(f => {
              const val = flags[f.key] !== false; // Default to true if not set
              return (
                <div key={f.key} className="p-4 bg-[#1b2535] border border-[#232d3f] rounded-xl">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 pr-4 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white block">{f.label}</span>
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-semibold">{f.environment}</span>
                      </div>
                      <p className="text-[10px] text-[#94a3b8]">{f.desc}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[9px] text-[#6b7280]">Status: <span className={`font-semibold ${val ? 'text-emerald-400' : 'text-red-400'}`}>{val ? 'Enabled' : 'Disabled'}</span></span>
                        <span className="text-[9px] text-[#6b7280]">Last Modified: <span className="font-semibold">Just now</span></span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to ${val ? 'disable' : 'enable'} "${f.label}"?`)) {
                            toggleFlagMutation.mutate({ key: f.key, enabled: !val });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${
                          val 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {val ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to rollback "${f.label}" to its default state?`)) {
                            toggleFlagMutation.mutate({ key: f.key, enabled: true });
                          }
                        }}
                        className="px-3 py-1.5 bg-[#232d3f] hover:bg-[#1f2937] border border-[#232d3f] text-[#94a3b8] hover:text-white rounded-lg text-xs font-bold transition duration-200 cursor-pointer"
                      >
                        Rollback
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'audits' && (
        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 space-y-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Immutable Security Audit Trail</h3>
          <p className="text-xs text-[#94a3b8]">Real-time records of user logins, settings modifications, and exports.</p>
          <div className="overflow-x-auto border border-[#232d3f] rounded-xl bg-[#1b2535]">
            <table className="w-full text-xs text-[#94a3b8] text-left">
              <thead className="bg-[#131a26] text-white font-bold uppercase border-b border-[#232d3f]">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">User ID</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232d3f]">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#6b7280]">No security events logged yet.</td>
                  </tr>
                ) : (
                  auditLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-[#1f2a3f] transition duration-150">
                      <td className="p-3 whitespace-nowrap font-mono text-[10px]">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                          log.action === 'Login' || log.action === 'Register' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20' :
                          log.action === 'Resume Upload' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' :
                          log.action === 'Settings Change' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20' :
                          'bg-[#232d3f] text-white border border-[#2c3749]'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[9px] truncate max-w-28" title={log.user_id}>
                        {log.user_id || 'System'}
                      </td>
                      <td className="p-3 font-mono text-[10px]">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                      <td className="p-3 font-mono text-[9px] truncate max-w-xs" title={JSON.stringify(log.details)}>
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminPanel;
