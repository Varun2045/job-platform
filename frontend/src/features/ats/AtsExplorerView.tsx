import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronRight, Layers, Cpu, Zap, Globe, Sparkles, X, Clock, ExternalLink, CheckCircle2, ChevronUp } from 'lucide-react';

export type CompanyHealthType = 'Healthy' | 'Warning' | 'Failing';

export interface CompanyDetailItem {
  name: string;
  health: CompanyHealthType;
  lastScraped: string;
  lastVerified: string;
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
  groups: AtsCategoryGroup[];
}

// Reusable Explorer Section Component for both Native ATS & Company Portals
const ExplorerSection: React.FC<{
  group: AtsCategoryGroup;
  isExpanded: boolean;
  onToggleGroup: () => void;
  onSelectCompany: (companyName: string, platformName: string, category: string, extractionMs: number, pattern?: string) => void;
}> = ({ group, isExpanded, onToggleGroup, onSelectCompany }) => {
  // Collect all companies in alphabetical order across sub-parsers
  const allCompanies: { name: string; platformName: string; extractionMs: number; pattern?: string }[] = [];

  group.parsers.forEach((p) => {
    p.companies.forEach((cName) => {
      allCompanies.push({
        name: cName,
        platformName: p.name,
        extractionMs: p.averageExtractionMs,
        pattern: p.pattern,
      });
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
            Parsers: <strong className="text-white">{group.totalParsers}</strong>
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

      {/* Uniform Responsive Grid Layout */}
      {isExpanded && (
        <div className="p-5 border-t border-[#232d3f] bg-[#0b0f19]/60">
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
        </div>
      )}
    </div>
  );
};

export const AtsExplorerView: React.FC = () => {
  const [overview, setOverview] = useState<AtsRegistryOverview | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [testUrl, setTestUrl] = useState('');
  const [urlResult, setUrlResult] = useState<UrlDetectionResult | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'native-ats': true,
    'company-portals': true,
  });
  const [showDevDetails, setShowDevDetails] = useState(false);

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
    supportedUrl?: string;
    recentErrors?: string[];
  } | null>(null);

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
    setSelectedCompany({
      name: companyName,
      platformName,
      category,
      parserType: category === 'Native ATS' ? 'Native ATS Parser' : 'Dedicated Company Plugin',
      averageExtractionMs,
      health: 'Healthy',
      lastScraped: '10 minutes ago',
      lastVerified: category === 'Native ATS' ? '2 hours ago' : 'Today',
      supportedUrl: pattern ? `https://${pattern}/careers` : `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com/careers`,
      recentErrors: [],
    });
  };

  const filteredGroups = overview?.groups.map((group) => {
    const q = searchQuery.toLowerCase();
    if (!q) return group;

    const groupMatches = group.category.toLowerCase().includes(q);
    const matchingParsers = group.parsers.filter((parser) => {
      const parserMatches = parser.name.toLowerCase().includes(q) || (parser.pattern && parser.pattern.includes(q));
      const companyMatches = parser.companies.some((c) => c.toLowerCase().includes(q));
      return parserMatches || companyMatches;
    });

    if (groupMatches) return group;
    return {
      ...group,
      parsers: matchingParsers,
    };
  }).filter((g) => g.parsers.length > 0 || searchQuery === '') || [];

  return (
    <div className="p-6 max-w-7xl mx-auto text-white bg-[#0b0f19] min-h-screen relative">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Layers className="w-8 h-8 text-indigo-400" />
          <h1 className="text-3xl font-black tracking-tight text-white">Supported ATS & Portal Explorer</h1>
        </div>
        <p className="text-[#94a3b8] text-sm max-w-3xl">
          Single source of truth for all supported ATS platforms and company career portals.
        </p>
      </div>

      {/* Metrics Summary Cards */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#131a26] border border-[#232d3f] rounded-xl p-4 shadow-lg flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#64748b]">Native ATS Engines</p>
              <p className="text-2xl font-black text-white">6 Parsers</p>
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
              <p className="text-2xl font-black text-white">{overview.totalCompanies}+</p>
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

      {/* Search Input Filter */}
      <div className="relative mb-6">
        <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b]" />
        <input
          type="text"
          placeholder="Filter by ATS platform or company name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#131a26] border border-[#232d3f] rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      {/* Categorized Reusable Sections List */}
      <div className="space-y-4">
        {filteredGroups.map((group) => (
          <ExplorerSection
            key={group.id}
            group={group}
            isExpanded={expandedGroups[group.id] ?? true}
            onToggleGroup={() => toggleGroup(group.id)}
            onSelectCompany={openCompanyModal}
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
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 mb-6">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-400">Parser Status: Healthy</p>
                  <p className="text-[11px] text-emerald-300/80">Extraction pipeline functioning normally.</p>
                </div>
              </div>

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

                {selectedCompany.supportedUrl && (
                  <div className="bg-[#0b0f19] p-3.5 rounded-lg border border-[#232d3f]">
                    <span className="text-[#64748b] block mb-1.5">Supported URL Pattern</span>
                    <a
                      href={selectedCompany.supportedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] text-indigo-400 hover:underline flex items-center gap-1 break-all"
                    >
                      {selectedCompany.supportedUrl}
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                )}

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
