import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronRight, Layers, Cpu, ShieldCheck, Zap, Globe, Sparkles } from 'lucide-react';

interface AtsSubParserInfo {
  id: string;
  name: string;
  pattern?: string;
  averageExtractionMs: number;
  companies: string[];
}

interface AtsCategoryGroup {
  id: string;
  category: 'Native ATS' | 'Company Career Portals' | 'Generic Parsers' | 'Experimental' | 'Deprecated';
  priority: number;
  status: 'Supported' | 'Experimental' | 'Deprecated' | 'Best Effort';
  totalParsers: number;
  totalCompanies: number;
  averageExtractionMs: number;
  parsers: AtsSubParserInfo[];
}

interface UrlDetectionResult {
  url: string;
  platform: string;
  company: string;
  category: string;
  parser: string;
  supported: string;
  priority: number;
}

interface AtsRegistryOverview {
  totalCategories: number;
  totalPlatforms: number;
  totalCompanies: number;
  totalCompanyPlugins: number;
  totalGenericExtractors: number;
  groups: AtsCategoryGroup[];
}

export const AtsExplorerView: React.FC = () => {
  const [overview, setOverview] = useState<AtsRegistryOverview | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [testUrl, setTestUrl] = useState('');
  const [urlResult, setUrlResult] = useState<UrlDetectionResult | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'native-ats': true,
    'company-portals': true,
    'generic-parsers': false,
  });
  const [expandedParsers, setExpandedParsers] = useState<Record<string, boolean>>({});

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

  const toggleParser = (id: string) => {
    setExpandedParsers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredGroups = overview?.groups.map((group) => {
    const q = searchQuery.toLowerCase();
    if (!q) return group;

    const groupMatches =
      group.category.toLowerCase().includes(q) ||
      group.status.toLowerCase().includes(q) ||
      `priority ${group.priority}`.includes(q);

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
    <div className="p-6 max-w-7xl mx-auto text-white bg-[#0b0f19] min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Layers className="w-8 h-8 text-indigo-400" />
          <h1 className="text-3xl font-black tracking-tight text-white">Parser & ATS Ecosystem Explorer</h1>
        </div>
        <p className="text-[#94a3b8] text-sm max-w-3xl">
          Authoritative ecosystem registry mapping native ATS parsers, 50 company career portal plugins, and Playwright fallback engines. Automatically updated from registry definitions.
        </p>
      </div>

      {/* Metrics Summary Cards */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#131a26] border border-[#232d3f] rounded-xl p-4 shadow-lg flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#64748b]">Categories</p>
              <p className="text-2xl font-black text-white">{overview.totalCategories}</p>
            </div>
          </div>

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
              <p className="text-xs font-bold uppercase tracking-wider text-[#64748b]">Companies Tracked</p>
              <p className="text-2xl font-black text-white">{overview.totalCompanies}+</p>
            </div>
          </div>
        </div>
      )}

      {/* URL Detection Tester */}
      <div className="bg-[#131a26] border border-[#232d3f] rounded-xl p-5 mb-8 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">Real-Time URL Parser & Platform Detector</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Paste any job URL (e.g. https://boards.greenhouse.io/openai/jobs/12345 or https://stripe.com/jobs/...)..."
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
          <div className="mt-4 p-4 bg-[#0b0f19] border border-[#232d3f] rounded-lg grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
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
              <span className="text-[#64748b] block font-semibold mb-1">Priority Path</span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold inline-block">
                Priority {urlResult.priority}
              </span>
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

      {/* Global Search Bar */}
      <div className="relative mb-6">
        <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b]" />
        <input
          type="text"
          placeholder="Search by ATS name, company portal, priority, or status..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#131a26] border border-[#232d3f] rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      {/* Categorized Registry Accordion List */}
      <div className="space-y-4">
        {filteredGroups.map((group) => {
          const isGroupExpanded = expandedGroups[group.id];
          return (
            <div key={group.id} className="bg-[#131a26] border border-[#232d3f] rounded-xl overflow-hidden shadow-lg">
              {/* Category Header Bar */}
              <div
                onClick={() => toggleGroup(group.id)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-[#1b2535] transition select-none"
              >
                <div className="flex items-center gap-3">
                  {isGroupExpanded ? <ChevronDown className="w-5 h-5 text-indigo-400" /> : <ChevronRight className="w-5 h-5 text-[#64748b]" />}
                  <h2 className="text-lg font-bold text-white">{group.category}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Priority {group.priority}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    group.status === 'Supported'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {group.status}
                  </span>
                </div>

                <div className="flex items-center gap-6 text-xs text-[#94a3b8]">
                  <span>
                    Parsers: <strong className="text-white">{group.totalParsers}</strong>
                  </span>
                  {group.totalCompanies > 0 && (
                    <span>
                      Companies: <strong className="text-white">{group.totalCompanies}</strong>
                    </span>
                  )}
                  <span>
                    Avg Latency: <strong className="text-emerald-400">{group.averageExtractionMs}ms</strong>
                  </span>
                </div>
              </div>

              {/* Category Content Body */}
              {isGroupExpanded && (
                <div className="p-5 border-t border-[#232d3f] bg-[#0b0f19]/50 space-y-3">
                  {group.parsers.map((parser) => {
                    const isParserExpanded = expandedParsers[parser.id] ?? (group.id === 'native-ats');
                    return (
                      <div key={parser.id} className="bg-[#131a26] border border-[#232d3f] rounded-lg overflow-hidden">
                        <div
                          onClick={() => toggleParser(parser.id)}
                          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#1b2535] transition text-sm"
                        >
                          <div className="flex items-center gap-2.5 font-bold text-white">
                            {parser.companies.length > 1 ? (
                              isParserExpanded ? <ChevronDown className="w-4 h-4 text-indigo-400" /> : <ChevronRight className="w-4 h-4 text-[#64748b]" />
                            ) : (
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            )}
                            <span>{parser.name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-[#94a3b8]">
                            <span>Companies: <strong className="text-white">{parser.companies.length}</strong></span>
                            <span>Latency: <strong className="text-emerald-400">{parser.averageExtractionMs}ms</strong></span>
                          </div>
                        </div>

                        {isParserExpanded && parser.companies.length > 0 && (
                          <div className="p-3.5 border-t border-[#232d3f] bg-[#0b0f19]/80">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                              {parser.companies.map((company) => (
                                <div
                                  key={company}
                                  className="px-2.5 py-1.5 bg-[#131a26] border border-[#232d3f] rounded text-xs font-medium text-[#cbd5e1] hover:border-indigo-500/50 hover:text-white transition"
                                >
                                  {company}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
