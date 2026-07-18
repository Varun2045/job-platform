import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, X, Download } from 'lucide-react';

type Status = 'New' | 'Saved' | 'Applied' | 'OA Scheduled' | 'OA Completed' | 'Interview' | 'Offer' | 'Rejected' | 'Closed';

const COLUMNS: Status[] = ['New', 'Saved', 'Applied', 'OA Scheduled', 'OA Completed', 'Interview', 'Offer', 'Rejected', 'Closed'];

export const KanbanTracker: React.FC = () => {
  const queryClient = useQueryClient();
  const handleExportCSV = () => {
    window.open('/api/backup/export-csv', '_blank');
  };
  
  // Filter states
  const [filterCompany, setFilterCompany] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterJobType, setFilterJobType] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'company' | 'interview'>('newest');

  const { data: applications, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const res = await fetch('/api/applications');
      if (!res.ok) throw new Error('Failed to load applications');
      return res.json();
    }
  });

  const moveMutation = useMutation({
    mutationFn: async ({ jobHash, status, notes }: { jobHash: string; status: Status; notes?: string }) => {
      const existing = (applications || []).find((a: any) => a.jobHash === jobHash);
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobHash,
          company: existing?.company || 'Unknown',
          jobId: existing?.jobId || 'N/A',
          status,
          notes: notes || existing?.notes || ''
        })
      });
      if (!res.ok) throw new Error('Failed to update application status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    }
  });

  const onDragStart = (e: React.DragEvent, jobHash: string) => {
    e.dataTransfer.setData('jobHash', jobHash);
  };

  const onDrop = (e: React.DragEvent, targetStatus: Status) => {
    const jobHash = e.dataTransfer.getData('jobHash');
    if (jobHash) {
      moveMutation.mutate({ jobHash, status: targetStatus });
    }
  };

  const resetFilters = () => {
    setFilterCompany('');
    setFilterStatus('all');
    setFilterJobType('');
    setFilterLocation('');
    setSearchQuery('');
    setSortBy('newest');
  };

  const hasActiveFilters = filterCompany || filterStatus !== 'all' || filterJobType || filterLocation || searchQuery;

  // Filter and sort applications
  const filteredApps = (applications || []).filter((app: any) => {
    if (filterCompany && !app.company?.toLowerCase().includes(filterCompany.toLowerCase())) return false;
    if (filterStatus !== 'all' && app.status !== filterStatus) return false;
    if (filterJobType && !app.employmentType?.toLowerCase().includes(filterJobType.toLowerCase())) return false;
    if (filterLocation && !app.location?.toLowerCase().includes(filterLocation.toLowerCase())) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchCompany = app.company?.toLowerCase().includes(q);
      const matchJobId = app.jobId?.toLowerCase().includes(q);
      const matchTitle = app.title?.toLowerCase().includes(q);
      const matchLocation = app.location?.toLowerCase().includes(q);
      if (!matchCompany && !matchJobId && !matchTitle && !matchLocation) return false;
    }
    return true;
  }).sort((a: any, b: any) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      case 'oldest':
        return new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
      case 'company':
        return a.company?.localeCompare(b.company);
      case 'interview':
        // Sort by interview status priority
        const statusPriority: Record<string, number> = { 'Interview': 1, 'OA Scheduled': 2, 'OA Completed': 3 };
        const aPriority = statusPriority[a.status] || 99;
        const bPriority = statusPriority[b.status] || 99;
        return aPriority - bPriority;
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-[#131a26] rounded w-1/4"></div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-72 shrink-0 h-96 bg-[#131a26] rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const apps = filteredApps;

  return (
    <div className="p-4 md:p-8 space-y-6 flex flex-col h-full overflow-hidden">
      <div className="shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Applications</h1>
          <p className="text-sm text-[#94a3b8]">Drag and drop roles across stages to manage your application pipeline</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-[#131a26] hover:bg-[#1b2535] border border-[#232d3f] text-white hover:text-indigo-400 font-bold px-4 py-2.5 rounded-xl text-xs transition duration-200 cursor-pointer shadow"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="shrink-0 bg-[#131a26] border border-[#232d3f] rounded-2xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
            />
          </div>
          <input
            type="text"
            placeholder="Company"
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-600"
          >
            <option value="all">All Statuses</option>
            {COLUMNS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Job Type"
            value={filterJobType}
            onChange={(e) => setFilterJobType(e.target.value)}
            className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
          />
          <input
            type="text"
            placeholder="Location"
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-600"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="company">Company</option>
            <option value="interview">Upcoming Interview</option>
          </select>
        </div>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="mt-3 flex items-center gap-2 text-xs text-[#94a3b8] hover:text-white transition-colors"
          >
            <X className="w-3 h-3" />
            Reset Filters
          </button>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6 h-full items-start select-none">
        {COLUMNS.map((col) => {
          const colApps = apps.filter((a: any) => a.status === col);

          return (
            <div
              key={col}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, col)}
              className="w-72 shrink-0 bg-[#131a26] border border-[#232d3f] rounded-2xl flex flex-col max-h-full"
            >
              <div className="p-4 border-b border-[#232d3f] flex items-center justify-between bg-[#1b2535] rounded-t-2xl shrink-0">
                <span className="text-sm font-bold text-white tracking-tight">{col}</span>
                <span className="bg-indigo-600/10 border border-indigo-600/20 text-[#818cf8] text-xs font-bold px-2 py-0.5 rounded-full">
                  {colApps.length}
                </span>
              </div>

              <div className="p-4 flex flex-col gap-3 overflow-y-auto min-h-[300px]">
                {colApps.length === 0 ? (
                  <div className="text-center py-12 text-xs text-[#94a3b8] border border-dashed border-[#232d3f] rounded-xl">
                    Drag jobs here
                  </div>
                ) : (
                  colApps.map((a: any) => (
                    <div
                      key={a.jobHash}
                      draggable
                      onDragStart={(e) => onDragStart(e, a.jobHash)}
                      className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-4 cursor-grab hover:border-indigo-600 active:cursor-grabbing transition duration-200"
                    >
                      <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">{a.company}</span>
                      <h4 className="text-sm font-bold text-white mt-0.5">{a.title || 'Software Engineer'}</h4>
                      <div className="flex gap-1.5 flex-wrap items-center mt-1.5 text-[10px] text-[#94a3b8]">
                        {a.location && <span className="bg-[#131a26] px-1.5 py-0.5 rounded border border-[#232d3f] truncate max-w-[120px]" title={a.location}>{a.location}</span>}
                        {a.employmentType && <span className="bg-[#131a26] px-1.5 py-0.5 rounded border border-[#232d3f]">{a.employmentType}</span>}
                        {a.isRemote && <span className="bg-indigo-600/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-600/20">Remote</span>}
                      </div>
                      <p className="text-[10px] text-[#6b7280] mt-1.5">ID: {a.jobId}</p>
                      {a.notes && (
                        <div className="mt-2 text-[11px] bg-[#131a26] border border-[#232d3f] px-2 py-1 rounded text-[#94a3b8]">
                          {a.notes}
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-[#232d3f] text-[10px] text-[#94a3b8]">
                        <span>Updated: {new Date(a.lastUpdated).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
