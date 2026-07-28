import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, Briefcase, Globe, ExternalLink, X, Sparkles, 
  FileText, CheckSquare, Bookmark, Filter, RefreshCw,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { CardSkeleton } from '../../components/Skeleton.js';
import { CoverLetterModal } from './CoverLetterModal.js';
import { ResumeTailoringModal } from './ResumeTailoringModal.js';
import { InterviewPrepPanel } from './InterviewPrepPanel.js';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.js';

export const JobExplorer: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search input & debouncing
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('q') || '');

  // Filter state
  const [location, setLocation] = useState<string[]>(
    searchParams.get('location') ? searchParams.get('location')!.split(',') : []
  );
  const [remote, setRemote] = useState<string[]>(
    searchParams.get('remote') ? searchParams.get('remote')!.split(',') : []
  );
  const [experience, setExperience] = useState<string[]>(
    searchParams.get('experience') ? searchParams.get('experience')!.split(',') : []
  );
  const [department, setDepartment] = useState<string[]>(
    searchParams.get('department') ? searchParams.get('department')!.split(',') : []
  );
  const [company, setCompany] = useState<string[]>(
    searchParams.get('company') ? searchParams.get('company')!.split(',') : []
  );
  const [minScore, setMinScore] = useState<number>(
    searchParams.get('minScore') ? Number(searchParams.get('minScore')) : 0
  );
  const [employmentType, setEmploymentType] = useState<string[]>(
    searchParams.get('employmentType') ? searchParams.get('employmentType')!.split(',') : []
  );
  const [tags, setTags] = useState<string[]>(
    searchParams.get('tags') ? searchParams.get('tags')!.split(',') : []
  );
  const [qualityFlags, setQualityFlags] = useState<string[]>(
    searchParams.get('qualityFlags') ? searchParams.get('qualityFlags')!.split(',') : []
  );
  const [recommendations, setRecommendations] = useState<string[]>(
    searchParams.get('recommendations') ? searchParams.get('recommendations')!.split(',') : []
  );
  const [requiredSkills, setRequiredSkills] = useState<string[]>(
    searchParams.get('requiredSkills') ? searchParams.get('requiredSkills')!.split(',') : []
  );
  const [minYearsExp, setMinYearsExp] = useState<number>(
    searchParams.get('minYearsExp') ? Number(searchParams.get('minYearsExp')) : 0
  );
  const [maxYearsExp, setMaxYearsExp] = useState<number>(
    searchParams.get('maxYearsExp') ? Number(searchParams.get('maxYearsExp')) : 15
  );
  const [minSalary, setMinSalary] = useState<number>(
    searchParams.get('minSalary') ? Number(searchParams.get('minSalary')) : 0
  );
  const [maxSalary, setMaxSalary] = useState<number>(
    searchParams.get('maxSalary') ? Number(searchParams.get('maxSalary')) : 250000
  );
  const [salaryCurrency, setSalaryCurrency] = useState<string>(
    searchParams.get('salaryCurrency') || 'all'
  );
  const [dateRange, setDateRange] = useState<string>(
    searchParams.get('dateRange') || ''
  );
  const [sortBy] = useState<'opportunity' | 'match' | 'newest' | 'highest_salary' | 'company_name'>(
    (searchParams.get('sort') as any) || 'newest'
  );

  // Company Favorites & Recently Viewed tracking
  const [favoriteCompanies, setFavoriteCompanies] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('favorite_companies');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [recentlyViewedCompanies, setRecentlyViewedCompanies] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('recently_viewed_companies');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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
  const [hiddenJobs] = useState<Set<string>>(new Set());

  // UI Drawer & Modal state
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [openCoverLetter, setOpenCoverLetter] = useState(false);
  const [openTailor, setOpenTailor] = useState(false);
  const [openPrep, setOpenPrep] = useState(false);
  const [trackNotes, setTrackNotes] = useState('');

  // Search inside filters state
  const [deptSearch, setDeptSearch] = useState('');
  const [skillSearch, setSkillSearch] = useState('');
  const [locSearch, setLocSearch] = useState('');
  const [compSearch, setCompSearch] = useState('');
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [companySort, setCompanySort] = useState<'count' | 'alpha'>('count');

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
    if (minScore > 0) params.minScore = minScore.toString();
    if (employmentType.length > 0) params.employmentType = employmentType.join(',');
    if (tags.length > 0) params.tags = tags.join(',');
    if (qualityFlags.length > 0) params.qualityFlags = qualityFlags.join(',');
    if (recommendations.length > 0) params.recommendations = recommendations.join(',');
    if (requiredSkills.length > 0) params.requiredSkills = requiredSkills.join(',');
    if (minYearsExp > 0) params.minYearsExp = minYearsExp.toString();
    if (maxYearsExp < 15) params.maxYearsExp = maxYearsExp.toString();
    if (minSalary > 0) params.minSalary = minSalary.toString();
    if (maxSalary < 250000) params.maxSalary = maxSalary.toString();
    if (salaryCurrency !== 'all') params.salaryCurrency = salaryCurrency;
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
    minScore,
    employmentType,
    tags,
    qualityFlags,
    recommendations,
    requiredSkills,
    minYearsExp,
    maxYearsExp,
    minSalary,
    maxSalary,
    salaryCurrency,
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
      minScore,
      employmentType,
      tags,
      qualityFlags,
      recommendations,
      requiredSkills,
      minYearsExp,
      maxYearsExp,
      minSalary,
      maxSalary,
      salaryCurrency,
      dateRange,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: debouncedQuery,
        location: location.join(','),
        remote: remote.join(','),
        experience: experience.join(','),
        department: department.join(','),
        company: company.join(','),
        minScore: minScore.toString(),
        employmentType: employmentType.join(','),
        tags: tags.join(','),
        qualityFlags: qualityFlags.join(','),
        recommendations: recommendations.join(','),
        requiredSkills: requiredSkills.join(','),
        minYearsExp: minYearsExp.toString(),
        maxYearsExp: maxYearsExp.toString(),
        minSalary: minSalary.toString(),
        maxSalary: maxSalary.toString(),
        salaryCurrency,
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
      minScore,
      employmentType,
      tags,
      qualityFlags,
      recommendations,
      requiredSkills,
      minYearsExp,
      maxYearsExp,
      minSalary,
      maxSalary,
      salaryCurrency,
      dateRange,
      sortBy,
      cursor,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: debouncedQuery,
        location: location.join(','),
        remote: remote.join(','),
        experience: experience.join(','),
        department: department.join(','),
        company: company.join(','),
        minScore: minScore.toString(),
        employmentType: employmentType.join(','),
        tags: tags.join(','),
        qualityFlags: qualityFlags.join(','),
        recommendations: recommendations.join(','),
        requiredSkills: requiredSkills.join(','),
        minYearsExp: minYearsExp.toString(),
        maxYearsExp: maxYearsExp.toString(),
        minSalary: minSalary.toString(),
        maxSalary: maxSalary.toString(),
        salaryCurrency,
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

  // Track recently viewed companies
  useEffect(() => {
    if (detailData?.job?.company) {
      const comp = detailData.job.company;
      setRecentlyViewedCompanies(prev => {
        const next = [comp, ...prev.filter(c => c !== comp)].slice(0, 5);
        localStorage.setItem('recently_viewed_companies', JSON.stringify(next));
        return next;
      });
    }
  }, [detailData]);

  const toggleFavoriteCompany = (comp: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteCompanies(prev => {
      const next = prev.includes(comp) ? prev.filter(c => c !== comp) : [...prev, comp];
      localStorage.setItem('favorite_companies', JSON.stringify(next));
      return next;
    });
  };

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
    setMinScore(0);
    setEmploymentType([]);
    setTags([]);
    setQualityFlags(['hide_expired', 'hide_broken', 'hide_duplicate']);
    setRecommendations([]);
    setRequiredSkills([]);
    setMinYearsExp(0);
    setMaxYearsExp(15);
    setMinSalary(0);
    setMaxSalary(250000);
    setSalaryCurrency('all');
    setDateRange('');
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

  const selectLocation = (locVal: string) => {
    toggleArrayFilter(location, locVal, setLocation);
  };

  const selectSkill = (skillVal: string) => {
    toggleArrayFilter(requiredSkills, skillVal, setRequiredSkills);
  };

  const renderSidebarContents = () => {
    const facets = facetsData?.facets || {};

    // Auto-expand maximum experience years if backend returns higher bounds
    const maxPossibleYears = facetsData?.ranges?.experienceYears?.max || 15;

    // Filter lists by local search query inside section
    const filteredLocs = (facets.locations || []).filter((l: any) =>
      l.label.toLowerCase().includes(locSearch.toLowerCase())
    );
    
    // Sort companies dynamically
    const rawComps = facets.companies || [];
    const sortedComps = [...rawComps].sort((a: any, b: any) => {
      const aFav = favoriteCompanies.includes(a.label);
      const bFav = favoriteCompanies.includes(b.label);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      if (companySort === 'alpha') {
        return a.label.localeCompare(b.label);
      }
      return b.count - a.count;
    });
    const filteredComps = sortedComps.filter((c: any) =>
      c.label.toLowerCase().includes(compSearch.toLowerCase())
    );

    // Global Suggestions search (Searches across all categories)
    const suggestionsList: { type: string; label: string; count: number; category: string }[] = [];
    if (skillSearch.trim()) {
      const query = skillSearch.toLowerCase();
      
      (facets.departments || []).forEach((d: any) => {
        if (d.label.toLowerCase().includes(query)) suggestionsList.push({ type: 'department', label: d.label, count: d.count, category: 'Department' });
      });
      (facets.companies || []).forEach((c: any) => {
        if (c.label.toLowerCase().includes(query)) suggestionsList.push({ type: 'company', label: c.label, count: c.count, category: 'Company' });
      });
      (facets.locations || []).forEach((l: any) => {
        if (l.label.toLowerCase().includes(query)) suggestionsList.push({ type: 'location', label: l.label, count: l.count, category: 'Location' });
      });
      (facets.skills || []).forEach((s: any) => {
        if (s.label.toLowerCase().includes(query)) suggestionsList.push({ type: 'skill', label: s.label, count: s.count, category: 'Skill' });
      });
      (facets.employmentTypes || []).forEach((e: any) => {
        if (e.label.toLowerCase().includes(query)) suggestionsList.push({ type: 'employmentType', label: e.label, count: e.count, category: 'Employment Type' });
      });
      (facets.experienceLevels || []).forEach((ex: any) => {
        if (ex.label.toLowerCase().includes(query)) suggestionsList.push({ type: 'experience', label: ex.label, count: ex.count, category: 'Experience Level' });
      });
      (facets.tags || []).forEach((t: any) => {
        if (t.label.toLowerCase().includes(query)) suggestionsList.push({ type: 'tag', label: t.label, count: t.count, category: 'Tag' });
      });
      (facets.recommendations || []).forEach((r: any) => {
        if (r.label.toLowerCase().includes(query)) suggestionsList.push({ type: 'recommendation', label: r.label, count: r.count, category: 'Badge' });
      });
    }

    // Canonical list mappings to ensure ALL values appear
    const canonicalLevels = [
      'Internship',
      'New Graduate',
      'Entry Level (0–2 Years)',
      'Associate (1–3 Years)',
      'Mid Level (2–5 Years)',
      'Senior (5–8 Years)',
      'Staff Engineer',
      'Principal Engineer',
      'Engineering Manager',
      'Director',
      'Executive'
    ];

    const canonicalEmps = [
      'Full-time',
      'Internship',
      'Contract',
      'Temporary',
      'Freelance',
      'Part-time',
      'Apprenticeship',
      'Graduate Program',
      'Co-op',
      'Seasonal',
      'Volunteer',
      'Consultant'
    ];

    // Department grouping configurations
    const deptGroups: Record<string, string[]> = {
      'Engineering': [
        'Backend Engineering', 'Frontend Engineering', 'Full Stack Engineering',
        'Software Engineering', 'Mobile Development', 'Cloud Engineering',
        'DevOps / SRE', 'QA Automation', 'Cybersecurity', 'Embedded Systems',
        'Hardware Engineering'
      ],
      'AI & Data': [
        'AI / Machine Learning', 'Data Science', 'Data Engineering', 'Analytics / BI'
      ],
      'Product': [
        'Product Management', 'Program Management', 'Project Management'
      ],
      'Design': [
        'UI / UX', 'Graphic Design'
      ],
      'Business': [
        'Sales', 'Marketing', 'Finance', 'HR', 'Legal', 'Operations',
        'Customer Success', 'Developer Relations', 'Solutions Engineering'
      ]
    };

    return (
      <div className="space-y-4">
        {/* 1. SEARCH */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-indigo-400" />
            <input
              type="text"
              placeholder="Search inside filters..."
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              className="w-full bg-[#090d16] border border-[#243147] rounded-xl py-1.5 pl-8 pr-8 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-indigo-500"
            />
            {skillSearch && (
              <button onClick={() => setSkillSearch('')} className="absolute right-2.5 text-[#64748b] hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {skillSearch && suggestionsList.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 bg-[#111827] border border-[#243147] rounded-xl p-1.5 mt-1 shadow-2xl max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar">
              <span className="text-[9px] font-bold text-[#64748b] uppercase tracking-wider block px-2 pb-1 border-b border-[#243147]/50 mb-1">Suggestions</span>
              {suggestionsList.slice(0, 15).map((item, idx) => (
                <button
                  key={`${item.type}-${item.label}-${idx}`}
                  onClick={() => {
                    if (item.type === 'department') toggleArrayFilter(department, item.label, setDepartment);
                    else if (item.type === 'company') toggleArrayFilter(company, item.label, setCompany);
                    else if (item.type === 'location') selectLocation(item.label);
                    else if (item.type === 'skill') selectSkill(item.label);
                    else if (item.type === 'employmentType') toggleArrayFilter(employmentType, item.label, setEmploymentType);
                    else if (item.type === 'experience') toggleArrayFilter(experience, item.label, setExperience);
                    setSkillSearch('');
                  }}
                  className="w-full text-left text-xs hover:bg-[#192438] px-2 py-1 rounded-lg flex justify-between items-center transition-colors"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`text-[9px] font-extrabold uppercase px-1 rounded ${
                      item.type === 'skill' ? 'bg-indigo-500/20 text-indigo-300' :
                      item.type === 'company' ? 'bg-emerald-500/20 text-emerald-300' :
                      item.type === 'location' ? 'bg-sky-500/20 text-sky-300' :
                      item.type === 'department' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-500/20 text-slate-300'
                    }`}>
                      {item.category}
                    </span>
                    <span className="truncate text-white font-medium">{item.label}</span>
                  </div>
                  <span className="text-[10px] bg-[#090d16] text-[#64748b] px-1.5 py-0.5 rounded-full border border-[#243147]/50 font-bold">{item.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. DEPARTMENT */}
        <div className="border-t border-[#243147]/40 pt-3">
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
            <div className="space-y-2 mt-1.5 transition-all">
              <input
                type="text"
                placeholder="Search departments..."
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
                className="w-full bg-[#090d16] border border-[#243147] rounded-xl py-1 px-3 text-[11px] text-white focus:outline-none focus:border-indigo-500"
              />
              
              <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {Object.entries(deptGroups).map(([groupName, deptList]) => {
                  const matchingDepts = deptList.filter(d => d.toLowerCase().includes(deptSearch.toLowerCase()));
                  if (matchingDepts.length === 0) return null;

                  return (
                    <div key={groupName} className="space-y-0.5">
                      <span className="text-[9px] font-extrabold text-[#64748b] uppercase tracking-wider block px-1">{groupName}</span>
                      {matchingDepts.map((lvl) => {
                        const match = (facets.departments || []).find((f: any) => f.label.toLowerCase() === lvl.toLowerCase());
                        const count = match ? match.count : 0;
                        return (
                          <label key={lvl} className="flex items-center justify-between text-xs text-[#94a3b8] hover:text-white cursor-pointer py-0.5 px-1.5 rounded-lg hover:bg-[#192438] transition-all">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={department.includes(lvl)}
                                onChange={() => toggleArrayFilter(department, lvl, setDepartment)}
                                className="rounded border-[#243147] bg-[#090d16] text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>{lvl}</span>
                            </div>
                            <span className="text-[10px] font-bold text-[#64748b] bg-[#090d16] px-2 py-0.5 rounded-full border border-[#243147]/50">
                              {count}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  );
                })}

                {(() => {
                  const groupedDeptsSet = new Set(Object.values(deptGroups).flat());
                  const leftovers = (facets.departments || []).filter((d: any) => !groupedDeptsSet.has(d.label) && d.label.toLowerCase().includes(deptSearch.toLowerCase()));
                  if (leftovers.length === 0) return null;

                  return (
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-extrabold text-[#64748b] uppercase tracking-wider block px-1">Other Categories</span>
                      {leftovers.map((f: any) => (
                        <label key={f.label} className="flex items-center justify-between text-xs text-[#94a3b8] hover:text-white cursor-pointer py-0.5 px-1.5 rounded-lg hover:bg-[#192438] transition-all">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={department.includes(f.label)}
                              onChange={() => toggleArrayFilter(department, f.label, setDepartment)}
                              className="rounded border-[#243147] bg-[#090d16] text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>{f.label}</span>
                          </div>
                          <span className="text-[10px] font-bold text-[#64748b] bg-[#090d16] px-2 py-0.5 rounded-full border border-[#243147]/50">
                            {f.count}
                          </span>
                        </label>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* 3. EXPERIENCE */}
        <div className="border-t border-[#243147]/40 pt-3 animate-fadeIn">
          <button
            onClick={() => toggleSection('experience')}
            className="w-full flex items-center justify-between py-0.5 text-left cursor-pointer group"
          >
            <span className="text-[11px] font-bold text-[#64748b] group-hover:text-white uppercase tracking-wider flex items-center gap-1.5">
              Experience {(experience.length > 0 || minYearsExp > 0 || maxYearsExp < 15) && <span className="bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 text-[9px] rounded-full font-bold">Active</span>}
            </span>
            {openSections.experience ? <ChevronUp className="w-3.5 h-3.5 text-[#64748b]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#64748b]" />}
          </button>
          
          {openSections.experience && (
            <div className="space-y-3 mt-1.5 transition-all">
              <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-0.5 pr-1">
                {canonicalLevels.map((lvl) => {
                  const match = (facets.experienceLevels || []).find((f: any) => f.label.toLowerCase() === lvl.toLowerCase());
                  const count = match ? match.count : 0;
                  return (
                    <label key={lvl} className="flex items-center justify-between text-xs text-[#94a3b8] hover:text-white cursor-pointer py-1 px-1.5 rounded-lg hover:bg-[#192438] transition-all">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={experience.includes(lvl)}
                          onChange={() => toggleArrayFilter(experience, lvl, setExperience)}
                          className="rounded border-[#243147] bg-[#090d16] text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{lvl}</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#64748b] bg-[#090d16] px-2 py-0.5 rounded-full border border-[#243147]/50">
                        {count}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Range Slider */}
              <div className="pt-2 border-t border-[#243147]/30 space-y-2">
                <span className="text-[9px] font-bold text-[#64748b] uppercase tracking-wider block">Years of Experience</span>
                <div className="flex justify-between items-center text-xs text-[#94a3b8] gap-2">
                  <div className="flex items-center gap-1.5 bg-[#090d16] border border-[#243147] rounded-lg p-1 px-2">
                    <span className="text-[9px] text-[#64748b] uppercase">Min:</span>
                    <input
                      type="number"
                      min="0"
                      max={maxPossibleYears}
                      value={minYearsExp}
                      onChange={(e) => setMinYearsExp(Math.max(0, Math.min(maxPossibleYears, Number(e.target.value))))}
                      className="w-8 bg-transparent text-white text-center text-xs font-bold outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#090d16] border border-[#243147] rounded-lg p-1 px-2">
                    <span className="text-[9px] text-[#64748b] uppercase">Max:</span>
                    <input
                      type="number"
                      min="0"
                      max={maxPossibleYears}
                      value={maxYearsExp}
                      onChange={(e) => setMaxYearsExp(Math.max(0, Math.min(maxPossibleYears, Number(e.target.value))))}
                      className="w-8 bg-transparent text-white text-center text-xs font-bold outline-none"
                    />
                  </div>
                </div>
                <div className="relative h-6 mt-1 px-1">
                  <div className="absolute w-[calc(100%-8px)] h-1 bg-[#243147] rounded-lg top-2.5 left-1 z-0"></div>
                  <div 
                    className="absolute h-1 bg-indigo-500 rounded-lg top-2.5 z-0"
                    style={{
                      left: `calc(4px + ${(minYearsExp / maxPossibleYears) * 100}% * 0.95)`,
                      width: `${((maxYearsExp - minYearsExp) / maxPossibleYears) * 100}%`
                    }}
                  ></div>
                  <input
                    type="range"
                    min="0"
                    max={maxPossibleYears}
                    step="1"
                    value={minYearsExp}
                    onChange={(e) => setMinYearsExp(Math.min(maxYearsExp, Number(e.target.value)))}
                    className="absolute w-full h-1 bg-transparent appearance-none pointer-events-auto cursor-pointer accent-indigo-500 top-2.5 left-0 z-25 range-slider-single-line"
                  />
                  <input
                    type="range"
                    min="0"
                    max={maxPossibleYears}
                    step="1"
                    value={maxYearsExp}
                    onChange={(e) => setMaxYearsExp(Math.max(minYearsExp, Number(e.target.value)))}
                    className="absolute w-full h-1 bg-transparent appearance-none pointer-events-auto cursor-pointer accent-indigo-500 top-2.5 left-0 z-20 range-slider-single-line"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. COMPANY */}
        <div className="border-t border-[#243147]/40 pt-3">
          <button
            onClick={() => toggleSection('companies')}
            className="w-full flex items-center justify-between py-0.5 text-left cursor-pointer group"
          >
            <span className="text-[11px] font-bold text-[#64748b] group-hover:text-white uppercase tracking-wider flex items-center gap-1.5">
              Company {company.length > 0 && <span className="bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 text-[9px] rounded-full font-bold">{company.length}</span>}
            </span>
            {openSections.companies ? <ChevronUp className="w-3.5 h-3.5 text-[#64748b]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#64748b]" />}
          </button>
          
          {openSections.companies && (
            <div className="space-y-2 mt-1.5 transition-all">
              <input
                type="text"
                placeholder="Search companies..."
                value={compSearch}
                onChange={(e) => setCompSearch(e.target.value)}
                className="w-full bg-[#090d16] border border-[#243147] rounded-xl py-1 px-3 text-[11px] text-white focus:outline-none focus:border-indigo-500"
              />

              <div className="flex gap-2 justify-end text-[9px] font-bold text-[#64748b] px-1">
                <button
                  onClick={() => setCompanySort('count')}
                  className={`hover:text-white cursor-pointer ${companySort === 'count' ? 'text-indigo-400 underline decoration-2' : ''}`}
                >
                  By Hiring Count
                </button>
                <span>|</span>
                <button
                  onClick={() => setCompanySort('alpha')}
                  className={`hover:text-white cursor-pointer ${companySort === 'alpha' ? 'text-indigo-400 underline decoration-2' : ''}`}
                >
                  Alphabetical
                </button>
              </div>

              {recentlyViewedCompanies.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-[#64748b] uppercase tracking-wider block px-1">Recently Viewed</span>
                  <div className="flex flex-wrap gap-1 px-1">
                    {recentlyViewedCompanies.map(c => (
                      <button
                        key={c}
                        onClick={() => toggleArrayFilter(company, c, setCompany)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                          company.includes(c) ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-bold' : 'bg-[#192438] border-[#243147]/50 text-[#94a3b8] hover:text-white'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-0.5 pr-1">
                {(showAllCompanies ? filteredComps : filteredComps.slice(0, 10)).map((f: any) => {
                  const isFavorite = favoriteCompanies.includes(f.label);
                  const firstChar = f.label.charAt(0).toUpperCase();
                  const badgeColors = ['bg-rose-500/20 text-rose-300', 'bg-blue-500/20 text-blue-300', 'bg-emerald-500/20 text-emerald-300', 'bg-amber-500/20 text-amber-300', 'bg-purple-500/20 text-purple-300'];
                  const colorIndex = f.label.charCodeAt(0) % badgeColors.length;

                  return (
                    <div key={f.label} className="flex items-center justify-between text-xs py-0.5 px-1.5 rounded-lg hover:bg-[#192438] transition-all group">
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={company.includes(f.label)}
                          onChange={() => toggleArrayFilter(company, f.label, setCompany)}
                          className="rounded border-[#243147] bg-[#090d16] text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-extrabold ${badgeColors[colorIndex]}`}>
                          {firstChar}
                        </div>
                        <span className="truncate text-[#94a3b8] group-hover:text-white">{f.label}</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => toggleFavoriteCompany(f.label, e)}
                          className={`focus:outline-none transition-all cursor-pointer text-xs ${isFavorite ? 'text-rose-500 font-bold' : 'text-[#64748b] opacity-0 group-hover:opacity-100 hover:text-rose-400'}`}
                          title="Favorite Company"
                        >
                          ♥
                        </button>
                        <span className="text-[10px] font-bold text-[#64748b] bg-[#090d16] px-2 py-0.5 rounded-full border border-[#243147]/50">
                          {f.count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredComps.length > 10 && (
                <button
                  onClick={() => setShowAllCompanies(!showAllCompanies)}
                  className="w-full text-center text-[10px] font-bold text-indigo-400 hover:text-indigo-300 pt-1 cursor-pointer"
                >
                  {showAllCompanies ? 'Show Less' : `Show All (${filteredComps.length})`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* 5. WORK MODE */}
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

        {/* 6. LOCATION */}
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
            <div className="space-y-3 mt-1.5 transition-all">
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="Filter country, state or city..."
                  value={locSearch}
                  onChange={(e) => setLocSearch(e.target.value)}
                  className="w-full bg-[#090d16] border border-[#243147] rounded-xl py-1 px-3 text-[11px] text-white focus:outline-none focus:border-indigo-500 mb-2"
                />
                <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-0.5 pr-1">
                  {filteredLocs.map((f: any) => (
                    <label key={f.label} className="flex items-center justify-between text-xs text-[#94a3b8] hover:text-white cursor-pointer py-1 px-1.5 rounded-lg hover:bg-[#192438] transition-all">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={location.includes(f.label)}
                          onChange={() => selectLocation(f.label)}
                          className="rounded border-[#243147] bg-[#090d16] text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{f.label}</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#64748b] bg-[#090d16] px-2 py-0.5 rounded-full border border-[#243147]/50">
                        {f.count}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 7. EMPLOYMENT TYPE */}
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
              {canonicalEmps.map((emp) => {
                const match = (facets.employmentTypes || []).find((f: any) => f.label.toLowerCase() === emp.toLowerCase());
                const count = match ? match.count : 0;
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
                    <span className="text-[10px] font-bold text-[#64748b] bg-[#090d16] px-2 py-0.5 rounded-full border border-[#243147]/50">
                      {count}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 8. POSTING DATE */}
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
        description="Search, rank by Opportunity Score, and tailor your applications."
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
      {(debouncedQuery || location.length > 0 || remote.length > 0 || experience.length > 0 || department.length > 0 || company.length > 0 || minScore > 0 || employmentType.length > 0 || tags.length > 0 || qualityFlags.length > 0 || recommendations.length > 0 || requiredSkills.length > 0 || minYearsExp > 0 || minSalary > 0 || maxSalary < 250000 || dateRange) && (
        <div className="flex flex-wrap items-center gap-2 bg-[#111827] border border-[#243147] rounded-xl p-3 shadow-sm">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider mr-1">Active Filters:</span>

          {debouncedQuery && (
            <span className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fadeIn">
              Query: "{debouncedQuery}" <button onClick={() => { setSearchQuery(''); setDebouncedQuery(''); }}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
            </span>
          )}

          {location.map(loc => (
            <span key={loc} className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fadeIn">
              Loc: {loc} <button onClick={() => toggleArrayFilter(location, loc, setLocation)}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
            </span>
          ))}

          {remote.map(rem => (
            <span key={rem} className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fadeIn">
              Mode: {rem === 'true' ? 'Remote Only' : rem === 'hybrid' ? 'Hybrid' : 'On-site'} <button onClick={() => toggleArrayFilter(remote, rem, setRemote)}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
            </span>
          ))}

          {experience.map(exp => (
            <span key={exp} className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fadeIn">
              Exp: {exp} <button onClick={() => toggleArrayFilter(experience, exp, setExperience)}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
            </span>
          ))}

          {department.map(dept => (
            <span key={dept} className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fadeIn">
              Dept: {dept} <button onClick={() => toggleArrayFilter(department, dept, setDepartment)}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
            </span>
          ))}

          {company.map(comp => (
            <span key={comp} className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fadeIn">
              Company: {comp} <button onClick={() => toggleArrayFilter(company, comp, setCompany)}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
            </span>
          ))}

          {minScore > 0 && (
            <span className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fadeIn">
              Min {minScore}% Score <button onClick={() => setMinScore(0)}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
            </span>
          )}

          {employmentType.map(emp => (
            <span key={emp} className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fadeIn">
              Emp: {emp} <button onClick={() => toggleArrayFilter(employmentType, emp, setEmploymentType)}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
            </span>
          ))}

          {tags.map(t => (
            <span key={t} className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fadeIn">
              Tag: #{t} <button onClick={() => toggleArrayFilter(tags, t, setTags)}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
            </span>
          ))}

          {qualityFlags.map(f => (
            <span key={f} className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fadeIn">
              Flag: {f} <button onClick={() => toggleArrayFilter(qualityFlags, f, setQualityFlags)}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
            </span>
          ))}

          {recommendations.map(r => (
            <span key={r} className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fadeIn">
              Badge: {r} <button onClick={() => toggleArrayFilter(recommendations, r, setRecommendations)}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
            </span>
          ))}

          {requiredSkills.map(s => (
            <span key={s} className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fadeIn">
              Skill: {s} <button onClick={() => toggleArrayFilter(requiredSkills, s, setRequiredSkills)}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
            </span>
          ))}

          {minYearsExp > 0 && (
            <span className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fadeIn">
              Min {minYearsExp} Yrs Exp <button onClick={() => setMinYearsExp(0)}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
            </span>
          )}

          {(minSalary > 0 || maxSalary < 250000) && (
            <span className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fadeIn">
              Salary: {minSalary / 1000}k - {maxSalary / 1000}k <button onClick={() => { setMinSalary(0); setMaxSalary(250000); }}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
            </span>
          )}

          {dateRange && (
            <span className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fadeIn">
              Range: {dateRange} <button onClick={() => setDateRange('')}><X className="w-3 h-3 hover:text-white cursor-pointer" /></button>
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
        {/* COLLAPSIBLE FACETED LEFT SIDEBAR */}
        <div className="hidden lg:block lg:col-span-3 space-y-6 bg-[#111827] border border-[#243147] rounded-2xl p-5 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto custom-scrollbar shadow-lg">
          <div className="flex items-center justify-between border-b border-[#243147] pb-3 mb-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-400" /> Faceted Filters
            </h3>
            <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold px-2 py-0.5 rounded-full">
              {totalCount} jobs
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
          
          {/* Feed Toolbar */}
          <div className="flex items-center justify-between bg-[#111827] border border-[#243147] rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-bold text-[#94a3b8]">
              Showing <span className="text-white font-extrabold">{visibleJobs.length}</span> of <span className="text-indigo-400 font-extrabold">{totalCount}</span> postings
            </span>
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
                <p className="text-xs text-[#94a3b8] mt-2 max-w-sm mx-auto">
                  We couldn't find any jobs matching your current criteria. Try clearing restrictive filters or broadening keywords.
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
