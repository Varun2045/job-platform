import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, X, Download, MoveLeft, MoveRight, Layers, AlertCircle } from 'lucide-react';
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

export const KanbanTracker: React.FC = () => {
  const queryClient = useQueryClient();

  // Filter states
  const [filterCompany, setFilterCompany] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'order' | 'company' | 'newest'>('order');

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

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen text-white">
      {/* Header Bar */}
      <PageHeader
        themeKey="kanban"
        title="Application Kanban CRM"
        description="Track applications across 11 workflow stages with drag-and-drop ordering."
        icon={Layers}
      >
        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium text-sm transition-colors cursor-pointer shadow-lg shadow-indigo-600/20"
        >
          <Download className="w-4 h-4" /> Export Board CSV
        </button>
      </PageHeader>

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
                    filtered.map((app: any) => (
                      <div
                        key={app.jobId || app.jobHash}
                        draggable
                        onDragStart={(e) => onDragStart(e, app.jobId || app.jobHash)}
                        className="bg-[#0b0f19] border border-[#232d3f] hover:border-indigo-500/50 p-4 rounded-xl shadow-md transition-all cursor-grab active:cursor-grabbing group hover:shadow-indigo-500/10"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors">
                            {app.company}
                          </h3>
                          {app.isRemote && (
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                              Remote
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 mb-2 truncate">
                          {app.title || app.jobId}
                        </p>

                        {app.location && (
                          <p className="text-[11px] text-slate-500 mb-3 truncate">📍 {app.location}</p>
                        )}

                        {/* Accessibility Move Buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#1b2535] text-slate-400 text-xs">
                          <span className="text-[10px] text-slate-500">
                            {app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : 'Draft'}
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
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
