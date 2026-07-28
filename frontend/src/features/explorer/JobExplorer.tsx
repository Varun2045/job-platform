import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, Briefcase, Globe, ExternalLink, X, Sparkles, 
  FileText, CheckSquare, Bookmark, Filter, RefreshCw,
  ChevronDown, ChevronUp, ChevronRight
} from 'lucide-react';
import { CardSkeleton } from '../../components/Skeleton.js';
import { CoverLetterModal } from './CoverLetterModal.js';
import { ResumeTailoringModal } from './ResumeTailoringModal.js';
import { InterviewPrepPanel } from './InterviewPrepPanel.js';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.js';

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

export const JobExplorer: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Saved Filters Helper for Persistence (Requirement 10)
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

  // Infinite Scroll & Cursor Pagination state
  const [accumulatedJobs, setAccumulatedJobs] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('bookmarked_jobs');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [hiddenJobs] = useState<Set<string>>(new Set());
  const [showAllEmpTypes, setShowAllEmpTypes] = useState(false);

  // UI Drawer & Modal state
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [openCoverLetter, setOpenCoverLetter] = useState(false);
  const [openTailor, setOpenTailor] = useState(false);
  const [openPrep, setOpenPrep] = useState(false);
  const [trackNotes, setTrackNotes] = useState('');
  // Department Sub-Category Collapsible States (Requirement 6)
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
      const next = { ...prev, [catName]: !prev[catName] };
      try {
        localStorage.setItem('job_explorer_open_dept_cats_v1', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const toggleDeptCategoryExpand = (catName: string) => {
    setExpandedDeptCategories(prev => ({ ...prev, [catName]: !prev[catName] }));
  };

  // Accordion Sections for Faceted Filters
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    department: true,
    experience: true,
    employment: false,
    remote: false,
    tags: false,
    quality: false,
    location: false,
    skills: false,
    salary: false,
    minScore: false,
    recommendations: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
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

  // 200ms Debounce search input for snappy response
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const calculateDateLimit = (range: string): string => {
    if (!range) return '';
    const dateLimit = new Date();
    if (range === '1d') {
      dateLimit.setHours(0, 0, 0, 0); // Local Midnight today
    } else {
      const days = range === '3d' ? 3 : range === '7d' ? 7 : range === '30d' ? 30 : 365;
      dateLimit.setDate(dateLimit.getDate() - days);
      dateLimit.setHours(0, 0, 0, 0); // Local Midnight N days ago
    }
    return dateLimit.toISOString();
  };

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

    setSearchParams(params, { replace: true });
    setCursor(null);
    setAccumulatedJobs([]);
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

  // Query Facets Schema dynamically
  const { data: facetsData, isLoading: isFacetsLoading } = useQuery({
    queryKey: [
      'facets',
      debouncedQuery,
      location,
      remote,
      experience,
      department,
      company,
      employmentType,
      dateRange,
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
      });
      const res = await fetch(`/api/v1/jobs/facets?${params}`);
      if (!res.ok) throw new Error('Failed to fetch facets');
      return res.json();
    },
  });

  // Query Jobs API using dedicated Search Endpoint
  const { data: apiResponse, isLoading: isJobsLoading, isFetching } = useQuery({
    queryKey: [
      'jobs-search',
      debouncedQuery,
      location,
      remote,
      experience,
      department,
      company,
      employmentType,
      dateRange,
      sortBy,
      cursor,
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
        pageSize: '25',
        ...(cursor ? { cursor } : {})
      });
      const res = await fetch(`/api/v1/jobs/search?${params}`);
      if (!res.ok) throw new Error('Failed to search jobs feed');
      return res.json();
    }
  });

  // Accumulate jobs for smooth infinite scroll
  useEffect(() => {
    if (apiResponse && apiResponse.jobs) {
      if (!cursor) {
        setAccumulatedJobs(apiResponse.jobs);
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

  // Persist filter selections to local storage (Requirement 10)
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

    // Department grouping configurations
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
      'International',
      'Other Locations'
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
    const secondaryEmpTypes = ['Temporary', 'Freelance', 'Apprenticeship', 'Co-op', 'Consultant', 'Seasonal', 'Volunteer'];

    const getEmpCount = (empLabel: string) => {
      const match = (facets.employmentTypes || []).find((f: any) => f.label.toLowerCase() === empLabel.toLowerCase());
      return match ? match.count : 0;
    };

    return (
      <div className="space-y-4">
        {/* 1. DEPARTMENT */}
        <div>
          <button
            onClick={() => toggleSection('department')}
            className="w-full flex items-center justify-between py-0.5 text-left cursor-pointer group"
          >
            <span className="text-[11px] font-bold text-[#64748b] group-hover:text-white uppercase tracking-wider flex items-center gap-1.5">
              Department {department.length > 0 && <span className="bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 text-[9px] rounded-full font-bold">{department.length}</span>}
            </span>
            {openSections.department ? <ChevronUp className="w-3.5 h-3.5 text-[#64748b]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#64748b]" />}
          </button>
          
          {openSections.department && (
            <div className="space-y-2 mt-2 transition-all">
              {Object.entries(deptGroups).map(([groupName, deptList]) => {
                const isOpen = openDeptCategories[groupName] ?? false;
                const isExpanded = expandedDeptCategories[groupName] ?? false;

                // Filter out departments with 0 count unless selected
                const availableDepts = deptList.filter(lvl => {
                  const count = getDeptCount(lvl);
                  return count > 0 || department.includes(lvl);
                });

                if (availableDepts.length === 0) return null;

                const visibleDepts = isExpanded ? availableDepts : availableDepts.slice(0, 5);
                const totalCategoryJobs = availableDepts.reduce((acc, d) => acc + getDeptCount(d), 0);

                return (
                  <div key={groupName} className="bg-[#090d16]/60 border border-[#243147]/50 rounded-xl p-2 space-y-1.5">
                    <button
                      onClick={() => toggleDeptCategoryOpen(groupName)}
                      className="w-full flex items-center justify-between text-left cursor-pointer group/cat px-1 py-0.5"
                    >
                      <span className="text-[10px] font-extrabold text-[#94a3b8] group-hover/cat:text-white uppercase tracking-wider flex items-center gap-1.5">
                        {isOpen ? <ChevronDown className="w-3 h-3 text-indigo-400" /> : <ChevronRight className="w-3 h-3 text-[#64748b]" />}
                        {groupName}
                      </span>
                      {totalCategoryJobs > 0 && (
                        <span className="text-[9px] font-bold text-[#64748b] bg-[#111827] px-1.5 py-0.5 rounded-full border border-[#243147]/40">
                          {totalCategoryJobs}
                        </span>
                      )}
                    </button>

                    {isOpen && (
                      <div className="space-y-0.5 pt-1 pl-1.5 transition-all">
                        {visibleDepts.map((lvl) => {
                          const count = getDeptCount(lvl);
                          return (
                            <label key={lvl} className="flex items-center justify-between text-xs text-[#94a3b8] hover:text-white cursor-pointer py-1 px-1.5 rounded-lg hover:bg-[#192438] transition-all">
                              <div className="flex items-center gap-2 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={department.includes(lvl)}
                                  onChange={() => toggleArrayFilter(department, lvl, setDepartment)}
                                  className="rounded border-[#243147] bg-[#090d16] text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="truncate">{lvl}</span>
                              </div>
                              {count > 0 && (
                                <span className="text-[10px] font-bold text-[#64748b] bg-[#090d16] px-2 py-0.5 rounded-full border border-[#243147]/50">
                                  {count}
                                </span>
                              )}
                            </label>
                          );
                        })}

                        {availableDepts.length > 5 && (
                          <button
                            onClick={() => toggleDeptCategoryExpand(groupName)}
                            className="w-full text-center text-[10px] font-bold text-indigo-400 hover:text-indigo-300 pt-1 cursor-pointer"
                          >
                            {isExpanded ? 'Show Less' : `Show More (${availableDepts.length - 5})`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {(() => {
                const groupedDeptsSet = new Set(Object.values(deptGroups).flat());
                const leftovers = (facets.departments || []).filter((d: any) => !groupedDeptsSet.has(d.label) && d.count > 0);
                if (leftovers.length === 0) return null;

                const isOpen = openDeptCategories['Other Categories'] ?? false;
                const isExpanded = expandedDeptCategories['Other Categories'] ?? false;
                const visibleLeftovers = isExpanded ? leftovers : leftovers.slice(0, 5);

                return (
                  <div className="bg-[#090d16]/60 border border-[#243147]/50 rounded-xl p-2 space-y-1.5">
                    <button
                      onClick={() => toggleDeptCategoryOpen('Other Categories')}
                      className="w-full flex items-center justify-between text-left cursor-pointer group/cat px-1 py-0.5"
                    >
                      <span className="text-[10px] font-extrabold text-[#94a3b8] group-hover/cat:text-white uppercase tracking-wider flex items-center gap-1.5">
                        {isOpen ? <ChevronDown className="w-3 h-3 text-indigo-400" /> : <ChevronRight className="w-3 h-3 text-[#64748b]" />}
                        Other Categories
                      </span>
                      <span className="text-[9px] font-bold text-[#64748b] bg-[#111827] px-1.5 py-0.5 rounded-full border border-[#243147]/40">
                        {leftovers.reduce((acc: number, d: any) => acc + d.count, 0)}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="space-y-0.5 pt-1 pl-1.5 transition-all">
                        {visibleLeftovers.map((f: any) => (
                          <label key={f.label} className="flex items-center justify-between text-xs text-[#94a3b8] hover:text-white cursor-pointer py-1 px-1.5 rounded-lg hover:bg-[#192438] transition-all">
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={department.includes(f.label)}
                                onChange={() => toggleArrayFilter(department, f.label, setDepartment)}
                                className="rounded border-[#243147] bg-[#090d16] text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="truncate">{f.label}</span>
                            </div>
                            <span className="text-[10px] font-bold text-[#64748b] bg-[#090d16] px-2 py-0.5 rounded-full border border-[#243147]/50">
                              {f.count}
                            </span>
                          </label>
                        ))}

                        {leftovers.length > 5 && (
                          <button
                            onClick={() => toggleDeptCategoryExpand('Other Categories')}
                            className="w-full text-center text-[10px] font-bold text-indigo-400 hover:text-indigo-300 pt-1 cursor-pointer"
                          >
                            {isExpanded ? 'Show Less' : `Show More (${leftovers.length - 5})`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* 2. EXPERIENCE */}
        <div className="border-t border-[#243147]/40 pt-3">
          <button
            onClick={() => toggleSection('experience')}
            className="w-full flex items-center justify-between py-0.5 text-left cursor-pointer group"
          >
            <span className="text-[11px] font-bold text-[#64748b] group-hover:text-white uppercase tracking-wider flex items-center gap-1.5">
              Experience {experience.length > 0 && <span className="bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 text-[9px] rounded-full font-bold">{experience.length}</span>}
            </span>
            {openSections.experience ? <ChevronUp className="w-3.5 h-3.5 text-[#64748b]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#64748b]" />}
          </button>
          
          {openSections.experience && (
            <div className="space-y-0.5 mt-1.5 transition-all">
              {['Freshers', '0–2 Years', '2–5 Years', '5+ Years'].map((expOpt) => {
                const count = getExperienceCount(expOpt);
                return (
                  <label key={expOpt} className="flex items-center justify-between text-xs text-[#94a3b8] hover:text-white cursor-pointer py-1 px-1.5 rounded-lg hover:bg-[#192438] transition-all">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={experience.includes(expOpt)}
                        onChange={() => toggleArrayFilter(experience, expOpt, setExperience)}
                        className="rounded border-[#243147] bg-[#090d16] text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{expOpt}</span>
                    </div>
                    {count > 0 && (
                      <span className="text-[10px] font-bold text-[#64748b] bg-[#090d16] px-2 py-0.5 rounded-full border border-[#243147]/50">
                        {count}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. WORK MODE */}
        <div className="border-t border-[#243147]/40 pt-3">
          <button
            onClick={() => toggleSection('remote')}
            className="w-full flex items-center justify-between py-0.5 text-left cursor-pointer group"
          >
            <span className="text-[11px] font-bold text-[#64748b] group-hover:text-white uppercase tracking-wider flex items-center gap-1.5">
              Work Mode {remote.length > 0 && <span className="bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 text-[9px] rounded-full font-bold">{remote.length}</span>}
            </span>
            {openSections.remote ? <ChevronUp className="w-3.5 h-3.5 text-[#64748b]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#64748b]" />}
          </button>
          
          {openSections.remote && (
            <div className="space-y-0.5 mt-1.5 transition-all">
              {[
                { label: 'Remote', value: 'true' },
                { label: 'Hybrid', value: 'hybrid' },
                { label: 'On-site', value: 'false' },
                { label: 'Remote Worldwide', value: 'remote worldwide' },
                { label: 'Remote India', value: 'remote india' },
                { label: 'Remote US', value: 'remote us' }
              ].map(opt => (
                <label key={opt.value} className="flex items-center justify-between text-xs text-[#94a3b8] hover:text-white cursor-pointer py-1 px-1.5 rounded-lg hover:bg-[#192438] transition-all">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={remote.includes(opt.value)}
                      onChange={() => toggleArrayFilter(remote, opt.value, setRemote)}
                      className="rounded border-[#243147] bg-[#090d16] text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{opt.label}</span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 4. LOCATION */}
        <div className="border-t border-[#243147]/40 pt-3">
          <button
            onClick={() => toggleSection('location')}
            className="w-full flex items-center justify-between py-0.5 text-left cursor-pointer group"
          >
            <span className="text-[11px] font-bold text-[#64748b] group-hover:text-white uppercase tracking-wider flex items-center gap-1.5">
              Location {location.length > 0 && <span className="bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 text-[9px] rounded-full font-bold">{location.length}</span>}
            </span>
            {openSections.location ? <ChevronUp className="w-3.5 h-3.5 text-[#64748b]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#64748b]" />}
          </button>
          
          {openSections.location && (
            <div className="space-y-0.5 mt-1.5 transition-all">
              {quickLocations.map((locOpt) => {
                const count = getLocCount(locOpt);
                return (
                  <label key={locOpt} className="flex items-center justify-between text-xs text-[#94a3b8] hover:text-white cursor-pointer py-1 px-1.5 rounded-lg hover:bg-[#192438] transition-all">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={location.includes(locOpt)}
                        onChange={() => toggleArrayFilter(location, locOpt, setLocation)}
                        className="rounded border-[#243147] bg-[#090d16] text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{locOpt}</span>
                    </div>
                    {count > 0 && (
                      <span className="text-[10px] font-bold text-[#64748b] bg-[#090d16] px-2 py-0.5 rounded-full border border-[#243147]/50">
                        {count}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. EMPLOYMENT TYPE */}
        <div className="border-t border-[#243147]/40 pt-3">
          <button
            onClick={() => toggleSection('employment')}
            className="w-full flex items-center justify-between py-0.5 text-left cursor-pointer group"
          >
            <span className="text-[11px] font-bold text-[#64748b] group-hover:text-white uppercase tracking-wider flex items-center gap-1.5">
              Employment Type {employmentType.length > 0 && <span className="bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 text-[9px] rounded-full font-bold">{employmentType.length}</span>}
            </span>
            {openSections.employment ? <ChevronUp className="w-3.5 h-3.5 text-[#64748b]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#64748b]" />}
          </button>
          
          {openSections.employment && (
            <div className="space-y-0.5 mt-1.5 transition-all">
              {primaryEmpTypes.map((emp) => {
                const count = getEmpCount(emp);
                if (count === 0 && !employmentType.includes(emp)) return null;
                return (
                  <label key={emp} className="flex items-center justify-between text-xs text-[#94a3b8] hover:text-white cursor-pointer py-1 px-1.5 rounded-lg hover:bg-[#192438] transition-all">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={employmentType.includes(emp)}
                        onChange={() => toggleArrayFilter(employmentType, emp, setEmploymentType)}
                        className="rounded border-[#243147] bg-[#090d16] text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{emp}</span>
                    </div>
                    {count > 0 && (
                      <span className="text-[10px] font-bold text-[#64748b] bg-[#090d16] px-2 py-0.5 rounded-full border border-[#243147]/50">
                        {count}
                      </span>
                    )}
                  </label>
                );
              })}

              {showAllEmpTypes && secondaryEmpTypes.map((emp) => {
                const count = getEmpCount(emp);
                if (count === 0 && !employmentType.includes(emp)) return null;
                return (
                  <label key={emp} className="flex items-center justify-between text-xs text-[#94a3b8] hover:text-white cursor-pointer py-1 px-1.5 rounded-lg hover:bg-[#192438] transition-all">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={employmentType.includes(emp)}
                        onChange={() => toggleArrayFilter(employmentType, emp, setEmploymentType)}
                        className="rounded border-[#243147] bg-[#090d16] text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{emp}</span>
                    </div>
                    {count > 0 && (
                      <span className="text-[10px] font-bold text-[#64748b] bg-[#090d16] px-2 py-0.5 rounded-full border border-[#243147]/50">
                        {count}
                      </span>
                    )}
                  </label>
                );
              })}

              <button
                onClick={() => setShowAllEmpTypes(!showAllEmpTypes)}
                className="w-full text-center text-[10px] font-bold text-indigo-400 hover:text-indigo-300 pt-1.5 cursor-pointer"
              >
                {showAllEmpTypes ? 'Show Less' : 'Show More'}
              </button>
            </div>
          )}
        </div>

        {/* 6. POSTING DATE */}
        <div className="border-t border-[#243147]/40 pt-3">
          <button
            onClick={() => toggleSection('datePosted')}
            className="w-full flex items-center justify-between py-0.5 text-left cursor-pointer group"
          >
            <span className="text-[11px] font-bold text-[#64748b] group-hover:text-white uppercase tracking-wider flex items-center gap-1.5">
              Posting Date {dateRange && <span className="bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 text-[9px] rounded-full font-bold">Active</span>}
            </span>
            {openSections.datePosted ? <ChevronUp className="w-3.5 h-3.5 text-[#64748b]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#64748b]" />}
          </button>
          
          {openSections.datePosted && (
            <div className="space-y-0.5 mt-1.5 transition-all">
              {[
                { label: 'Any Time', value: '' },
                { label: 'Today', value: '1d' },
                { label: 'Last 3 Days', value: '3d' },
                { label: 'Last Week', value: '7d' },
                { label: 'Last Month', value: '30d' }
              ].map(opt => (
                <label key={opt.value} className="flex items-center gap-2 text-xs text-[#94a3b8] hover:text-white cursor-pointer py-1 px-1.5 rounded-lg hover:bg-[#192438] transition-all">
                  <input
                    type="radio"
                    name="datePostedOption"
                    checked={dateRange === opt.value}
                    onChange={() => setDateRange(opt.value)}
                    className="border-[#243147] bg-[#090d16] text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

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

  const visibleJobs = accumulatedJobs.filter(j => !hiddenJobs.has(j.job.jobHash) && isJobActive(j.job));

  const hasMore = apiResponse?.pagination?.hasMore;
  const nextCursorToken = apiResponse?.pagination?.nextCursor;
  const totalCount = apiResponse?.pagination?.total ?? visibleJobs.length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen text-white font-sans bg-[#090d16]">
      
      {/* PAGE TITLE HEADER AT THE TOP */}
      <PageHeader
        themeKey="explorer"
        title="Job Explorer"
        description="Browse verified opportunities, filter results, and manage your job search efficiently."
        icon={Search}
      />

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
      {(debouncedQuery || location.length > 0 || remote.length > 0 || experience.length > 0 || department.length > 0 || company.length > 0 || employmentType.length > 0 || dateRange) && (
        <div className="flex flex-wrap items-center gap-2 bg-[#111827] border border-[#243147] rounded-xl p-3 shadow-sm">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider mr-1">Active Filters:</span>

          {debouncedQuery && (
            <span className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fadeIn">
              Query: "{debouncedQuery}" <button onClick={() => { setSearchQuery(''); setDebouncedQuery(''); }}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
            </span>
          )}

          {location.map(loc => (
            <span key={loc} className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fadeIn">
              {loc} <button onClick={() => toggleArrayFilter(location, loc, setLocation)}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
            </span>
          ))}

          {remote.map(rem => (
            <span key={rem} className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fadeIn">
              {rem === 'true' ? 'Remote Only' : rem === 'hybrid' ? 'Hybrid' : 'On-site'} <button onClick={() => toggleArrayFilter(remote, rem, setRemote)}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
            </span>
          ))}

          {experience.map(exp => (
            <span key={exp} className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fadeIn">
              {exp} <button onClick={() => toggleArrayFilter(experience, exp, setExperience)}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
            </span>
          ))}

          {department.map(dept => (
            <span key={dept} className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fadeIn">
              {dept} <button onClick={() => toggleArrayFilter(department, dept, setDepartment)}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
            </span>
          ))}

          {company.map(comp => (
            <span key={comp} className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fadeIn">
              {comp} <button onClick={() => toggleArrayFilter(company, comp, setCompany)}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
            </span>
          ))}

          {employmentType.map(emp => (
            <span key={emp} className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fadeIn">
              {emp} <button onClick={() => toggleArrayFilter(employmentType, emp, setEmploymentType)}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
            </span>
          ))}

          {dateRange && (
            <span className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fadeIn">
              Posted: {dateRange} <button onClick={() => setDateRange('')}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
            </span>
          )}

          <button
            onClick={clearAllFilters}
            className="ml-auto text-xs font-bold text-rose-400 hover:text-rose-300 underline cursor-pointer hover:no-underline transition-all"
          >
            Clear All
          </button>
        </div>
      )}

      {/* DASHBOARD MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLLAPSIBLE FACETED LEFT SIDEBAR */}
        <div className="hidden lg:block lg:col-span-3 space-y-6 bg-[#111827] border border-[#243147] rounded-2xl p-5 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto custom-scrollbar shadow-lg">
          <div className="flex items-center justify-between border-b border-[#243147] pb-3 mb-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-400" /> Faceted Filters
            </h3>
            <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold px-2 py-0.5 rounded-full">
              {totalCount.toLocaleString()} jobs
            </span>
          </div>

          {isFacetsLoading ? (
            <div className="space-y-4 py-4">
              <div className="h-6 bg-[#1f2937] rounded animate-pulse" />
              <div className="h-10 bg-[#1f2937] rounded animate-pulse" />
              <div className="h-6 bg-[#1f2937] rounded animate-pulse" />
              <div className="h-20 bg-[#1f2937] rounded animate-pulse" />
            </div>
          ) : (
            renderSidebarContents()
          )}
        </div>

        {/* CENTRAL INFINITE SCROLL JOB FEED */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Feed Toolbar with Sort & Results Counter */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111827] border border-[#243147] rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-bold text-[#94a3b8]">
              Showing <span className="text-white font-extrabold">{visibleJobs.length}</span> of <span className="text-indigo-400 font-extrabold">{totalCount.toLocaleString()}</span> Jobs
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#64748b]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#090d16] border border-[#243147] text-white text-xs rounded-xl px-3 py-1.5 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="newest">Newest (Default)</option>
                <option value="relevance">Relevance</option>
                <option value="company_name">Company (A–Z)</option>
                <option value="experience_asc">Experience (Low → High)</option>
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
            <div className="bg-[#111827] border border-[#243147] rounded-2xl p-8 text-center space-y-4 shadow-md">
              <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">No jobs matched your current filters</h3>
                <div className="text-xs text-[#94a3b8] space-y-1 pt-1">
                  <p className="font-semibold text-white">Try:</p>
                  <p>• Expanding your location</p>
                  <p>• Selecting a broader experience range</p>
                  <p>• Clearing some filters</p>
                </div>
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

                const rawApplyUrl = job.applyUrl || job.jobUrl || job.postingUrl || job.applicationUrl || job.url;

                return (
                  <div
                    key={job.jobHash}
                    onClick={() => setSelectedJobHash(job.jobHash)}
                    className={`bg-[#111827] border rounded-xl p-4 transition-all duration-200 cursor-pointer space-y-3 shadow-sm ${
                      isSelected 
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-[#162035]' 
                        : 'border-[#243147] hover:border-indigo-500/50 hover:bg-[#141d2f]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{job.company}</div>
                      <div className="text-sm font-bold text-white leading-snug mt-0.5">{job.title}</div>
                      <div className="text-xs text-[#94a3b8] font-medium mt-1">Experience: {job.experienceLevel || job.experience || '2–5 Years'}</div>
                      <div className="text-xs text-[#64748b]">Posted: {postedDateStr}</div>
                    </div>

                    <div className="pt-2 border-t border-[#243147]/60 flex items-center justify-between gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedJobHash(job.jobHash);
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                            : 'bg-[#090d16] hover:bg-[#162135] text-[#94a3b8] hover:text-white border border-[#243147]'
                        }`}
                      >
                        View Details
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(job.jobHash, e);
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                          isBookmarked
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-[#090d16] hover:bg-[#162135] text-[#94a3b8] hover:text-white border border-[#243147]'
                        }`}
                      >
                        {isBookmarked ? 'Saved' : 'Save'}
                      </button>

                      <a
                        href={rawApplyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 py-1.5 px-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer text-center shadow-sm"
                      >
                        Apply
                      </a>
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
                    {isFetching ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Load More Jobs'}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* SLIDE-OVER RIGHT DETAILS PANEL */}
        <div className="hidden lg:block lg:col-span-4 bg-[#111827] border border-[#243147] rounded-2xl p-6 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto custom-scrollbar space-y-6 shadow-lg">
          {(() => {
            const selectedJobItem = visibleJobs.find(j => j.job.jobHash === selectedJobHash)?.job || detailData?.job;
            const isBookmarked = selectedJobHash ? bookmarkedJobs.has(selectedJobHash) : false;

            if (!selectedJobItem) {
              return (
                <div className="text-center py-12 text-xs text-[#94a3b8] font-medium">
                  Select a job card from the feed or click View Details to inspect job summary.
                </div>
              );
            }

            const rawApplyUrl = selectedJobItem.applyUrl || selectedJobItem.jobUrl || selectedJobItem.postingUrl || selectedJobItem.applicationUrl || selectedJobItem.url;

            const salaryText = (() => {
              const sal = selectedJobItem.salary || selectedJobItem.salaryRange;
              if (!sal || sal === 'N/A' || sal === '0' || sal === 'As per company standards') return 'As per company standards';
              return sal;
            })();

            const workModeText = (() => {
              if (selectedJobItem.isRemote === true || String(selectedJobItem.isRemote).toLowerCase() === 'remote' || selectedJobItem.workMode?.toLowerCase().includes('remote')) return 'Remote';
              if (selectedJobItem.workMode?.toLowerCase().includes('hybrid')) return 'Hybrid';
              return selectedJobItem.workMode || 'Onsite';
            })();

            const postedDateText = (() => {
              const val = selectedJobItem.datePosted || selectedJobItem.firstSeen || selectedJobItem.created_at;
              if (!val) return 'Recently';
              if (typeof val === 'string' && (val.includes('ago') || val.includes('Today') || val.includes('Just now'))) return val;
              const d = new Date(val);
              return isNaN(d.getTime()) ? 'Recently' : d.toLocaleDateString();
            })();

            const statusText = selectedJobItem.status || selectedJobItem.activeStatus || 'Active';

            return (
              <div className="space-y-6">
                {/* Header */}
                <div className="border-b border-[#243147] pb-4">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{selectedJobItem.company}</span>
                  <h2 className="text-xl font-extrabold text-white mt-1">{selectedJobItem.title}</h2>
                </div>

                {/* Details List */}
                <div className="space-y-3 bg-[#090d16] border border-[#243147] rounded-xl p-4 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-[#1f2937]">
                    <span className="font-semibold text-[#64748b]">Company Name</span>
                    <span className="font-bold text-white">{selectedJobItem.company}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-[#1f2937]">
                    <span className="font-semibold text-[#64748b]">Job Title</span>
                    <span className="font-bold text-white">{selectedJobItem.title}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-[#1f2937]">
                    <span className="font-semibold text-[#64748b]">Location</span>
                    <span className="font-bold text-white">{selectedJobItem.location || 'Not Specified'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-[#1f2937]">
                    <span className="font-semibold text-[#64748b]">Work Mode</span>
                    <span className="font-bold text-emerald-400">{workModeText}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-[#1f2937]">
                    <span className="font-semibold text-[#64748b]">Experience</span>
                    <span className="font-bold text-white">{selectedJobItem.experienceLevel || selectedJobItem.experience || '2–5 Years'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-[#1f2937]">
                    <span className="font-semibold text-[#64748b]">Salary</span>
                    <span className="font-bold text-amber-300">{salaryText}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-[#1f2937]">
                    <span className="font-semibold text-[#64748b]">Posted Date</span>
                    <span className="font-bold text-white">{postedDateText}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="font-semibold text-[#64748b]">Status</span>
                    <span className="font-bold text-indigo-400">{statusText}</span>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedJobHash(selectedJobItem.jobHash)}
                    className="flex items-center justify-center gap-1.5 p-3 bg-[#131a26] hover:bg-[#1b2535] border border-[#232d3f] rounded-xl text-white font-bold text-xs transition duration-200 cursor-pointer text-center"
                  >
                    <ExternalLink className="w-4 h-4 text-cyan-400" />
                    View Details
                  </button>

                  <button
                    onClick={(e) => toggleBookmark(selectedJobItem.jobHash, e)}
                    className={`flex items-center justify-center gap-1.5 p-3 border rounded-xl font-bold text-xs transition duration-200 cursor-pointer ${
                      isBookmarked 
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                        : 'bg-[#131a26] hover:bg-[#1b2535] border-[#232d3f] text-white'
                    }`}
                  >
                    <Bookmark className="w-4 h-4 text-amber-400" />
                    {isBookmarked ? 'Saved' : 'Save'}
                  </button>

                  <a
                    href={rawApplyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 p-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl transition duration-200 cursor-pointer shadow-lg shadow-indigo-500/20 text-center"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    Apply
                  </a>
                </div>

                {/* Secondary Action Grid */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#243147]">
                  <button
                    onClick={() => trackMutation.mutate('Saved')}
                    className="flex items-center justify-center gap-1.5 p-2.5 bg-[#090d16] hover:bg-[#162135] border border-[#243147] rounded-xl text-slate-200 font-semibold text-xs transition duration-200 cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                    Add to Kanban
                  </button>

                  <button
                    onClick={() => navigate(`/referrals?company=${encodeURIComponent(selectedJobItem.company)}`)}
                    className="flex items-center justify-center gap-1.5 p-2.5 bg-[#090d16] hover:bg-[#162135] border border-[#243147] rounded-xl text-slate-200 font-semibold text-xs transition duration-200 cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5 text-teal-400" />
                    Find Referral
                  </button>

                  <button
                    onClick={() => navigate('/ats-explorer')}
                    className="flex items-center justify-center gap-1.5 p-2.5 bg-[#090d16] hover:bg-[#162135] border border-[#243147] rounded-xl text-slate-200 font-semibold text-xs transition duration-200 cursor-pointer"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                    Company Insights
                  </button>

                  <button
                    onClick={() => navigate(`/cheatsheets?topic=${encodeURIComponent(selectedJobItem.title)}`)}
                    className="flex items-center justify-center gap-1.5 p-2.5 bg-[#090d16] hover:bg-[#162135] border border-[#243147] rounded-xl text-slate-200 font-semibold text-xs transition duration-200 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-purple-400" />
                    Interview Prep
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

      </div>

      {/* MOBILE SLIDE-OVER FILTER DRAWER */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/70 backdrop-blur-sm lg:hidden">
          <div className="ml-auto w-4/5 max-w-xs bg-[#111827] border-l border-[#243147] p-5 h-full overflow-y-auto space-y-6">
            <div className="flex justify-between items-center border-b border-[#243147] pb-3 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Filters</h3>
              <button onClick={() => setMobileFilterOpen(false)}><X className="w-5 h-5 text-white" /></button>
            </div>

            {isFacetsLoading ? (
              <div className="space-y-4 py-4 animate-pulse">
                <div className="h-6 bg-[#1f2937] rounded" />
                <div className="h-10 bg-[#1f2937] rounded" />
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

export default JobExplorer;
