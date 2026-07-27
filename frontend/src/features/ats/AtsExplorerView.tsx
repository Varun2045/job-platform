import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronRight, Server, Layers, Cpu } from 'lucide-react';

interface AtsPlatformInfo {
  id: string;
  name: string;
  parserType: 'Native ATS' | 'Company Plugin' | 'Generic Playwright';
  averageExtractionMs: number;
  companies: string[];
}

interface AtsRegistryOverview {
  totalPlatforms: number;
  totalCompanies: number;
  totalCompanyPlugins: number;
  totalGenericExtractors: number;
  platforms: AtsPlatformInfo[];
}

interface UrlDetectionResult {
  url: string;
  platform: string;
  company: string;
  parser: string;
  supported: string;
}

export const AtsExplorerView: React.FC = () => {
  const [overview, setOverview] = useState<AtsRegistryOverview | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [testUrl, setTestUrl] = useState('');
  const [urlResult, setUrlResult] = useState<UrlDetectionResult | null>(null);
  const [expandedPlatforms, setExpandedPlatforms] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchRegistry();
  }, []);

  const fetchRegistry = async () => {
    try {
      const res = await fetch('/api/v1/ats/registry');
      const data = await res.json();
      if (data.success) {
        setOverview(data.data);
        // Expand top 4 platforms by default
        const initialExpand: Record<string, boolean> = {};
        data.data.platforms.slice(0, 4).forEach((p: AtsPlatformInfo) => {
          initialExpand[p.id] = true;
        });
        setExpandedPlatforms(initialExpand);
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

  const toggleExpand = (id: string) => {
    setExpandedPlatforms((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredPlatforms = overview?.platforms.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesPlatform = p.name.toLowerCase().includes(q) || p.parserType.toLowerCase().includes(q);
    const matchesCompany = p.companies.some((c) => c.toLowerCase().includes(q));
    return matchesPlatform || matchesCompany;
  }) || [];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', color: '#0F172A' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: '#1E293B' }}>
          Supported ATS & Portal Explorer
        </h1>
        <p style={{ color: '#64748B', margin: 0, fontSize: '15px' }}>
          Dynamically discovered recruitment platforms, parser priorities, and company coverage.
        </p>
      </div>

      {/* Admin Stats Overview */}
      {overview && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div style={cardStyle}>
            <div style={{ color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Layers size={20} />
              <span style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>Platforms</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>{overview.totalPlatforms}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Server size={20} />
              <span style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>Companies</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>{overview.totalCompanies}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ color: '#8B5CF6', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Cpu size={20} />
              <span style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>Company Plugins</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>{overview.totalCompanyPlugins}</div>
          </div>
        </div>
      )}

      {/* Live URL Detector Bar */}
      <div style={{ ...cardStyle, marginBottom: '24px', backgroundColor: '#F8FAFC' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginTop: 0, marginBottom: '12px' }}>
          URL Platform & Parser Detection Tool
        </h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder="Paste job URL (e.g. https://boards.greenhouse.io/openai/jobs/1234)..."
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '14px',
            }}
          />
          <button
            onClick={handleTestUrl}
            style={{
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 20px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Detect Parser
          </button>
        </div>

        {urlResult && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#FFFFFF',
              borderRadius: '6px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              gap: '24px',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={labelStyle}>Platform:</span> <strong>{urlResult.platform}</strong>
            </div>
            <div>
              <span style={labelStyle}>Company:</span> <strong>{urlResult.company}</strong>
            </div>
            <div>
              <span style={labelStyle}>Parser Path:</span>{' '}
              <span style={badgeStyle(urlResult.parser)}>{urlResult.parser}</span>
            </div>
            <div>
              <span style={labelStyle}>Status:</span>{' '}
              <span style={{ color: urlResult.supported === 'YES' ? '#059669' : '#D97706', fontWeight: '700' }}>
                {urlResult.supported}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Search Input Filter */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search
          size={18}
          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
        />
        <input
          type="text"
          placeholder="Filter by ATS platform or company name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px 10px 38px',
            borderRadius: '6px',
            border: '1px solid #CBD5E1',
            fontSize: '14px',
          }}
        />
      </div>

      {/* Accordion Platform Lists */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredPlatforms.map((platform) => {
          const isExpanded = expandedPlatforms[platform.id];
          return (
            <div key={platform.id} style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
              <div
                onClick={() => toggleExpand(platform.id)}
                style={{
                  padding: '16px',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A' }}>{platform.name}</span>
                  <span style={badgeStyle(platform.parserType)}>{platform.parserType}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#64748B' }}>
                  <span>
                    Companies: <strong>{platform.companies.length}</strong>
                  </span>
                  <span>
                    Avg Extraction: <strong>{platform.averageExtractionMs}ms</strong>
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: '#F8FAFC',
                    borderTop: '1px solid #E2E8F0',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                      gap: '8px',
                    }}
                  >
                    {platform.companies.map((comp) => (
                      <div
                        key={comp}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#FFFFFF',
                          borderRadius: '4px',
                          border: '1px solid #CBD5E1',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: '#334155',
                        }}
                      >
                        {comp}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  padding: '16px',
  borderRadius: '8px',
  border: '1px solid #E2E8F0',
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#64748B',
  marginRight: '4px',
};

const badgeStyle = (type: string): React.CSSProperties => {
  let bg = '#DBEAFE';
  let color = '#1E40AF';

  if (type === 'Company Plugin') {
    bg = '#F3E8FF';
    color = '#6B21A8';
  } else if (type === 'Generic Playwright') {
    bg = '#FEF3C7';
    color = '#92400E';
  }

  return {
    backgroundColor: bg,
    color,
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '12px',
  };
};
