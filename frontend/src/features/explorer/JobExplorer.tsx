import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, MapPin, Briefcase, Globe, ExternalLink, X, Sparkles, 
  FileText, CheckSquare, Bookmark, EyeOff, Filter, Clock, RefreshCw
} from 'lucide-react';
import { CardSkeleton } from '../../components/Skeleton.js';
import { CoverLetterModal } from './CoverLetterModal.js';
import { ResumeTailoringModal } from './ResumeTailoringModal.js';
import { InterviewPrepPanel } from './InterviewPrepPanel.js';
import { useSearchParams } from 'react-router-dom';

export const JobExplorer: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search input & debouncing
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('q') || '');

  // Filter state
  const [locationQuery, setLocationQuery] = useState(searchParams.get('location') || '');
  const [debouncedLocation, setDebouncedLocation] = useState(searchParams.get('location') || '');
  const [remote, setRemote] = useState<string>(searchParams.get('remote') || 'all');
  const [experience, setExperience] = useState<string[]>(
    searchParams.get('experience') ? searchParams.get('experience')!.split(',') : []
  );
  const [department, setDepartment] = useState<string[]>(
    searchParams.get('department') ? searchParams.get('department')!.split(',') : []
  );
  const [company, setCompany] = useState<string>(searchParams.get('company') || 'all');
  const [minScore, setMinScore] = useState<string>(searchParams.get('minScore') || '0');
  const [employmentType, setEmploymentType] = useState<string>(searchParams.get('employmentType') || 'all');
  const [sortBy, setSortBy] = useState<'opportunity' | 'match' | 'newest'>('opportunity');

  // Infinite Scroll & Cursor Pagination state
  const [accumulatedJobs, setAccumulatedJobs] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [selectedJobHash, setSelectedJobHash] = useState<string | null>(null);
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('bookmarked_jobs');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [hiddenJobs, setHiddenJobs] = useState<Set<string>>(new Set());

  // UI Drawer & Modal state
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [openCoverLetter, setOpenCoverLetter] = useState(false);
  const [openTailor, setOpenTailor] = useState(false);
  const [openPrep, setOpenPrep] = useState(false);
  const [trackNotes, setTrackNotes] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Press "/" to focus search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 200ms Debounce search input for snappy response
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // 200ms Debounce location input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedLocation(locationQuery);
    }, 200);
    return () => clearTimeout(handler);
  }, [locationQuery]);

  // Sync state to URL parameters
  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedQuery) params.q = debouncedQuery;
    if (debouncedLocation) params.location = debouncedLocation;
    if (remote !== 'all') params.remote = remote;
    if (experience.length > 0) params.experience = experience.join(',');
    if (department.length > 0) params.department = department.join(',');
    if (company !== 'all') params.company = company;
    if (minScore !== '0') params.minScore = minScore;
    if (employmentType !== 'all') params.employmentType = employmentType;

    setSearchParams(params, { replace: true });
    setCursor(null);
    setAccumulatedJobs([]);
  }, [debouncedQuery, debouncedLocation, remote, experience, department, company, minScore, employmentType, sortBy]);

  // Query Jobs API (Cursor-based infinite scroll + database-level facet aggregation)
  const { data: apiResponse, isLoading: isJobsLoading, isFetching } = useQuery({
    queryKey: ['jobs-feed', debouncedQuery, debouncedLocation, remote, experience, department, company, minScore, employmentType, sortBy, cursor],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: debouncedQuery,
        location: debouncedLocation,
        remote: remote === 'all' ? '' : remote,
        experience: experience.join(','),
        department: department.join(','),
        company: company === 'all' ? '' : company,
        minScore: minScore === '0' ? '' : minScore,
        employmentType: employmentType === 'all' ? '' : employmentType,
        sort: sortBy,
        pageSize: '25',
        ...(cursor ? { cursor } : {})
      });
      const res = await fetch(`/api/jobs?${params}`);
      if (!res.ok) throw new Error('Failed to fetch job feed');
      return res.json();
    }
  });

  // Accumulate jobs for smooth infinite scroll
  useEffect(() => {
    if (apiResponse && apiResponse.jobs) {
      if (!cursor) {
        setAccumulatedJobs(apiResponse.jobs);
        if (apiResponse.jobs.length > 0 && !selectedJobHash) {
          setSelectedJobHash(apiResponse.jobs[0].job.jobHash);
        }
      } else {
        setAccumulatedJobs(prev => {
          const existingHashes = new Set(prev.map(j => j.job.jobHash));
          const newUnique = apiResponse.jobs.filter((j: any) => !existingHashes.has(j.job.jobHash));
          return [...prev, ...newUnique];
        });
      }
    }
  }, [apiResponse, cursor]);

  // Fetch Selected Job Detail
  const { data: detailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ['job-details', selectedJobHash],
    queryFn: async () => {
      if (!selectedJobHash) return null;
      const res = await fetch(`/api/jobs/${selectedJobHash}`);
      if (!res.ok) throw new Error('Failed to load job details');
      return res.json();
    },
    enabled: !!selectedJobHash
  });

  // Track Application mutation
  const trackMutation = useMutation({
    mutationFn: async (status: string) => {
      if (!detailData) return;
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobHash: selectedJobHash,
          company: detailData.job.company,
          jobId: detailData.job.id,
          status,
          notes: trackNotes
        })
      });
      if (!res.ok) throw new Error('Failed to save application status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setTrackNotes('');
      alert('Application status tracked successfully!');
    }
  });

  // Bookmark toggle
  const toggleBookmark = (hash: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setBookmarkedJobs(prev => {
      const next = new Set(prev);
      if (next.has(hash)) next.delete(hash);
      else next.add(hash);
      localStorage.setItem('bookmarked_jobs', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  // Hide job toggle
  const hideJob = (hash: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setHiddenJobs(prev => new Set(prev).add(hash));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setLocationQuery('');
    setDebouncedLocation('');
    setRemote('all');
    setExperience([]);
    setDepartment([]);
    setCompany('all');
    setMinScore('0');
    setEmploymentType('all');
    setSearchParams({});
  };

  // Toggle array filter helper
  const toggleArrayFilter = (arr: string[], val: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (arr.includes(val)) {
      setter(arr.filter(v => v !== val));
    } else {
      setter([...arr, val]);
    }
  };

  // Keyword highlighting helper
  const renderHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark key={i} className="bg-amber-400/30 text-amber-200 px-0.5 rounded font-bold">{part}</mark>
      ) : (
        part
      )
    );
  };

  const facets = apiResponse?.facets || {};
  const visibleJobs = accumulatedJobs.filter(j => !hiddenJobs.has(j.job.jobHash));
  const hasMore = apiResponse?.pagination?.hasMore;
  const nextCursorToken = apiResponse?.pagination?.nextCursor;
  const totalCount = apiResponse?.pagination?.total ?? visibleJobs.length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen text-white font-sans bg-[#090d16]">
      
      {/* PAGE TITLE HEADER AT THE TOP */}
      <div className="pb-2">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          Job Explorer
        </h1>
        <p className="text-xs md:text-sm text-[#94a3b8] mt-1">
          Search, rank by Opportunity Score, and tailoring your applications
        </p>
      </div>

      {/* STICKY GLOBAL SEARCH BAR */}
      <div className="sticky top-0 z-30 bg-[#090d16]/95 backdrop-blur-md pb-2 pt-1">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-indigo-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search "Java Spring Boot Bangalore", "React Remote", "AI Engineer"... (Press "/" to focus)'
              className="w-full bg-[#111827] border border-[#243147] rounded-2xl py-3 pl-12 pr-12 text-sm text-white placeholder-[#64748b] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-md transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setDebouncedQuery(''); }}
                className="absolute right-4 top-3.5 text-[#64748b] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 bg-[#111827] border border-[#243147] px-4 py-3 rounded-2xl text-xs font-bold text-white hover:bg-[#162135]"
          >
            <Filter className="w-4 h-4 text-indigo-400" /> Filters
          </button>
        </div>
      </div>

      {/* ACTIVE FILTER CHIPS BAR */}
      {(debouncedQuery || debouncedLocation || remote !== 'all' || experience.length > 0 || department.length > 0 || company !== 'all' || minScore !== '0' || employmentType !== 'all') && (
        <div className="flex flex-wrap items-center gap-2 bg-[#111827] border border-[#243147] rounded-xl p-3 shadow-sm">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider mr-1">Active Filters:</span>

          {debouncedQuery && (
            <span className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              Query: "{debouncedQuery}" <button onClick={() => { setSearchQuery(''); setDebouncedQuery(''); }}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
            </span>
          )}

          {debouncedLocation && (
            <span className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              Location: {debouncedLocation} <button onClick={() => { setLocationQuery(''); setDebouncedLocation(''); }}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
            </span>
          )}

          {remote !== 'all' && (
            <span className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              {remote === 'true' ? 'Remote Only' : 'Onsite / Hybrid'} <button onClick={() => setRemote('all')}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
            </span>
          )}

          {experience.map(exp => (
            <span key={exp} className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              {exp} <button onClick={() => toggleArrayFilter(experience, exp, setExperience)}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
            </span>
          ))}

          {department.map(dept => (
            <span key={dept} className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              {dept} <button onClick={() => toggleArrayFilter(department, dept, setDepartment)}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
            </span>
          ))}

          {minScore !== '0' && (
            <span className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              Min {minScore}% Score <button onClick={() => setMinScore('0')}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
            </span>
          )}

          <button
            onClick={clearAllFilters}
            className="ml-auto text-xs font-bold text-rose-400 hover:text-rose-300 underline cursor-pointer"
          >
            Clear All
          </button>
        </div>
      )}

      {/* DASHBOARD MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLLAPSIBLE FACETED LEFT SIDEBAR */}
        <div className="hidden lg:block lg:col-span-3 space-y-6 bg-[#111827] border border-[#243147] rounded-2xl p-5 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto custom-scrollbar shadow-lg">
          
          <div className="flex items-center justify-between border-b border-[#243147] pb-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-400" /> Faceted Filters
            </h3>
            <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold px-2 py-0.5 rounded-full">
              {totalCount} jobs
            </span>
          </div>

          {/* Department Facets */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Department</span>
            <div className="space-y-1.5">
              {facets.departments?.map((f: any) => (
                <label key={f.value} className="flex items-center justify-between text-xs text-[#94a3b8] hover:text-white cursor-pointer py-1 px-2 rounded-lg hover:bg-[#192438] transition-all">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={department.includes(f.value)}
                      onChange={() => toggleArrayFilter(department, f.value, setDepartment)}
                      className="rounded border-[#243147] bg-[#090d16] text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{f.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#64748b] bg-[#090d16] px-2 py-0.5 rounded-full border border-[#243147]">
                    {f.count}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Experience Level Facets */}
          <div className="space-y-2 border-t border-[#243147] pt-4">
            <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Experience Level</span>
            <div className="space-y-1.5">
              {facets.experience?.map((f: any) => (
                <label key={f.value} className="flex items-center justify-between text-xs text-[#94a3b8] hover:text-white cursor-pointer py-1 px-2 rounded-lg hover:bg-[#192438] transition-all">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={experience.includes(f.value)}
                      onChange={() => toggleArrayFilter(experience, f.value, setExperience)}
                      className="rounded border-[#243147] bg-[#090d16] text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{f.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#64748b] bg-[#090d16] px-2 py-0.5 rounded-full border border-[#243147]">
                    {f.count}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Remote Status Facets */}
          <div className="space-y-2 border-t border-[#243147] pt-4">
            <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Remote Status</span>
            <div className="space-y-1.5">
              {facets.remote?.map((f: any) => (
                <label key={f.value} className="flex items-center justify-between text-xs text-[#94a3b8] hover:text-white cursor-pointer py-1 px-2 rounded-lg hover:bg-[#192438] transition-all">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="remoteOption"
                      checked={remote === f.value}
                      onChange={() => setRemote(remote === f.value ? 'all' : f.value)}
                      className="border-[#243147] bg-[#090d16] text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{f.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#64748b] bg-[#090d16] px-2 py-0.5 rounded-full border border-[#243147]">
                    {f.count}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Location Facets */}
          <div className="space-y-2 border-t border-[#243147] pt-4">
            <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Location</span>
            <input
              type="text"
              placeholder="Filter by city/country..."
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              className="w-full bg-[#090d16] border border-[#243147] rounded-xl py-1.5 px-3 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-indigo-500"
            />
            <div className="space-y-1.5 mt-2">
              {facets.locations?.map((f: any) => (
                <button
                  key={f.value}
                  onClick={() => { setLocationQuery(f.value); setDebouncedLocation(f.value); }}
                  className={`w-full flex items-center justify-between text-xs py-1 px-2 rounded-lg transition-all cursor-pointer ${
                    debouncedLocation === f.value ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30' : 'text-[#94a3b8] hover:bg-[#192438] hover:text-white'
                  }`}
                >
                  <span>{f.name}</span>
                  <span className="text-[10px] font-bold text-[#64748b] bg-[#090d16] px-2 py-0.5 rounded-full border border-[#243147]">
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Min Match Score */}
          <div className="space-y-2 border-t border-[#243147] pt-4">
            <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Minimum Resume Match</span>
            <select
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              className="w-full bg-[#090d16] border border-[#243147] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="0">All Match Scores</option>
              <option value="70">70% or Higher</option>
              <option value="80">80% or Higher</option>
            </select>
          </div>

        </div>

        {/* CENTRAL INFINITE SCROLL JOB FEED */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Feed Toolbar */}
          <div className="flex items-center justify-between bg-[#111827] border border-[#243147] rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-bold text-[#94a3b8]">
              Showing <span className="text-white font-extrabold">{visibleJobs.length}</span> of <span className="text-indigo-400 font-extrabold">{totalCount}</span> postings
            </span>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#090d16] border border-[#243147] text-xs text-indigo-400 font-bold py-1.5 px-3 rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="opportunity">Opportunity Score</option>
                <option value="match">Resume Match %</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>

          {/* Job Feed List */}
          {isJobsLoading && visibleJobs.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
            </div>
          ) : visibleJobs.length === 0 ? (
            /* CONTEXTUAL SMART EMPTY STATE */
            <div className="bg-[#111827] border border-[#243147] rounded-2xl p-10 text-center space-y-4 shadow-md">
              <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">No matching job listings found</h3>
                <p className="text-xs text-[#94a3b8] mt-1 max-w-sm mx-auto">
                  {debouncedQuery 
                    ? `No matches for "${debouncedQuery}". Try searching for: Spring Boot, Backend, Remote, or India.`
                    : 'Try clearing your active filter tags to view available postings.'}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <button
                  onClick={clearAllFilters}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition duration-200 cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleJobs.map(({ job, score, opportunityScore }: any) => {
                const isSelected = selectedJobHash === job.jobHash;
                const isBookmarked = bookmarkedJobs.has(job.jobHash);

                return (
                  <div
                    key={job.jobHash}
                    onClick={() => setSelectedJobHash(job.jobHash)}
                    className={`bg-[#111827] border rounded-2xl p-5 hover:border-indigo-500/70 transition-all duration-200 cursor-pointer flex flex-col justify-between group shadow-md hover:shadow-indigo-500/5 ${
                      isSelected 
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-[#162035] border-t-2 border-t-indigo-400' 
                        : 'border-[#243147] hover:bg-[#141d2f]'
                    }`}
                  >
                    {/* Top Header: Company Avatar + Title + Badges */}
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-[#1a2538] border border-[#2a3a54] rounded-xl flex items-center justify-center font-black text-indigo-400 text-sm group-hover:border-indigo-500/40 transition-all shadow-inner">
                          {(job.company || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">{job.company}</span>
                          <h3 className="text-sm font-bold text-white leading-snug group-hover:text-indigo-300 transition-colors">
                            {renderHighlightedText(job.title, debouncedQuery)}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 text-indigo-300 font-extrabold px-2.5 py-1 rounded-full text-[11px] shadow-sm">
                          {opportunityScore}% Opp
                        </span>
                        <span className="bg-[#090d16] border border-[#243147] text-[#94a3b8] font-extrabold px-2.5 py-1 rounded-full text-[11px]">
                          {score}% Match
                        </span>
                      </div>
                    </div>

                    {/* Metadata Pills */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-xs bg-[#192336] border border-[#273752] px-2.5 py-0.5 rounded-lg text-[#94a3b8] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-indigo-400" /> {job.location}
                      </span>
                      <span className="text-xs bg-[#192336] border border-[#273752] px-2.5 py-0.5 rounded-lg text-[#94a3b8] flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-indigo-400" /> {job.experience || 'Full Time'}
                      </span>
                      {job.isRemote && (
                        <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Remote
                        </span>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-between items-center pt-3 border-t border-[#243147] text-xs">
                      <span className="text-[11px] text-[#64748b] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(job.datePosted).toLocaleDateString()}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => toggleBookmark(job.jobHash, e)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isBookmarked ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-[#090d16] border-[#243147] text-[#64748b] hover:text-white'
                          }`}
                          title="Bookmark"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => hideJob(job.jobHash, e)}
                          className="p-1.5 rounded-lg bg-[#090d16] border border-[#243147] text-[#64748b] hover:text-rose-400 transition-all cursor-pointer"
                          title="Hide Job"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={job.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition duration-200 cursor-pointer shadow-sm"
                        >
                          Apply <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* CURSOR INFINITE SCROLL LOAD MORE */}
              {hasMore && (
                <div className="text-center pt-4">
                  <button
                    disabled={isFetching}
                    onClick={() => setCursor(nextCursorToken)}
                    className="bg-[#111827] hover:bg-[#162135] border border-[#243147] text-indigo-400 font-bold text-xs px-6 py-3 rounded-2xl transition duration-200 w-full flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    {isFetching ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Load More Jobs (Cursor Next Batch)'}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* SLIDE-OVER RIGHT DETAILS PANEL */}
        <div className="hidden lg:block lg:col-span-4 bg-[#111827] border border-[#243147] rounded-2xl p-6 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto custom-scrollbar space-y-6 shadow-lg">
          {isDetailLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-6 bg-[#162135] rounded w-3/4"></div>
              <div className="h-4 bg-[#162135] rounded w-1/2"></div>
              <div className="h-32 bg-[#162135] rounded"></div>
            </div>
          ) : detailData ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="border-b border-[#243147] pb-4">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{detailData.job.company}</span>
                <h2 className="text-lg font-bold text-white mt-1">{detailData.job.title}</h2>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 font-bold px-3 py-1 rounded-full text-xs">
                    {detailData.opportunityScore}% Opportunity Score
                  </span>
                  <span className="bg-[#090d16] border border-[#243147] text-[#94a3b8] font-bold px-3 py-1 rounded-full text-xs">
                    {detailData.bestScore}% Match
                  </span>
                </div>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setOpenTailor(true)}
                  className="flex flex-col items-center gap-1.5 p-3 bg-[#090d16] hover:bg-[#162135] border border-[#243147] rounded-xl text-white font-bold text-[10px] transition duration-200 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Tailor Resume
                </button>
                <button
                  onClick={() => setOpenCoverLetter(true)}
                  className="flex flex-col items-center gap-1.5 p-3 bg-[#090d16] hover:bg-[#162135] border border-[#243147] rounded-xl text-white font-bold text-[10px] transition duration-200 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Cover Letter
                </button>
                <button
                  onClick={() => setOpenPrep(true)}
                  className="flex flex-col items-center gap-1.5 p-3 bg-[#090d16] hover:bg-[#162135] border border-[#243147] rounded-xl text-white font-bold text-[10px] transition duration-200 cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4 text-amber-400" />
                  Interview Prep
                </button>
              </div>

              {/* Application Tracker Status */}
              <div className="space-y-2 border-t border-[#243147] pt-4">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Application Tracker</span>
                <input
                  type="text"
                  placeholder="Notes (e.g. Applied via LinkedIn)..."
                  value={trackNotes}
                  onChange={(e) => setTrackNotes(e.target.value)}
                  className="w-full bg-[#090d16] border border-[#243147] rounded-xl py-2 px-3 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-indigo-500 mb-2"
                />
                <div className="grid grid-cols-3 gap-2">
                  {['Saved', 'Applied', 'Interview'].map((st) => (
                    <button
                      key={st}
                      onClick={() => trackMutation.mutate(st)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] py-1.5 rounded-xl transition duration-200 cursor-pointer"
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Job Description */}
              <div className="space-y-2 border-t border-[#243147] pt-4">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Job Description</span>
                <div className="text-xs text-[#94a3b8] leading-relaxed max-h-60 overflow-y-auto custom-scrollbar p-3 bg-[#090d16] rounded-xl border border-[#243147]">
                  {detailData.job.description}
                </div>
              </div>

              {/* Contact Recommendations */}
              <ContactRecommendations jobData={detailData} />
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-[#64748b]">
              Select a job card from the feed to view full details and AI match breakdown.
            </div>
          )}
        </div>

      </div>

      {/* MOBILE SLIDE-OVER FILTER DRAWER */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/70 backdrop-blur-sm lg:hidden">
          <div className="ml-auto w-4/5 max-w-xs bg-[#111827] border-l border-[#243147] p-5 h-full overflow-y-auto space-y-6">
            <div className="flex justify-between items-center border-b border-[#243147] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Filters</h3>
              <button onClick={() => setMobileFilterOpen(false)}><X className="w-5 h-5 text-white" /></button>
            </div>

            {/* Department */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Department</span>
              {facets.departments?.map((f: any) => (
                <label key={f.value} className="flex items-center justify-between text-xs text-[#94a3b8] py-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={department.includes(f.value)}
                      onChange={() => toggleArrayFilter(department, f.value, setDepartment)}
                    />
                    <span>{f.name}</span>
                  </div>
                  <span className="text-[10px] text-[#64748b]">{f.count}</span>
                </label>
              ))}
            </div>

            {/* Experience */}
            <div className="space-y-2 border-t border-[#243147] pt-4">
              <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Experience Level</span>
              {facets.experience?.map((f: any) => (
                <label key={f.value} className="flex items-center justify-between text-xs text-[#94a3b8] py-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={experience.includes(f.value)}
                      onChange={() => toggleArrayFilter(experience, f.value, setExperience)}
                    />
                    <span>{f.name}</span>
                  </div>
                  <span className="text-[10px] text-[#64748b]">{f.count}</span>
                </label>
              ))}
            </div>

            <button
              onClick={() => setMobileFilterOpen(false)}
              className="w-full bg-indigo-600 font-bold text-xs py-3 rounded-xl text-white cursor-pointer"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* MODALS */}
      {openCoverLetter && selectedJobHash && detailData && (
        <CoverLetterModal
          jobHash={selectedJobHash}
          companyName={detailData.job.company}
          jobTitle={detailData.job.title}
          onClose={() => setOpenCoverLetter(false)}
        />
      )}

      {openTailor && selectedJobHash && detailData && (
        <ResumeTailoringModal
          jobHash={selectedJobHash}
          companyName={detailData.job.company}
          jobTitle={detailData.job.title}
          onClose={() => setOpenTailor(false)}
        />
      )}

      {openPrep && selectedJobHash && detailData && (
        <InterviewPrepPanel
          jobHash={selectedJobHash}
          companyName={detailData.job.company}
          jobTitle={detailData.job.title}
          onClose={() => setOpenPrep(false)}
        />
      )}

    </div>
  );
};

// Contact Recommendations Subcomponent
const ContactRecommendations: React.FC<{ jobData: any }> = ({ jobData }) => {
  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['contact-recommendations', jobData?.job?.company, jobData?.job?.title],
    queryFn: async () => {
      if (!jobData?.job?.company || !jobData?.job?.title) return [];
      const token = localStorage.getItem('token');
      const res = await fetch('/api/linkedin/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          company: jobData.job.company,
          jobTitle: jobData.job.title,
          jobDescription: jobData.job.description
        })
      });
      if (!res.ok) throw new Error('Failed to fetch recommendations');
      return res.json();
    },
    enabled: !!jobData?.job?.company && !!jobData?.job?.title
  });

  if (!jobData?.job?.company) return null;

  return (
    <div className="space-y-3 border-t border-[#243147] pt-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Recommended Network Contacts</span>
      </div>

      {isLoading ? (
        <div className="text-xs text-[#64748b]">Loading recommendations...</div>
      ) : !recommendations || recommendations.length === 0 ? (
        <div className="text-xs text-[#64748b] p-3 bg-[#090d16] rounded-xl border border-[#243147]">
          No contacts found for {jobData.job.company}.
        </div>
      ) : (
        <div className="space-y-2">
          {recommendations.slice(0, 3).map((rec: any) => (
            <div key={rec.contact.id} className="p-3 bg-[#090d16] rounded-xl border border-[#243147]">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h4 className="text-xs font-bold text-white">{rec.contact.name}</h4>
                  <p className="text-[11px] text-[#64748b]">{rec.contact.currentRole}</p>
                </div>
                <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full">
                  {rec.score}% Match
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobExplorer;
