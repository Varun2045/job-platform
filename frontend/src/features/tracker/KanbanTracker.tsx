import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, X, Download, MoveLeft, MoveRight, Layers, AlertCircle, Plus,
  FileText, Bookmark, Send, Calendar, Award
} from 'lucide-react';
import { PageHeader } from '../../components/PageHeader.js';

export type KanbanStage =
  | 'Wishlist'
  | 'Saved'
  | 'Applied'
  | 'Assessment'
  | 'Screening'
  | 'Interview'
  | 'Offer'
  | 'Accepted'
  | 'Rejected'
  | 'Withdrawn'
  | 'Archived';

const COLUMNS: KanbanStage[] = [
  'Wishlist',
  'Saved',
  'Applied',
  'Assessment',
  'Screening',
  'Interview',
  'Offer',
  'Accepted',
  'Rejected',
  'Withdrawn',
  'Archived',
];

// Helper: Formats relative date for card footer (e.g. "2 days ago", "Today", "Yesterday")
function formatTimeAgo(dateInput?: string): string {
  if (!dateInput) return 'Recently';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Recently';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  const months = Math.floor(diffDays / 30);
  return `${months} ${months === 1 ? 'month' : 'months'} ago`;
}

export const KanbanTracker: React.FC = () => {
  const queryClient = useQueryClient();

  // Filter states
  const [filterCompany, setFilterCompany] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'order' | 'company' | 'newest'>('order');

  // New Application Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCompany, setNewCompany] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newStage, setNewStage] = useState<KanbanStage>('Wishlist');
  const [newUrl, setNewUrl] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Fetch V1.1 Kanban Board Data
  const { data: boardData, isLoading, isError, refetch } = useQuery({
    queryKey: ['kanban', 'board'],
    queryFn: async () => {
      const res = await fetch('/api/v1/applications/board');
      if (!res.ok) throw new Error('Failed to fetch Kanban board');
      const json = await res.json();
      return json.data;
    },
  });

  // Create Application Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: newCompany.trim(),
          title: newTitle.trim(),
          jobId: newTitle.trim() || 'N/A',
          status: newStage,
          jobBoardUrl: newUrl.trim() || undefined,
          location: newLocation.trim() || undefined,
          notes: newNotes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to create application');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'board'] });
      setIsCreateModalOpen(false);
      resetCreateForm();
    },
    onError: (err: any) => {
      setCreateError(err.message || 'Failed to create application');
    },
  });

  const resetCreateForm = () => {
    setNewCompany('');
    setNewTitle('');
    setNewStage('Wishlist');
    setNewUrl('');
    setNewLocation('');
    setNewNotes('');
    setCreateError(null);
  };

  // Stage Move Mutation with Optimistic Updates
  const stageMoveMutation = useMutation({
    mutationFn: async ({ id, targetStatus, targetStageOrder }: { id: string; targetStatus: KanbanStage; targetStageOrder?: number }) => {
      const res = await fetch(`/api/v1/applications/${encodeURIComponent(id)}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetStatus, targetStageOrder }),
      });
      if (!res.ok) throw new Error('Failed to move application stage');
      return res.json();
    },
    onMutate: async ({ id, targetStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['kanban', 'board'] });
      const previousBoard = queryClient.getQueryData(['kanban', 'board']);
      // Optimistically update cache
      if (previousBoard) {
        queryClient.setQueryData(['kanban', 'board'], (old: any) => {
          if (!old || !old.columns) return old;
          const newCols = { ...old.columns };
          let targetApp: any = null;
          for (const s of COLUMNS) {
            if (newCols[s]) {
              const idx = newCols[s].applications.findIndex((a: any) => a.jobId === id || a.jobHash === id);
              if (idx >= 0) {
                targetApp = { ...newCols[s].applications[idx], status: targetStatus };
                newCols[s].applications = newCols[s].applications.filter((_: any, i: number) => i !== idx);
                newCols[s].count = newCols[s].applications.length;
                break;
              }
            }
          }
          if (targetApp && newCols[targetStatus]) {
            newCols[targetStatus].applications.push(targetApp);
            newCols[targetStatus].count = newCols[targetStatus].applications.length;
          }
          return { ...old, columns: newCols };
        });
      }
      return { previousBoard };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(['kanban', 'board'], context.previousBoard);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'board'] });
    },
  });

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('applicationId', id);
  };

  const onDrop = (e: React.DragEvent, targetStage: KanbanStage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('applicationId');
    if (id) {
      stageMoveMutation.mutate({ id, targetStatus: targetStage });
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleExportCSV = () => {
    window.open('/api/backup/export-csv', '_blank');
  };

  const resetFilters = () => {
    setFilterCompany('');
    setFilterStage('all');
    setSearchQuery('');
    setSortBy('order');
  };

  const hasActiveFilters = Boolean(filterCompany || filterStage !== 'all' || searchQuery);

  // Dynamic Statistic Calculations
  const getColCount = (stageName: KanbanStage) => boardData?.columns?.[stageName]?.count || 0;
  
  const totalAppsCount = boardData?.totalApplications ?? (
    COLUMNS.reduce((sum, col) => sum + getColCount(col), 0)
  );
  const wishlistCount = getColCount('Wishlist') + getColCount('Saved');
  const appliedCount = getColCount('Applied');
  const interviewCount = getColCount('Interview') + getColCount('Screening') + getColCount('Assessment');
  const offersCount = getColCount('Offer') + getColCount('Accepted');

  const statCards = [
    { label: 'Total Applications', value: totalAppsCount, icon: FileText, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Wishlist', value: wishlistCount, icon: Bookmark, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Applied', value: appliedCount, icon: Send, color: 'text-sky-400', bg: 'bg-sky-500/10' },
    { label: 'Interview', value: interviewCount, icon: Calendar, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Offers', value: offersCount, icon: Award, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen text-white">
      {/* Header Bar */}
      <PageHeader
        themeKey="kanban"
        title="Application Kanban CRM"
        description="Track applications across 11 workflow stages with drag-and-drop ordering."
        icon={Layers}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" /> New Application
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium text-sm text-white transition-colors cursor-pointer shadow-lg shadow-indigo-600/20"
          >
            <Download className="w-4 h-4" /> Export Board CSV
          </button>
        </div>
      </PageHeader>

      {/* 1. Summary Statistic Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-4 flex flex-col justify-between hover:border-indigo-600/50 transition duration-200 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">{card.label}</span>
              <div className={`p-2 rounded-xl ${card.bg}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-white">{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-[#131a26] p-4 rounded-2xl border border-[#232d3f] mb-6 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search company, job title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0b0f19] border border-[#232d3f] rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="bg-[#0b0f19] border border-[#232d3f] rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Stages</option>
            {COLUMNS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#0b0f19] border border-[#232d3f] rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="order">Custom Order</option>
            <option value="company">Company Name</option>
            <option value="newest">Newest Updated</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-4 h-96 animate-pulse">
              <div className="h-6 bg-slate-800 rounded-lg mb-4 w-1/2" />
              <div className="space-y-3">
                <div className="h-20 bg-slate-800/60 rounded-xl" />
                <div className="h-20 bg-slate-800/60 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-6 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Failed to load Kanban board</p>
              <p className="text-xs text-rose-400/80">Check network connection or backend services.</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Kanban Columns Grid */}
      {!isLoading && !isError && boardData && (
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-indigo-600/40">
          {COLUMNS.map((stage) => {
            const col = boardData.columns[stage] || { stage, count: 0, applications: [] };

            // Apply client-side search/filter
            const rawApps = col.applications || [];
            const filtered = rawApps.filter((app: any) => {
              if (filterStage !== 'all' && stage !== filterStage) return false;
              if (filterCompany && !app.company?.toLowerCase().includes(filterCompany.toLowerCase())) return false;
              if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return app.company?.toLowerCase().includes(q) || app.jobId?.toLowerCase().includes(q) || app.title?.toLowerCase().includes(q);
              }
              return true;
            }).sort((a: any, b: any) => {
              if (sortBy === 'company') return (a.company || '').localeCompare(b.company || '');
              if (sortBy === 'newest') return new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime();
              return (a.stageOrder ?? 0) - (b.stageOrder ?? 0);
            });

            return (
              <div
                key={stage}
                onDrop={(e) => onDrop(e, stage)}
                onDragOver={onDragOver}
                className="w-80 shrink-0 bg-[#131a26] border border-[#232d3f] rounded-2xl p-4 flex flex-col max-h-[800px] shadow-xl"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#232d3f]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-200">{stage}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold">
                      {col.count}
                    </span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {filtered.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center border border-dashed border-[#232d3f] rounded-xl text-slate-500 text-xs">
                      No applications
                    </div>
                  ) : (
                    filtered.map((app: any) => {
                      const displayStage = app.status || stage;
                      const timeAgo = formatTimeAgo(app.appliedDate || app.lastUpdated);

                      return (
                        <div
                          key={app.jobId || app.jobHash}
                          draggable
                          onDragStart={(e) => onDragStart(e, app.jobId || app.jobHash)}
                          className="bg-[#0b0f19] border border-[#232d3f] hover:border-indigo-500/50 p-3.5 rounded-xl shadow-md transition-all cursor-grab active:cursor-grabbing group hover:shadow-indigo-500/10 flex flex-col justify-between"
                        >
                          {/* 2. Improved Card Preview: Company Name (Primary) & Badges */}
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="font-bold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors leading-snug truncate">
                                {app.company}
                              </h3>
                              {app.isRemote && (
                                <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 shrink-0">
                                  Remote
                                </span>
                              )}
                            </div>

                            {/* Job Title (Slightly Smaller) */}
                            <p className="text-xs text-slate-300 group-hover:text-slate-200 transition-colors truncate font-medium mb-2">
                              {app.title || app.jobId}
                            </p>
                          </div>

                          {/* Footer Line: Stage • Time Ago (Muted Text) */}
                          <div className="flex items-center justify-between pt-2 border-t border-[#1b2535] text-slate-400 text-xs mt-1">
                            <span className="text-[11px] text-slate-500 truncate font-mono">
                              {displayStage} • {timeAgo}
                            </span>
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              {COLUMNS.indexOf(stage) > 0 && (
                                <button
                                  title="Move to previous stage"
                                  onClick={() =>
                                    stageMoveMutation.mutate({
                                      id: app.jobId || app.jobHash,
                                      targetStatus: COLUMNS[COLUMNS.indexOf(stage) - 1],
                                    })
                                  }
                                  className="p-1 hover:bg-[#1b2535] hover:text-indigo-400 rounded cursor-pointer"
                                >
                                  <MoveLeft className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {COLUMNS.indexOf(stage) < COLUMNS.length - 1 && (
                                <button
                                  title="Move to next stage"
                                  onClick={() =>
                                    stageMoveMutation.mutate({
                                      id: app.jobId || app.jobHash,
                                      targetStatus: COLUMNS[COLUMNS.indexOf(stage) + 1],
                                    })
                                  }
                                  className="p-1 hover:bg-[#1b2535] hover:text-indigo-400 rounded cursor-pointer"
                                >
                                  <MoveRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. New Application Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#232d3f]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" /> New Application
              </h3>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetCreateForm();
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1b2535] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3 rounded-xl mb-4 text-xs">
                {createError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Company Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Google, Microsoft, Stripe"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-[#232d3f] rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Job Title / Role <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Software Engineer"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-[#232d3f] rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Workflow Stage
                </label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value as KanbanStage)}
                  className="w-full bg-[#0b0f19] border border-[#232d3f] rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {COLUMNS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Job Board URL
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-[#232d3f] rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Remote, San Francisco, CA"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-[#232d3f] rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Add optional notes..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-[#232d3f] rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#232d3f]">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetCreateForm();
                }}
                className="px-4 py-2 bg-[#1b2535] hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!newCompany.trim() || !newTitle.trim() || createMutation.isPending}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                {createMutation.isPending ? 'Saving...' : 'Add Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
