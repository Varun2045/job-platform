import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, Briefcase, Globe, ExternalLink, X, Sparkles, 
  FileText, Bookmark, Filter, ChevronLeft, ChevronRight,
  MapPin, DollarSign, Clock, Plus, Check, BookOpen,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { CardSkeleton } from '../../components/Skeleton.js';
import { CoverLetterModal } from './CoverLetterModal.js';
import { ResumeTailoringModal } from './ResumeTailoringModal.js';
import { InterviewPrepPanel } from './InterviewPrepPanel.js';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.js';
import { useToast } from '../../context/ToastContext.js';

const expandLocationAliases = (locs: string[]) => {
  const result: string[] = [];
  locs.forEach(loc => {
    result.push(loc);
    if (loc === 'Bangalore') result.push('Bengaluru');
    if (loc === 'Gurgaon') result.push('Gurugram');
    if (loc === 'Mumbai') result.push('Bombay');
    if (loc === 'Kolkata') result.push('Calcutta');
    if (loc === 'Thiruvananthapuram') result.push('Trivandrum');
    if (loc === 'Vadodara') result.push('Baroda');
  });
  return Array.from(new Set(result));
};

const HighlightText: React.FC<{ text?: string; highlight?: string; className?: string }> = ({ text, highlight, className = '' }) => {
  if (!text) return null;
  if (!highlight || !highlight.trim()) return <span className={className}>{text}</span>;

  const tokens = highlight.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return <span className={className}>{text}</span>;

  const escapedTokens = tokens.map(t => t.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${escapedTokens})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        tokens.some(t => part.toLowerCase() === t) ? (
          <mark key={i} className="bg-indigo-500/30 text-indigo-300 rounded px-0.5 font-bold">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

export const JobExplorer: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Saved Filters Helper for Persistence
  const getSavedFilter = (key: string, defaultValue: any) => {
    try {
      const saved = localStorage.getItem('job_explorer_filters_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed[key] !== undefined) return parsed[key];
      }
    } catch {}
    return defaultValue;
  };

  // Primary State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('q') || '');
  const [selectedJobHash, setSelectedJobHash] = useState<string | null>(null);

  // Faceted Filters State with Persistence
  const [location, setLocation] = useState<string[]>(
    searchParams.get('location') ? searchParams.get('location')!.split(',') : getSavedFilter('location', [])
  );
  const [remote, setRemote] = useState<string[]>(
    searchParams.get('remote') ? searchParams.get('remote')!.split(',') : getSavedFilter('remote', [])
  );
  const [experience, setExperience] = useState<string[]>(
    searchParams.get('experience') ? searchParams.get('experience')!.split(',') : getSavedFilter('experience', [])
  );
  const [department, setDepartment] = useState<string[]>(
    searchParams.get('department') ? searchParams.get('department')!.split(',') : getSavedFilter('department', [])
  );
  const [company, setCompany] = useState<string[]>(
    searchParams.get('company') ? searchParams.get('company')!.split(',') : getSavedFilter('company', [])
  );
  const [employmentType, setEmploymentType] = useState<string[]>(
    searchParams.get('employmentType') ? searchParams.get('employmentType')!.split(',') : getSavedFilter('employmentType', [])
  );
  const [dateRange, setDateRange] = useState<string>(
    searchParams.get('dateRange') || getSavedFilter('dateRange', '')
  );
  const [sortBy, setSortBy] = useState<'newest' | 'relevance' | 'company_name' | 'experience_asc'>(
    (searchParams.get('sort') as any) || getSavedFilter('sortBy', 'newest')
  );

  // Page-based Pagination State
  const [page, setPage] = useState<number>(Number(searchParams.get('page')) || 1);
  const jobFeedTopRef = useRef<HTMLDivElement>(null);

  const [bookmarkedJobs, setBookmarkedJobs] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('bookmarked_jobs');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [hiddenJobs] = useState<Set<string>>(new Set());

  // UI Drawer & Modal state
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [openCoverLetter, setOpenCoverLetter] = useState(false);
  const [openTailor, setOpenTailor] = useState(false);
  const [openPrep, setOpenPrep] = useState(false);
  const [trackNotes, setTrackNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'matching' | 'toolkit'>('details');

  // Department Sub-Category Collapsible States
  const [openDeptCategories, setOpenDeptCategories] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('job_explorer_open_dept_cats_v1');
      return saved ? JSON.parse(saved) : {
        'Engineering': true,
        'AI & Data': true,
        'Analytics': true,
        'Product': false,
        'Design': false,
        'Business': false
      };
    } catch {
      return {
        'Engineering': true,
        'AI & Data': true,
        'Analytics': true,
        'Product': false,
        'Design': false,
        'Business': false
      };
    }
  });

  const [expandedDeptCategories, setExpandedDeptCategories] = useState<Record<string, boolean>>({});

  const toggleDeptCategoryOpen = (catName: string) => {
    setOpenDeptCategories(prev => {
      const isCurrentlyOpen = prev[catName];
      const next: Record<string, boolean> = { [catName]: !isCurrentlyOpen };
      try {
        localStorage.setItem('job_explorer_open_dept_cats_v1', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const toggleDeptCategoryExpand = (catName: string) => {
    setExpandedDeptCategories(prev => ({ ...prev, [catName]: !prev[catName] }));
  };

  // Accordion Sections for Faceted Filters (Single-Expanded Accordion)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    department: true,
    experience: false,
    employment: false,
    remote: false,
    location: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => {
      const next: Record<string, boolean> = {};
      Object.keys(prev).forEach(key => {
        next[key] = key === section ? !prev[section] : false;
      });
      return next;
    });
  };

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

  // 500ms Debounce search input for improved performance
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const calculateDateLimit = (range: string): string => {
    if (!range) return '';
    const dateLimit = new Date();
    if (range === '1d') {
      dateLimit.setHours(0, 0, 0, 0);
    } else {
      const days = range === '3d' ? 3 : range === '7d' ? 7 : range === '30d' ? 30 : 365;
      dateLimit.setDate(dateLimit.getDate() - days);
      dateLimit.setHours(0, 0, 0, 0);
    }
    return dateLimit.toISOString();
  };

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [
    debouncedQuery,
    location,
    remote,
    experience,
    department,
    company,
    employmentType,
    dateRange,
    sortBy,
  ]);

  // Sync state to URL parameters
  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedQuery) params.q = debouncedQuery;
    if (location.length > 0) params.location = location.join(',');
    if (remote.length > 0) params.remote = remote.join(',');
    if (experience.length > 0) params.experience = experience.join(',');
    if (department.length > 0) params.department = department.join(',');
    if (company.length > 0) params.company = company.join(',');
    if (employmentType.length > 0) params.employmentType = employmentType.join(',');
    if (dateRange) {
      params.dateRange = dateRange;
      params.dateLimit = calculateDateLimit(dateRange);
    }
    if (sortBy !== 'newest') params.sort = sortBy;
    if (page > 1) params.page = String(page);

    setSearchParams(params, { replace: true });
  }, [
    debouncedQuery,
    location,
    remote,
    experience,
    department,
    company,
    employmentType,
    dateRange,
    sortBy,
    page,
  ]);

  // Combined Query for Facets and Jobs
  const { data: combinedData, isLoading: isCombinedLoading, isFetching } = useQuery({
    queryKey: [
      'jobs-combined',
      debouncedQuery,
      location,
      remote,
      experience,
      department,
      company,
      employmentType,
      dateRange,
      sortBy,
      page,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: debouncedQuery,
        location: expandLocationAliases(location).join(','),
        remote: remote.join(','),
        experience: experience.join(','),
        department: department.join(','),
        company: company.join(','),
        employmentType: employmentType.join(','),
        dateRange,
        dateLimit: calculateDateLimit(dateRange),
        sort: sortBy,
        pageSize: '30',
        page: String(page),
      });
      const res = await fetch(`/api/v1/jobs/combined?${params}`);
      if (!res.ok) throw new Error('Failed to fetch combined jobs data');
      return res.json();
    }
  });

  // Extract data from combined response
  const rawJobs = combinedData?.jobs || [];
  const normalizedJobs = useMemo(() => {
    return rawJobs.map((item: any) => {
      if (item && item.job) {
        return item;
      }
      return {
        job: item,
        score: item?.matchScore ?? 0,
      };
    });
  }, [rawJobs]);

  const facetsData = combinedData?.facets;
  const apiResponse = combinedData ? { 
    jobs: normalizedJobs, 
    pagination: combinedData.pagination,
    execution: combinedData.execution 
  } : null;
  const isFacetsLoading = isCombinedLoading;
  const isJobsLoading = isCombinedLoading;

  // Fetch Selected Job Detail
  const { data: detailData } = useQuery({
    queryKey: ['job-details', selectedJobHash],
    queryFn: async () => {
      if (!selectedJobHash) return null;
      const res = await fetch(`/api/jobs/${selectedJobHash}`);
      if (!res.ok) throw new Error('Failed to load job details');
      return res.json();
    },
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
      showToast('✓ Application status tracked successfully.', 'success');
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

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setLocation([]);
    setRemote([]);
    setExperience([]);
    setDepartment([]);
    setCompany([]);
    setEmploymentType([]);
    setDateRange('');
    setSortBy('newest');
    setSearchParams({});
    try {
      localStorage.removeItem('job_explorer_filters_v2');
    } catch {}
  };

  // Persist filter selections to local storage
  useEffect(() => {
    try {
      const stored = {
        location,
        remote,
        experience,
        department,
        company,
        employmentType,
        dateRange,
        sortBy
      };
      localStorage.setItem('job_explorer_filters_v2', JSON.stringify(stored));
    } catch {}
  }, [location, remote, experience, department, company, employmentType, dateRange, sortBy]);

  // Toggle array filter helper
  const toggleArrayFilter = (arr: string[], val: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (arr.includes(val)) {
      setter(arr.filter(v => v !== val));
    } else {
      setter([...arr, val]);
    }
  };

  const renderSidebarContents = () => {
    const facets = facetsData?.facets || {};

    const deptGroups: Record<string, string[]> = {
      'Engineering': [
        'Software Engineering',
        'Backend Engineering',
        'Frontend Engineering',
        'Full Stack Engineering',
        'Mobile Development',
        'Cloud Engineering',
        'DevOps / SRE',
        'QA Automation',
        'Cybersecurity',
        'Embedded Systems',
        'Hardware Engineering'
      ],
      'AI & Data': [
        'AI / Machine Learning',
        'Data Science',
        'Data Engineering'
      ],
      'Analytics': [
        'Data Analyst',
        'Business Analyst',
        'Product Analyst',
        'Financial Analyst',
        'Security Analyst',
        'Research Analyst',
        'BI / Reporting Analyst'
      ],
      'Product': [
        'Product Management',
        'Program Management',
        'Project Management'
      ],
      'Design': [
        'UI / UX',
        'Graphic Design'
      ],
      'Business': [
        'Sales',
        'Marketing',
        'Finance',
        'HR',
        'Legal',
        'Operations',
        'Customer Success',
        'Developer Relations',
        'Solutions Engineering'
      ]
    };

    const getDeptCount = (deptName: string) => {
      const match = (facets.departments || []).find((f: any) => f.label.toLowerCase() === deptName.toLowerCase());
      return match ? match.count : 0;
    };

    const quickLocations = [
      'India',
      'Bangalore',
      'Hyderabad',
      'Pune',
      'Chennai',
      'Gurgaon',
      'Noida',
      'Mumbai',
    ];

    const getLocCount = (locOption: string) => {
      const aliases = expandLocationAliases([locOption]);
      let total = 0;
      (facets.locations || []).forEach((f: any) => {
        if (aliases.some(a => f.label.toLowerCase().includes(a.toLowerCase()))) {
          total += f.count;
        }
      });
      return total;
    };

    const getExperienceCount = (expOpt: string) => {
      let total = 0;
      (facets.experienceLevels || []).forEach((f: any) => {
        const lbl = f.label.toLowerCase();
        if (expOpt === 'Freshers' && (lbl.includes('fresher') || lbl.includes('intern') || lbl.includes('entry') || lbl.includes('0'))) total += f.count;
        else if (expOpt === '0–2 Years' && (lbl.includes('0') || lbl.includes('1') || lbl.includes('2') || lbl.includes('entry') || lbl.includes('associate'))) total += f.count;
        else if (expOpt === '2–5 Years' && (lbl.includes('2') || lbl.includes('3') || lbl.includes('4') || lbl.includes('5') || lbl.includes('mid'))) total += f.count;
        else if (expOpt === '5+ Years' && (lbl.includes('5') || lbl.includes('6') || lbl.includes('7') || lbl.includes('8') || lbl.includes('senior') || lbl.includes('lead') || lbl.includes('principal') || lbl.includes('manager') || lbl.includes('director'))) total += f.count;
      });
      return total;
    };

    const primaryEmpTypes = ['Full-time', 'Internship', 'Graduate Program', 'Part-time', 'Contract'];

    const getEmpCount = (empLabel: string) => {
      const match = (facets.employmentTypes || []).find((f: any) => f.label.toLowerCase() === empLabel.toLowerCase());
      return match ? match.count : 0;
    };

    return (
      <div className="space-y-4">
        {/* DEPARTMENT SECTION */}
        <div className="border-b border-[#232d3f] pb-3">
          <button
            onClick={() => toggleSection('department')}
            className="w-full flex items-center justify-between py-2 text-left cursor-pointer group"
          >
            <span className="text-xs font-bold text-slate-300 group-hover:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-500" /> Department {department.length > 0 && <span className="bg-indigo-500/20 text-indigo-400 px-2 py-0.5 text-[10px] rounded-full font-bold">{department.length}</span>}
            </span>
            {openSections.department ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          
          {openSections.department && (
            <div className="space-y-2.5 mt-2 transition-all">
              {Object.entries(deptGroups).map(([groupName, deptList]) => {
                const isOpen = openDeptCategories[groupName] ?? false;
                const isExpanded = expandedDeptCategories[groupName] ?? false;
                const visibleDepts = isExpanded ? deptList : deptList.slice(0, 4);
                const totalCategoryJobs = deptList.reduce((acc, d) => acc + getDeptCount(d), 0);

                if (totalCategoryJobs === 0 && !department.some(d => deptList.includes(d))) return null;

                return (
                  <div key={groupName} className="bg-[#131a26]/70 border border-[#232d3f] rounded-xl p-2.5 space-y-2">
                    <button
                      onClick={() => toggleDeptCategoryOpen(groupName)}
                      className="w-full flex items-center justify-between text-left cursor-pointer group/cat px-1 py-0.5"
                    >
                      <span className="text-[11px] font-bold text-slate-400 group-hover/cat:text-white uppercase tracking-wider">
                        {groupName}
                      </span>
                      <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                        {totalCategoryJobs}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="space-y-1.5 pt-1 pl-1">
                        {visibleDepts.map((lvl) => {
                          const count = getDeptCount(lvl);
                          return (
                            <label key={lvl} className="flex items-center justify-between text-xs text-[#94a3b8] hover:text-white cursor-pointer py-1 px-2 rounded-lg hover:bg-[#1b2535] transition-all">
                              <div className="flex items-center gap-2 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={department.includes(lvl)}
                                  onChange={() => toggleArrayFilter(department, lvl, setDepartment)}
                                  className="rounded border-[#232d3f] bg-[#0b0f19] text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="truncate">{lvl}</span>
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 bg-[#0b0f19] px-2 py-0.5 rounded-full border border-[#232d3f]">
                                {count}
                              </span>
                            </label>
                          );
                        })}

                        {deptList.length > 4 && (
                          <button
                            onClick={() => toggleDeptCategoryExpand(groupName)}
                            className="w-full text-center text-[10px] font-bold text-indigo-400 hover:text-indigo-300 pt-1 cursor-pointer"
                          >
                            {isExpanded ? 'Show Less' : `Show More (${deptList.length - 4})`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* EXPERIENCE SECTION */}
        <div className="border-b border-[#232d3f] pb-3">
          <button
            onClick={() => toggleSection('experience')}
            className="w-full flex items-center justify-between py-2 text-left cursor-pointer group"
          >
            <span className="text-xs font-bold text-slate-300 group-hover:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" /> Experience {experience.length > 0 && <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] rounded-full font-bold">{experience.length}</span>}
            </span>
            {openSections.experience ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {openSections.experience && (
            <div className="space-y-1.5 mt-2 transition-all">
              {['Freshers', '0–2 Years', '2–5 Years', '5+ Years'].map((expOpt) => {
                const count = getExperienceCount(expOpt);
                return (
                  <label key={expOpt} className="flex items-center justify-between text-xs text-[#94a3b8] hover:text-white cursor-pointer py-1.5 px-2 rounded-lg hover:bg-[#1b2535] transition-all">
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={experience.includes(expOpt)}
                        onChange={() => toggleArrayFilter(experience, expOpt, setExperience)}
                        className="rounded border-[#232d3f] bg-[#0b0f19] text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="truncate">{expOpt}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-[#0b0f19] px-2 py-0.5 rounded-full border border-[#232d3f]">
                      {count}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* WORK MODE / REMOTE SECTION */}
        <div className="border-b border-[#232d3f] pb-3">
          <button
            onClick={() => toggleSection('remote')}
            className="w-full flex items-center justify-between py-2 text-left cursor-pointer group"
          >
            <span className="text-xs font-bold text-slate-300 group-hover:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-500" /> Work Mode {remote.length > 0 && <span className="bg-cyan-500/20 text-cyan-400 px-2 py-0.5 text-[10px] rounded-full font-bold">{remote.length}</span>}
            </span>
            {openSections.remote ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {openSections.remote && (
            <div className="space-y-1.5 mt-2 transition-all">
              {[
                { label: 'Remote Only', value: 'true' },
                { label: 'Hybrid', value: 'hybrid' },
                { label: 'On-site', value: 'false' },
              ].map((opt) => {
                return (
                  <label key={opt.value} className="flex items-center justify-between text-xs text-[#94a3b8] hover:text-white cursor-pointer py-1.5 px-2 rounded-lg hover:bg-[#1b2535] transition-all">
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={remote.includes(opt.value)}
                        onChange={() => toggleArrayFilter(remote, opt.value, setRemote)}
                        className="rounded border-[#232d3f] bg-[#0b0f19] text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="truncate">{opt.label}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* LOCATION SECTION */}
        <div className="border-b border-[#232d3f] pb-3">
          <button
            onClick={() => toggleSection('location')}
            className="w-full flex items-center justify-between py-2 text-left cursor-pointer group"
          >
            <span className="text-xs font-bold text-slate-300 group-hover:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500" /> Location {location.length > 0 && <span className="bg-rose-500/20 text-rose-400 px-2 py-0.5 text-[10px] rounded-full font-bold">{location.length}</span>}
            </span>
            {openSections.location ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {openSections.location && (
            <div className="space-y-1.5 mt-2 transition-all">
              {quickLocations.map((loc) => {
                const count = getLocCount(loc);
                return (
                  <label key={loc} className="flex items-center justify-between text-xs text-[#94a3b8] hover:text-white cursor-pointer py-1.5 px-2 rounded-lg hover:bg-[#1b2535] transition-all">
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={location.includes(loc)}
                        onChange={() => toggleArrayFilter(location, loc, setLocation)}
                        className="rounded border-[#232d3f] bg-[#0b0f19] text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="truncate">{loc}</span>
                    </div>
                    {count > 0 && (
                      <span className="text-[10px] font-bold text-slate-500 bg-[#0b0f19] px-2 py-0.5 rounded-full border border-[#232d3f]">
                        {count}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* EMPLOYMENT TYPE SECTION */}
        <div className="pb-2">
          <button
            onClick={() => toggleSection('employment')}
            className="w-full flex items-center justify-between py-2 text-left cursor-pointer group"
          >
            <span className="text-xs font-bold text-slate-300 group-hover:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-500" /> Employment Type {employmentType.length > 0 && <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 text-[10px] rounded-full font-bold">{employmentType.length}</span>}
            </span>
            {openSections.employment ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {openSections.employment && (
            <div className="space-y-1.5 mt-2 transition-all">
              {primaryEmpTypes.map((emp) => {
                const count = getEmpCount(emp);
                return (
                  <label key={emp} className="flex items-center justify-between text-xs text-[#94a3b8] hover:text-white cursor-pointer py-1.5 px-2 rounded-lg hover:bg-[#1b2535] transition-all">
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={employmentType.includes(emp)}
                        onChange={() => toggleArrayFilter(employmentType, emp, setEmploymentType)}
                        className="rounded border-[#232d3f] bg-[#0b0f19] text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="truncate">{emp}</span>
                    </div>
                    {count > 0 && (
                      <span className="text-[10px] font-bold text-slate-500 bg-[#0b0f19] px-2 py-0.5 rounded-full border border-[#232d3f]">
                        {count}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const pageJobs = useMemo(() => apiResponse?.jobs || [], [apiResponse]);

  const visibleJobs = useMemo(() => {
    return pageJobs.filter((j: any) => !hiddenJobs.has(j.job.jobHash) && isJobActive(j.job));
  }, [pageJobs, hiddenJobs]);

  const isJobActive = (jobItem: any) => {
    if (!jobItem) return false;
    const status = (jobItem.status || jobItem.activeStatus || '').toLowerCase();
    if (status === 'expired' || status === 'removed' || status === 'closed') {
      return false;
    }
    const rawUrl = jobItem.applyUrl || jobItem.jobUrl || jobItem.postingUrl || jobItem.applicationUrl || jobItem.url;
    if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim() || rawUrl === '#' || rawUrl === 'N/A') {
      return false;
    }
    return true;
  };

  const totalCount = apiResponse?.pagination?.totalResults || apiResponse?.execution?.totalResults || visibleJobs.length;
  const totalPages = apiResponse?.pagination?.totalPages || Math.ceil(totalCount / 30) || 1;
  const currentPage = apiResponse?.pagination?.page || page;
  const hasNextPage = apiResponse?.pagination?.hasMore || currentPage < totalPages;
  const hasPrevPage = apiResponse?.pagination?.hasPrev || currentPage > 1;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen text-white font-sans bg-[#090d16]">
      
      {/* Page Header */}
      <PageHeader
        themeKey="explorer"
        title="Job Explorer"
        description="Browse verified opportunities, filter results, and manage your job search efficiently."
        icon={Search}
      />

      {/* Modern Search & Options Panel */}
      <div className="bg-[#131a26]/80 backdrop-blur-md border border-[#232d3f] rounded-2xl p-4 md:p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-indigo-400 pointer-events-none transition-colors" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search "Java", "React", "AI", "Remote" or company names... (Press "/" to focus)'
              className="w-full bg-[#0b0f19] border border-[#232d3f] hover:border-indigo-500/50 rounded-xl py-3 pl-12 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setDebouncedQuery(''); }}
                className="absolute right-4 top-3.5 text-slate-500 hover:text-white p-1 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center justify-center gap-2 bg-[#0b0f19] border border-[#232d3f] px-5 py-3 rounded-xl text-xs font-bold text-white hover:bg-[#1b2535] transition-colors"
            >
              <Filter className="w-4 h-4 text-indigo-400" /> Filters
            </button>

            <div className="flex items-center gap-2 bg-[#0b0f19] border border-[#232d3f] px-3.5 py-1.5 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Sort</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer pr-1"
              >
                <option value="newest">Newest</option>
                <option value="relevance">Relevance</option>
                <option value="company_name">Company Name</option>
                <option value="experience_asc">Experience</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filters Bar */}
        {(debouncedQuery || location.length > 0 || remote.length > 0 || experience.length > 0 || department.length > 0 || company.length > 0 || employmentType.length > 0 || dateRange) && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#232d3f]/60">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mr-1">Active:</span>

            {debouncedQuery && (
              <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                Query: "{debouncedQuery}" <button onClick={() => { setSearchQuery(''); setDebouncedQuery(''); }}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
              </span>
            )}

            {location.map(loc => (
              <span key={loc} className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                {loc} <button onClick={() => toggleArrayFilter(location, loc, setLocation)}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
              </span>
            ))}

            {remote.map(rem => (
              <span key={rem} className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                {rem === 'true' ? 'Remote Only' : rem === 'hybrid' ? 'Hybrid' : 'On-site'} <button onClick={() => toggleArrayFilter(remote, rem, setRemote)}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
              </span>
            ))}

            {experience.map(exp => (
              <span key={exp} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                {exp} <button onClick={() => toggleArrayFilter(experience, exp, setExperience)}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
              </span>
            ))}

            {department.map(dept => (
              <span key={dept} className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                {dept} <button onClick={() => toggleArrayFilter(department, dept, setDepartment)}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
              </span>
            ))}

            {employmentType.map(emp => (
              <span key={emp} className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                {emp} <button onClick={() => toggleArrayFilter(employmentType, emp, setEmploymentType)}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
              </span>
            ))}

            <button
              onClick={clearAllFilters}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 underline ml-auto cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Faceted Filters Sidebar - Left */}
        <div className="hidden lg:block lg:col-span-3 bg-[#131a26]/80 backdrop-blur-md border border-[#232d3f] rounded-2xl p-5 sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto custom-scrollbar shadow-lg">
          <div className="flex items-center justify-between border-b border-[#232d3f] pb-3 mb-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-400" /> Filter Options
            </h3>
            <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold px-2 py-0.5 rounded-full">
              {totalCount} jobs
            </span>
          </div>

          {isFacetsLoading ? (
            <div className="space-y-4 py-4">
              <div className="h-6 bg-[#1b2535] rounded animate-pulse" />
              <div className="h-10 bg-[#1b2535] rounded animate-pulse" />
              <div className="h-6 bg-[#1b2535] rounded animate-pulse" />
            </div>
          ) : (
            renderSidebarContents()
          )}
        </div>

        {/* Central Job Feed */}
        <div ref={jobFeedTopRef} className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between bg-[#131a26] border border-[#232d3f] rounded-2xl px-5 py-4 shadow-sm">
            <span className="text-xs font-bold text-[#94a3b8]">
              Showing <span className="text-white font-extrabold">{visibleJobs.length}</span> of <span className="text-indigo-400 font-extrabold">{totalCount}</span> Opportunities
            </span>
          </div>

          {isJobsLoading && visibleJobs.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
            </div>
          ) : visibleJobs.length === 0 ? (
            <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-8 text-center space-y-4 shadow-md">
              <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">No jobs matched your current filters</h3>
                <p className="text-xs text-slate-400">Try expanding your locations, choosing multiple experience tiers, or clearing active filters.</p>
              </div>
              <div className="pt-2">
                <button
                  onClick={clearAllFilters}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition duration-200 cursor-pointer shadow-md"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleJobs.map(({ job }: any) => {
                const isSelected = selectedJobHash === job.jobHash;
                const isBookmarked = bookmarkedJobs.has(job.jobHash);
                const postedDateStr = (() => {
                  const val = job.datePosted || job.firstSeen || job.created_at;
                  if (!val) return 'Recently';
                  if (typeof val === 'string' && (val.includes('ago') || val.includes('Today') || val.includes('Just now'))) return val;
                  const d = new Date(val);
                  return isNaN(d.getTime()) ? 'Recently' : d.toLocaleDateString();
                })();

                const isEntryLevel = ['fresher', 'intern', 'associate', '0-2'].some(kw => 
                  (job.experienceLevel || job.experience || '').toLowerCase().includes(kw)
                );

                return (
                  <div
                    key={job.jobHash}
                    onClick={() => setSelectedJobHash(job.jobHash)}
                    className={`bg-[#131a26]/70 border rounded-xl p-4 transition-all duration-200 cursor-pointer space-y-3.5 relative overflow-hidden ${
                      isSelected 
                        ? 'border-indigo-500 ring-1 ring-indigo-500/20 bg-[#1b2535]' 
                        : 'border-[#232d3f] hover:border-slate-500/40 hover:bg-[#182130]'
                    }`}
                  >
                    {isEntryLevel && (
                      <div className="absolute top-0 right-0 bg-emerald-500/10 border-l border-b border-emerald-500/20 px-2 py-0.5 rounded-bl-lg text-[9px] font-bold text-emerald-400 uppercase">
                        Entry Level
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                        <HighlightText text={job.company} highlight={debouncedQuery} />
                      </div>
                      <h4 className="text-sm font-bold text-white leading-snug">
                        <HighlightText text={job.title} highlight={debouncedQuery} />
                      </h4>
                      
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        <span className="bg-[#0b0f19] text-[#94a3b8] px-2 py-0.5 rounded text-[10px] font-medium border border-[#232d3f]">
                          {job.location || 'India'}
                        </span>
                        <span className="bg-[#0b0f19] text-[#94a3b8] px-2 py-0.5 rounded text-[10px] font-medium border border-[#232d3f]">
                          {job.experienceLevel || job.experience || 'Fresher'}
                        </span>
                        <span className="bg-indigo-500/5 text-indigo-300 px-2 py-0.5 rounded text-[10px] font-semibold border border-indigo-500/10 ml-auto">
                          {postedDateStr}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[#232d3f]/40">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedJobHash(job.jobHash);
                        }}
                        className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-[#0b0f19] hover:bg-[#1b2535] text-slate-400 hover:text-white border border-[#232d3f]'
                        }`}
                      >
                        View Info
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(job.jobHash, e);
                        }}
                        className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                          isBookmarked
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                            : 'bg-[#0b0f19] hover:bg-[#1b2535] border-[#232d3f] text-slate-400'
                        }`}
                        title={isBookmarked ? 'Bookmarked' : 'Bookmark Job'}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>

                      <a
                        href={job.applyUrl || job.jobUrl || job.postingUrl || job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="py-1.5 px-3 rounded-lg text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-sm flex items-center gap-1"
                      >
                        Apply <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 mt-4">
                  <button
                    disabled={!hasPrevPage || isFetching}
                    onClick={() => {
                      setPage(prev => Math.max(1, prev - 1));
                      jobFeedTopRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-center gap-1 bg-[#131a26] hover:bg-[#1b2535] disabled:opacity-40 disabled:cursor-not-allowed border border-[#232d3f] text-white text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>

                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                      const pNum = idx + 1;
                      return (
                        <button
                          key={pNum}
                          disabled={isFetching}
                          onClick={() => {
                            setPage(pNum);
                            jobFeedTopRef.current?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`w-8 h-8 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                            pNum === currentPage
                              ? 'bg-indigo-600 text-white'
                              : 'bg-[#131a26] hover:bg-[#1b2535] border border-[#232d3f] text-slate-400 hover:text-white'
                          }`}
                        >
                          {pNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    disabled={!hasNextPage || isFetching}
                    onClick={() => {
                      setPage(prev => Math.min(totalPages, prev + 1));
                      jobFeedTopRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-center gap-1 bg-[#131a26] hover:bg-[#1b2535] disabled:opacity-40 disabled:cursor-not-allowed border border-[#232d3f] text-white text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detailed Job Information Deck - Right */}
        <div className="hidden lg:block lg:col-span-4 bg-[#131a26]/80 backdrop-blur-md border border-[#232d3f] rounded-2xl p-6 sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto custom-scrollbar space-y-6 shadow-lg">
          {(() => {
            const selectedJobItem = visibleJobs.find((j: any) => j.job.jobHash === selectedJobHash)?.job || detailData?.job;
            const isBookmarked = selectedJobHash ? bookmarkedJobs.has(selectedJobHash) : false;

            if (!selectedJobItem) {
              return (
                <div className="text-center py-16 text-xs text-slate-500 font-medium space-y-3">
                  <div className="w-12 h-12 rounded-full border border-dashed border-[#232d3f] flex items-center justify-center mx-auto text-[#232d3f]">
                    <Briefcase className="w-5 h-5 text-slate-600" />
                  </div>
                  <p>Select any job card on the feed to view comprehensive descriptions, skill match analysis, and application tools.</p>
                </div>
              );
            }

            const rawApplyUrl = selectedJobItem.applyUrl || selectedJobItem.jobUrl || selectedJobItem.postingUrl || selectedJobItem.url;
            const salaryText = selectedJobItem.salary || selectedJobItem.salaryRange || 'Not Specified';
            const workModeText = selectedJobItem.isRemote === true || String(selectedJobItem.isRemote).toLowerCase() === 'remote' ? 'Remote' : 'Onsite';
            const postedDateText = (() => {
              const val = selectedJobItem.datePosted || selectedJobItem.firstSeen || selectedJobItem.created_at;
              if (!val) return 'Recently';
              if (typeof val === 'string' && (val.includes('ago') || val.includes('Today') || val.includes('Just now'))) return val;
              const d = new Date(val);
              return isNaN(d.getTime()) ? 'Recently' : d.toLocaleDateString();
            })();

            return (
              <div className="space-y-5">
                {/* Header Information */}
                <div>
                  <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{selectedJobItem.company}</div>
                  <h3 className="text-lg font-black text-white mt-1 leading-snug">{selectedJobItem.title}</h3>
                  <div className="flex items-center gap-2 mt-2.5">
                    <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/20">
                      {workModeText}
                    </span>
                    <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded text-[10px] font-bold border border-indigo-500/20">
                      {selectedJobItem.experienceLevel || selectedJobItem.experience || 'Fresher'}
                    </span>
                  </div>
                </div>

                {/* Tabs for Details, Skills Matching, AI Toolkit */}
                <div className="flex border-b border-[#232d3f] text-xs">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`flex-1 pb-2 font-bold border-b-2 text-center transition-colors cursor-pointer ${
                      activeTab === 'details' 
                        ? 'border-indigo-500 text-white' 
                        : 'border-transparent text-slate-500 hover:text-white'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('matching')}
                    className={`flex-1 pb-2 font-bold border-b-2 text-center transition-colors cursor-pointer ${
                      activeTab === 'matching' 
                        ? 'border-indigo-500 text-white' 
                        : 'border-transparent text-slate-500 hover:text-white'
                    }`}
                  >
                    Required Skills
                  </button>
                  <button
                    onClick={() => setActiveTab('toolkit')}
                    className={`flex-1 pb-2 font-bold border-b-2 text-center transition-colors cursor-pointer ${
                      activeTab === 'toolkit' 
                        ? 'border-indigo-500 text-white' 
                        : 'border-transparent text-slate-500 hover:text-white'
                    }`}
                  >
                    AI Toolkit
                  </button>
                </div>

                {/* Tab Contents */}
                {activeTab === 'details' && (
                  <div className="space-y-4">
                    <div className="bg-[#0b0f19] border border-[#232d3f] rounded-xl p-4 space-y-3.5 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-[#232d3f]/60">
                        <span className="text-slate-500">Location</span>
                        <span className="font-bold text-white">{selectedJobItem.location || 'India'}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-[#232d3f]/60">
                        <span className="text-slate-500">Compensation</span>
                        <span className="font-bold text-amber-400">{salaryText}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-[#232d3f]/60">
                        <span className="text-slate-500">Posted On</span>
                        <span className="font-bold text-white">{postedDateText}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-500">Job Hash</span>
                        <span className="font-mono text-[10px] text-slate-400">{selectedJobItem.jobHash.slice(0, 12)}...</span>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Actions</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => toggleBookmark(selectedJobItem.jobHash)}
                          className={`flex items-center justify-center gap-1.5 p-2.5 border rounded-xl font-bold text-xs transition duration-200 cursor-pointer ${
                            isBookmarked 
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                              : 'bg-[#0b0f19] hover:bg-[#1b2535] border-[#232d3f] text-white'
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          {isBookmarked ? 'Saved' : 'Save'}
                        </button>
                        <a
                          href={rawApplyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition duration-200 cursor-pointer text-center"
                        >
                          Apply now <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'matching' && (
                  <div className="space-y-4">
                    <div className="bg-[#0b0f19] border border-[#232d3f] rounded-xl p-4 space-y-4">
                      <div>
                        <h4 className="text-xs font-extrabold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Key Skills Required
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedJobItem.requiredSkills && selectedJobItem.requiredSkills.length > 0 ? (
                            selectedJobItem.requiredSkills.map((sk: string) => (
                              <span key={sk} className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/20">
                                {sk}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500">Analyze job description for skills...</span>
                          )}
                        </div>
                      </div>

                      {selectedJobItem.preferredSkills && selectedJobItem.preferredSkills.length > 0 && (
                        <div>
                          <h4 className="text-xs font-extrabold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5 text-indigo-400" /> Preferred / Nice to have
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedJobItem.preferredSkills.map((sk: string) => (
                              <span key={sk} className="bg-indigo-500/10 text-indigo-400 text-[10px] px-2 py-0.5 rounded border border-indigo-500/20">
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'toolkit' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-2.5">
                      <button
                        onClick={() => setOpenCoverLetter(true)}
                        className="flex items-center gap-3 p-3 bg-[#0b0f19] border border-[#232d3f] hover:border-indigo-500/50 hover:bg-[#1b2535] rounded-xl text-left transition duration-200 cursor-pointer"
                      >
                        <FileText className="w-5 h-5 text-indigo-400" />
                        <div>
                          <div className="text-xs font-bold text-white">Cover Letter Builder</div>
                          <div className="text-[10px] text-slate-500">Draft a tailored letter for this role.</div>
                        </div>
                      </button>

                      <button
                        onClick={() => setOpenTailor(true)}
                        className="flex items-center gap-3 p-3 bg-[#0b0f19] border border-[#232d3f] hover:border-indigo-500/50 hover:bg-[#1b2535] rounded-xl text-left transition duration-200 cursor-pointer"
                      >
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                        <div>
                          <div className="text-xs font-bold text-white">Tailor Resume</div>
                          <div className="text-[10px] text-slate-500">Match resume bullets to job requirements.</div>
                        </div>
                      </button>

                      <button
                        onClick={() => setOpenPrep(true)}
                        className="flex items-center gap-3 p-3 bg-[#0b0f19] border border-[#232d3f] hover:border-indigo-500/50 hover:bg-[#1b2535] rounded-xl text-left transition duration-200 cursor-pointer"
                      >
                        <BookOpen className="w-5 h-5 text-purple-400" />
                        <div>
                          <div className="text-xs font-bold text-white">Interview Cheat Sheet</div>
                          <div className="text-[10px] text-slate-500">Key questions and tech topics guide.</div>
                        </div>
                      </button>
                    </div>

                    <div className="border-t border-[#232d3f] pt-4 space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Application Tracker</h4>
                      
                      <div className="flex items-center gap-2">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              trackMutation.mutate(e.target.value);
                            }
                          }}
                          className="bg-[#0b0f19] border border-[#232d3f] text-xs rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500 cursor-pointer flex-1"
                        >
                          <option value="">Move to stage...</option>
                          <option value="Applied">Applied</option>
                          <option value="Interviewing">Interviewing</option>
                          <option value="Offer">Offer</option>
                          <option value="Rejected">Archived</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

      </div>

      {/* Mobile Slide-Over Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/70 backdrop-blur-sm lg:hidden">
          <div className="ml-auto w-4/5 max-w-xs bg-[#131a26] border-l border-[#232d3f] p-5 h-full overflow-y-auto space-y-6">
            <div className="flex justify-between items-center border-b border-[#232d3f] pb-3 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Filters</h3>
              <button onClick={() => setMobileFilterOpen(false)}><X className="w-5 h-5 text-white cursor-pointer" /></button>
            </div>

            {isFacetsLoading ? (
              <div className="space-y-4 py-4 animate-pulse">
                <div className="h-6 bg-[#1b2535] rounded" />
                <div className="h-10 bg-[#1b2535] rounded" />
              </div>
            ) : (
              renderSidebarContents()
            )}

            <button
              onClick={() => setMobileFilterOpen(false)}
              className="w-full bg-indigo-600 font-bold text-xs py-3 rounded-xl text-white cursor-pointer mt-4"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Modal Injections */}
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

export default JobExplorer;
