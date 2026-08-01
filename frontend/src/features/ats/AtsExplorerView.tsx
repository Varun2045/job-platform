import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Layers, Cpu, Zap, Globe, Sparkles, X, Clock, ExternalLink, CheckCircle2, AlertTriangle, XCircle, ChevronUp, Search } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader.js';

export type CompanyHealthType = 'Healthy' | 'Warning' | 'Failing';

export interface CompanyDetailItem {
  name: string;
  health: CompanyHealthType;
  lastScraped: string;
  lastVerified: string;
  careerPage: string;
  jobBoardUrl: string;
  careerPageNeedsReview?: boolean;
  jobBoardNeedsReview?: boolean;
  supportedUrl?: string;
  recentErrors?: string[];
}

export interface AtsSubParserInfo {
  id: string;
  name: string;
  pattern?: string;
  averageExtractionMs: number;
  companies: string[];
  companyDetails?: CompanyDetailItem[];
}

export interface AtsCategoryGroup {
  id: string;
  category: 'Native ATS' | 'Company Career Portals' | 'Experimental' | 'Deprecated';
  priority: number;
  totalParsers: number;
  totalCompanies: number;
  averageExtractionMs: number;
  lastVerified: string;
  parsers: AtsSubParserInfo[];
}

export interface UrlDetectionResult {
  url: string;
  platform: string;
  company: string;
  category: string;
  parser: string;
  supported: string;
}

export interface AtsRegistryOverview {
  totalCategories: number;
  totalPlatforms: number;
  totalCompanies: number;
  totalCompanyPlugins: number;
  totalNativeParsers?: number;
  groups: AtsCategoryGroup[];
}

// Reusable Explorer Section Component for both Native ATS & Company Portals
const ExplorerSection: React.FC<{
  group: AtsCategoryGroup;
  isExpanded: boolean;
  onToggleGroup: () => void;
  onSelectCompany: (companyName: string, platformName: string, category: string, extractionMs: number, pattern?: string) => void;
  searchQuery?: string;
}> = ({ group, isExpanded, onToggleGroup, onSelectCompany, searchQuery = '' }) => {
  const isNativeAts = group.id === 'native-ats' || group.category === 'Native ATS';

  // Sub-parser collapsible state for Native ATS job boards
  const [openSubParsers, setOpenSubParsers] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    group.parsers.forEach((p) => {
      initial[p.id] = true; // open all by default
    });
    return initial;
  });

  const toggleSubParser = (id: string) => {
    setOpenSubParsers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Flat collection of companies for non-Native ATS sections
  const allCompanies: { name: string; platformName: string; extractionMs: number; pattern?: string }[] = [];
  group.parsers.forEach((p) => {
    p.companies.forEach((cName) => {
      if (!searchQuery || cName.toLowerCase().includes(searchQuery.toLowerCase())) {
        allCompanies.push({
          name: cName,
          platformName: p.name,
          extractionMs: p.averageExtractionMs,
          pattern: p.pattern,
        });
      }
    });
  });
  allCompanies.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="bg-[#131a26] border border-[#232d3f] rounded-xl overflow-hidden shadow-lg">
      {/* Category Header Bar */}
      <div
        onClick={onToggleGroup}
        className="p-5 flex items-center justify-between cursor-pointer hover:bg-[#1b2535] transition select-none"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? <ChevronDown className="w-5 h-5 text-indigo-400" /> : <ChevronRight className="w-5 h-5 text-[#64748b]" />}
          <h2 className="text-lg font-bold text-white">{group.category}</h2>
        </div>

        <div className="flex items-center gap-6 text-xs text-[#94a3b8]">
          <span>
            Job Boards / Parsers: <strong className="text-white">{group.totalParsers}</strong>
          </span>
          <span>
            Companies: <strong className="text-white">{group.totalCompanies}</strong>
          </span>
          <span>
            Last Verified: <strong className="text-indigo-300">{group.lastVerified}</strong>
          </span>
          <span>
            Avg Extraction: <strong className="text-emerald-400">{group.averageExtractionMs}ms</strong>
          </span>
        </div>
      </div>

      {/* Sub-Section Classification for Native ATS Job Boards */}
      {isExpanded && (
        <div className="p-5 border-t border-[#232d3f] bg-[#0b0f19]/60 space-y-4">
          {isNativeAts ? (
            group.parsers.map((parser) => {
              const isOpen = openSubParsers[parser.id] ?? true;
              const matchingComps = parser.companies.filter((c) =>
                !searchQuery || c.toLowerCase().includes(searchQuery.toLowerCase())
              );
              if (searchQuery && matchingComps.length === 0) return null;

              const sortedComps = [...matchingComps].sort((a, b) => a.localeCompare(b));

              return (
                <div key={parser.id} className="bg-[#131a26] border border-[#232d3f] rounded-xl overflow-hidden shadow-md">
                  {/* Job Board Sub-Section Header */}
                  <div
                    onClick={() => toggleSubParser(parser.id)}
                    className="px-4 py-3 bg-[#192438]/80 hover:bg-[#1e2c45] flex items-center justify-between cursor-pointer transition select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      {isOpen ? <ChevronDown className="w-4 h-4 text-indigo-400" /> : <ChevronRight className="w-4 h-4 text-[#64748b]" />}
                      <span className="text-sm font-bold text-white flex items-center gap-2">
                        {parser.name} Job Board
                        <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
                          {matchingComps.length} Companies
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[#94a3b8]">
                      <span>
                        Latency: <strong className="text-emerald-400">{parser.averageExtractionMs}ms</strong>
                      </span>
                    </div>
                  </div>

                  {/* Sub-Section Companies Grid */}
                  {isOpen && (
                    <div className="p-4 border-t border-[#232d3f]/60 bg-[#090d16]/70">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                        {sortedComps.map((cName) => (
                          <button
                            key={`${parser.id}-${cName}`}
                            onClick={() => onSelectCompany(cName, parser.name, group.category, parser.averageExtractionMs, parser.pattern)}
                            className="px-3 py-2 bg-[#131a26] border border-emerald-500/40 hover:border-emerald-400 rounded-lg text-xs font-semibold text-slate-200 hover:text-white transition text-left cursor-pointer flex items-center justify-between group shadow-sm"
                          >
                            <span className="truncate">{cName}</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 ml-1 group-hover:scale-125 transition-transform" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {allCompanies.map((item) => (
                <button
                  key={`${item.platformName}-${item.name}`}
                  onClick={() => onSelectCompany(item.name, item.platformName, group.category, item.extractionMs, item.pattern)}
                  className="px-3.5 py-2.5 bg-[#131a26] border border-emerald-500/40 hover:border-emerald-400 rounded-lg text-xs font-semibold text-slate-200 hover:text-white transition text-left cursor-pointer flex items-center justify-between group shadow-sm"
                >
                  <span className="truncate">{item.name}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 ml-1 group-hover:scale-125 transition-transform" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const AtsExplorerView: React.FC = () => {
  const [overview, setOverview] = useState<AtsRegistryOverview | null>(null);
  const [testUrl, setTestUrl] = useState('');
  const [urlResult, setUrlResult] = useState<UrlDetectionResult | null>(null);
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'native-ats': true,
    'company-portals': true,
  });
  const [showDevDetails, setShowDevDetails] = useState(false);

  // Inspector Side Drawer State
  // Inspector Side Drawer State
  const [selectedCompany, setSelectedCompany] = useState<{
    name: string;
    platformName: string;
    category: string;
    parserType: string;
    averageExtractionMs: number;
    health: CompanyHealthType;
    lastScraped: string;
    lastVerified: string;
    careerPage: string;
    jobBoardUrl: string;
    careerPageNeedsReview?: boolean;
    jobBoardNeedsReview?: boolean;
    recentErrors?: string[];
  } | null>(null);

  // URL Editing State inside Inspector
  const [editingField, setEditingField] = useState<'careerPage' | 'jobBoardUrl' | null>(null);
  const [editCareerPageVal, setEditCareerPageVal] = useState('');
  const [editJobBoardUrlVal, setEditJobBoardUrlVal] = useState('');
  const [urlErrorMsg, setUrlErrorMsg] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSavingUrl, setIsSavingUrl] = useState(false);

  useEffect(() => {
    fetchRegistry();
  }, []);

  const fetchRegistry = async () => {
    try {
      const res = await fetch('/api/v1/ats/registry');
      const data = await res.json();
      if (data.success) {
        setOverview(data.data);
      }
    } catch (err) {
      console.error('Failed to load ATS registry', err);
    }
  };

  const handleTestUrl = async () => {
    if (!testUrl) return;
    try {
      const res = await fetch('/api/v1/ats/detect-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setUrlResult(data.data);
      }
    } catch (err) {
      console.error('Failed to detect URL', err);
    }
  };

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openCompanyModal = (
    companyName: string,
    platformName: string,
    category: string,
    averageExtractionMs: number,
    pattern?: string,
  ) => {
    let careerPage = `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com/careers`;
    let jobBoardUrl = pattern ? `https://${pattern}/careers` : `${careerPage}#all-jobs`;
    let careerPageNeedsReview = false;
    let jobBoardNeedsReview = false;

    // Search overview for rich companyDetails
    if (overview) {
      for (const group of overview.groups) {
        for (const parser of group.parsers) {
          const detail = parser.companyDetails?.find((d) => d.name.toLowerCase() === companyName.toLowerCase());
          if (detail) {
            if (detail.careerPage) careerPage = detail.careerPage;
            if (detail.jobBoardUrl) jobBoardUrl = detail.jobBoardUrl;
            careerPageNeedsReview = detail.careerPageNeedsReview ?? false;
            jobBoardNeedsReview = detail.jobBoardNeedsReview ?? false;
            break;
          }
        }
      }
    }

    setSelectedCompany({
      name: companyName,
      platformName,
      category,
      parserType: category === 'Native ATS' ? 'Native ATS Parser' : 'Dedicated Company Plugin',
      averageExtractionMs,
      health: 'Healthy',
      lastScraped: '10 minutes ago',
      lastVerified: category === 'Native ATS' ? '2 hours ago' : 'Today',
      careerPage,
      jobBoardUrl,
      careerPageNeedsReview,
      jobBoardNeedsReview,
      recentErrors: [],
    });

    setEditingField(null);
    setEditCareerPageVal(careerPage);
    setEditJobBoardUrlVal(jobBoardUrl);
    setUrlErrorMsg(null);
    setSaveSuccessMsg(null);
  };

  const handleSaveUrlUpdate = async (field: 'careerPage' | 'jobBoardUrl') => {
    if (!selectedCompany) return;
    const targetUrl = field === 'careerPage' ? editCareerPageVal.trim() : editJobBoardUrlVal.trim();

    // Client-side HTTPS URL validation
    try {
      const parsed = new URL(targetUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setUrlErrorMsg('URL must use HTTP or HTTPS protocol (e.g. https://domain.com)');
        return;
      }
    } catch {
      setUrlErrorMsg('Invalid URL format. Please enter a complete HTTPS URL (e.g. https://company.com/careers)');
      return;
    }

    setUrlErrorMsg(null);
    setIsSavingUrl(true);

    try {
      const payload = {
        companyName: selectedCompany.name,
        careerPage: field === 'careerPage' ? targetUrl : selectedCompany.careerPage,
        jobBoardUrl: field === 'jobBoardUrl' ? targetUrl : selectedCompany.jobBoardUrl,
      };

      const res = await fetch('/api/v1/ats/update-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save URL update');
      }

      // Update local modal state
      setSelectedCompany((prev) =>
        prev
          ? {
              ...prev,
              careerPage: payload.careerPage,
              jobBoardUrl: payload.jobBoardUrl,
              careerPageNeedsReview: field === 'careerPage' ? false : prev.careerPageNeedsReview,
              jobBoardNeedsReview: field === 'jobBoardUrl' ? false : prev.jobBoardNeedsReview,
            }
          : null,
      );

      setEditingField(null);
      setSaveSuccessMsg(`${field === 'careerPage' ? 'Career Page' : 'Job Board URL'} updated successfully!`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      await fetchRegistry();
    } catch (err: any) {
      setUrlErrorMsg(err.message || 'Failed to save URL update');
    } finally {
      setIsSavingUrl(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto text-white bg-[#0b0f19] min-h-screen relative">
      {/* Header */}
      <PageHeader
        themeKey="atsExplorer"
        title="Supported ATS & Portal Explorer"
        description="Single source of truth for all supported ATS platforms and company career portals."
        icon={Layers}
      />

      {/* Metrics Summary Cards */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#131a26] border border-[#232d3f] rounded-xl p-4 shadow-lg flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#64748b]">Native ATS Engines</p>
              <p className="text-2xl font-black text-white">
                {overview.totalNativeParsers ?? (overview.groups.find(g => g.id === 'native-ats' || g.category === 'Native ATS')?.parsers.length || 0)} Parsers
              </p>
            </div>
          </div>

          <div className="bg-[#131a26] border border-[#232d3f] rounded-xl p-4 shadow-lg flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#64748b]">Company Plugins</p>
              <p className="text-2xl font-black text-white">{overview.totalCompanyPlugins}</p>
            </div>
          </div>

          <div className="bg-[#131a26] border border-[#232d3f] rounded-xl p-4 shadow-lg flex items-center gap-4">
            <div className="p-3 bg-sky-500/10 rounded-lg text-sky-400 border border-sky-500/20">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#64748b]">Total Companies Tracked</p>
              <p className="text-2xl font-black text-white">{overview.totalCompanies}</p>
            </div>
          </div>
        </div>
      )}

      {/* URL Detection Tester Bar */}
      <div className="bg-[#131a26] border border-[#232d3f] rounded-xl p-5 mb-8 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">URL Platform & Parser Tester</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Paste job URL (e.g. https://boards.greenhouse.io/openai/jobs/12345 or https://stripe.com/jobs)..."
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            className="flex-1 bg-[#0b0f19] border border-[#232d3f] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
          />
          <button
            onClick={handleTestUrl}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition cursor-pointer shrink-0"
          >
            Detect Parser
          </button>
        </div>

        {urlResult && (
          <div className="mt-4 p-4 bg-[#0b0f19] border border-[#232d3f] rounded-lg grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[#64748b] block font-semibold mb-1">Platform</span>
              <span className="font-bold text-white text-sm">{urlResult.platform}</span>
            </div>
            <div>
              <span className="text-[#64748b] block font-semibold mb-1">Company</span>
              <span className="font-bold text-white text-sm">{urlResult.company}</span>
            </div>
            <div>
              <span className="text-[#64748b] block font-semibold mb-1">Category</span>
              <span className="font-bold text-indigo-300">{urlResult.category}</span>
            </div>
            <div>
              <span className="text-[#64748b] block font-semibold mb-1">Support Status</span>
              <span className={`font-bold ${urlResult.supported === 'YES' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {urlResult.supported}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Top Company Search Bar */}
      <div className="bg-[#131a26] border border-indigo-500/30 rounded-xl p-5 mb-8 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Company Directory Search</h2>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search company (e.g. Razorpay, Google, Airbnb, Nike, PwC, Uber, OpenAI)..."
              value={companySearchTerm}
              onChange={(e) => {
                setCompanySearchTerm(e.target.value);
                setActiveSearchQuery(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setActiveSearchQuery(companySearchTerm);
              }}
              className="w-full bg-[#0b0f19] border border-[#232d3f] rounded-lg pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
            />
            <Search className="w-4 h-4 text-[#64748b] absolute left-3.5 top-3.5" />
            {companySearchTerm && (
              <button
                onClick={() => { setCompanySearchTerm(''); setActiveSearchQuery(''); }}
                className="absolute right-3 top-3 text-[#64748b] hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setActiveSearchQuery(companySearchTerm)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition cursor-pointer shrink-0 flex items-center gap-2 justify-center shadow-lg shadow-indigo-500/20"
          >
            <Search className="w-4 h-4" />
            Search Company
          </button>
        </div>
        {activeSearchQuery && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="text-[#94a3b8]">Filtering by:</span>
            <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30 font-semibold flex items-center gap-1.5">
              "{activeSearchQuery}"
              <X
                className="w-3 h-3 cursor-pointer hover:text-white"
                onClick={() => { setCompanySearchTerm(''); setActiveSearchQuery(''); }}
              />
            </span>
          </div>
        )}
      </div>

      {/* Categorized Reusable Sections List */}
      <div className="space-y-4">
        {(overview?.groups || []).map((group) => (
          <ExplorerSection
            key={group.id}
            group={group}
            isExpanded={expandedGroups[group.id] ?? true}
            onToggleGroup={() => toggleGroup(group.id)}
            onSelectCompany={openCompanyModal}
            searchQuery={activeSearchQuery}
          />
        ))}
      </div>

      {/* Side Inspector Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex justify-end z-50 transition-opacity">
          <div className="w-full max-w-md bg-[#131a26] border-l border-[#232d3f] h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#232d3f] mb-6">
                <div>
                  <h3 className="text-xl font-black text-white mb-1">{selectedCompany.name}</h3>
                  <p className="text-xs text-[#94a3b8]">{selectedCompany.platformName}</p>
                </div>
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="p-1.5 hover:bg-[#1b2535] border border-[#232d3f] rounded-lg text-[#94a3b8] hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Health Indicator Banner */}
              {(() => {
                const h = (selectedCompany.health || 'Healthy').toLowerCase();
                const isDegraded = h === 'degraded';
                const isFailed = h === 'failed' || h === 'failing' || h === 'unhealthy';
                return (
                  <div className={`p-3 border rounded-xl flex items-center gap-3 mb-6 ${
                    isDegraded
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : isFailed
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {isDegraded ? (
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    ) : isFailed ? (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                    <div>
                      <p className="text-xs font-bold capitalize">
                        Parser Status: {isDegraded ? 'Degraded' : isFailed ? 'Failed' : 'Healthy'}
                      </p>
                      <p className="text-[11px] opacity-80">
                        {isDegraded
                          ? 'Extraction degraded due to minor DOM changes.'
                          : isFailed
                          ? 'Scraper parser error. Live extraction failed.'
                          : 'Extraction pipeline functioning normally.'}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Metadata Details */}
              <div className="space-y-4 text-xs">
                <div className="bg-[#0b0f19] p-3.5 rounded-lg border border-[#232d3f] flex items-center justify-between">
                  <span className="text-[#64748b]">Parser</span>
                  <span className="font-bold text-white">{selectedCompany.parserType}</span>
                </div>

                <div className="bg-[#0b0f19] p-3.5 rounded-lg border border-[#232d3f] flex items-center justify-between">
                  <span className="text-[#64748b]">Last Successful Scrape</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {selectedCompany.lastScraped}
                  </span>
                </div>

                <div className="bg-[#0b0f19] p-3.5 rounded-lg border border-[#232d3f] flex items-center justify-between">
                  <span className="text-[#64748b]">Last Verification</span>
                  <span className="font-bold text-indigo-300">{selectedCompany.lastVerified}</span>
                </div>

                <div className="bg-[#0b0f19] p-3.5 rounded-lg border border-[#232d3f] flex items-center justify-between">
                  <span className="text-[#64748b]">Average Extraction</span>
                  <span className="font-bold text-emerald-400">{selectedCompany.averageExtractionMs}ms</span>
                </div>

                {/* Error & Success Messages */}
                {urlErrorMsg && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold">
                    ⚠️ {urlErrorMsg}
                  </div>
                )}
                {saveSuccessMsg && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {saveSuccessMsg}
                  </div>
                )}

                {/* 1. CAREER PAGE CARD */}
                <div className="bg-[#0b0f19] p-3.5 rounded-xl border border-[#232d3f] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[#64748b] font-bold uppercase tracking-wider text-[10px]">Career Page</span>
                      {selectedCompany.careerPageNeedsReview && (
                        <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 text-[9px] font-bold rounded-full">
                          ⚠️ Needs Review
                        </span>
                      )}
                    </div>

                    {!editingField && (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={selectedCompany.careerPage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-[#131a26] hover:bg-[#1b2535] border border-[#232d3f] rounded-lg text-indigo-400 hover:text-indigo-300 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" /> Open
                        </a>
                        <button
                          onClick={() => {
                            setEditingField('careerPage');
                            setEditCareerPageVal(selectedCompany.careerPage);
                            setUrlErrorMsg(null);
                          }}
                          className="px-2.5 py-1 bg-[#131a26] hover:bg-[#1b2535] border border-[#232d3f] rounded-lg text-slate-300 hover:text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>

                  {editingField === 'careerPage' ? (
                    <div className="space-y-2 pt-1">
                      <input
                        type="url"
                        value={editCareerPageVal}
                        onChange={(e) => setEditCareerPageVal(e.target.value)}
                        placeholder="https://company.com/careers"
                        className="w-full bg-[#131a26] border border-indigo-500/60 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setEditingField(null)}
                          className="px-3 py-1 bg-[#131a26] text-[#94a3b8] hover:text-white text-xs font-semibold rounded-lg border border-[#232d3f] transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveUrlUpdate('careerPage')}
                          disabled={isSavingUrl}
                          className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                        >
                          {isSavingUrl ? 'Saving...' : 'Save Career Page'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <a
                      href={selectedCompany.careerPage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] text-indigo-400 hover:underline flex items-center gap-1 break-all block"
                    >
                      {selectedCompany.careerPage}
                    </a>
                  )}
                </div>

                {/* 2. JOB BOARD URL CARD */}
                <div className="bg-[#0b0f19] p-3.5 rounded-xl border border-[#232d3f] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[#64748b] font-bold uppercase tracking-wider text-[10px]">Job Board URL</span>
                      {selectedCompany.jobBoardNeedsReview && (
                        <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 text-[9px] font-bold rounded-full">
                          ⚠️ Needs Review
                        </span>
                      )}
                    </div>

                    {!editingField && (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={selectedCompany.jobBoardUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-[#131a26] hover:bg-[#1b2535] border border-[#232d3f] rounded-lg text-emerald-400 hover:text-emerald-300 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" /> Open
                        </a>
                        <button
                          onClick={() => {
                            setEditingField('jobBoardUrl');
                            setEditJobBoardUrlVal(selectedCompany.jobBoardUrl);
                            setUrlErrorMsg(null);
                          }}
                          className="px-2.5 py-1 bg-[#131a26] hover:bg-[#1b2535] border border-[#232d3f] rounded-lg text-slate-300 hover:text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>

                  {editingField === 'jobBoardUrl' ? (
                    <div className="space-y-2 pt-1">
                      <input
                        type="url"
                        value={editJobBoardUrlVal}
                        onChange={(e) => setEditJobBoardUrlVal(e.target.value)}
                        placeholder="https://boards.greenhouse.io/company"
                        className="w-full bg-[#131a26] border border-indigo-500/60 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setEditingField(null)}
                          className="px-3 py-1 bg-[#131a26] text-[#94a3b8] hover:text-white text-xs font-semibold rounded-lg border border-[#232d3f] transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveUrlUpdate('jobBoardUrl')}
                          disabled={isSavingUrl}
                          className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                        >
                          {isSavingUrl ? 'Saving...' : 'Save Job Board URL'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <a
                      href={selectedCompany.jobBoardUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] text-emerald-400 hover:underline flex items-center gap-1 break-all block"
                    >
                      {selectedCompany.jobBoardUrl}
                    </a>
                  )}
                </div>

                {/* Collapsible Developer Details */}
                <div className="pt-2">
                  <button
                    onClick={() => setShowDevDetails(!showDevDetails)}
                    className="w-full flex items-center justify-between p-2.5 bg-[#0b0f19] rounded-lg border border-[#232d3f] text-[#64748b] hover:text-white text-xs transition cursor-pointer"
                  >
                    <span className="font-semibold">Developer Details</span>
                    {showDevDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showDevDetails && (
                    <div className="mt-2 p-3 bg-[#0b0f19] rounded-lg border border-[#232d3f] space-y-2 text-[11px] font-mono text-[#94a3b8]">
                      <div>Category: {selectedCompany.category}</div>
                      <div>Engine: {selectedCompany.platformName}</div>
                      <div>Auto-Register Status: Active</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#232d3f] mt-6">
              <button
                onClick={() => setSelectedCompany(null)}
                className="w-full bg-[#1b2535] hover:bg-[#232d3f] text-white font-semibold text-xs py-2.5 rounded-lg transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
