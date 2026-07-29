import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, CheckCircle2, XCircle, BarChart3, AlertCircle, Info, Layers, Award, Lightbulb } from 'lucide-react';

export interface KeywordMatchItem {
  keyword: string;
  category: string;
  matchType: 'exact' | 'synonym' | 'fuzzy';
  matchedTerm?: string;
  matchReason?: string;
}

export interface KeywordMissingItem {
  keyword: string;
  category: string;
}

export interface CategoryBreakdownItem {
  category: string;
  weightPct: number;
  matchedCount: number;
  totalCount: number;
  scorePct: number;
  matched: KeywordMatchItem[];
  missing: KeywordMissingItem[];
}

export interface EnterpriseHeatmapData {
  jobId: string;
  resumeProfileId: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  matchDensityPct: number;
  overallAtsScore: number;
  categoryBreakdown?: CategoryBreakdownItem[];
  matchedDetails?: KeywordMatchItem[];
  missingDetails?: KeywordMissingItem[];
  insights?: string[];
}

export const AtsHeatmapView: React.FC = () => {
  const [jobDescription, setJobDescription] = useState(
    `Seeking a Senior Software Engineer with strong experience in Java, Python, TypeScript, Spring Boot, FastAPI, Node.js, React, and Next.js. Must be proficient with PostgreSQL, MongoDB Atlas, Redis, AWS cloud services, Docker containerization, Kubernetes, Terraform, and CI/CD pipelines. Familiarity with PyTorch, LangChain, OpenAI, and REST APIs is a plus. Candidates should demonstrate excellent Problem Solving, Communication, and Agile teamwork skills.`,
  );
  const [resumeContent, setResumeContent] = useState(
    `Experienced Full-Stack Developer skilled in Java, Python, TypeScript, Spring Boot, Express, Nodejs, React, and Next.js. Proven expertise with postgres, mongo, Redis, AWS, docker containers, CI/CD, PyTorch, and RESTful APIs. Strong analytical problem solving and team collaboration skills.`,
  );

  const heatmapMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/heatmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: 'demo-job',
          resumeProfileId: 'demo-resume',
          jobDescription,
          resumeContent,
        }),
      });
      if (!res.ok) throw new Error('Failed to generate ATS heatmap');
      const json = await res.json();
      return json.data as EnterpriseHeatmapData;
    },
  });

  const data = heatmapMutation.data;
  const overallScore = data ? (data.overallAtsScore ?? data.matchDensityPct) : 0;

  // Determine score color badge & theme
  const getScoreTheme = (score: number) => {
    if (score >= 75) return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', gradient: 'from-emerald-500 to-teal-400', label: 'Strong ATS Match' };
    if (score >= 50) return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', gradient: 'from-amber-500 to-yellow-400', label: 'Moderate ATS Match' };
    return { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', gradient: 'from-rose-500 to-red-400', label: 'Needs ATS Improvement' };
  };

  const scoreTheme = getScoreTheme(overallScore);

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto min-h-screen text-white">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-emerald-400" /> Enterprise ATS Keyword Match Heatmap
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Simulate enterprise ATS ranking engines (Jobscan, Resume Worded, Greenhouse, Lever, Ashby) with intelligent multi-word phrase extraction, synonym normalization, fuzzy matching, and weighted scoring.
        </p>
      </div>

      {/* Input Text Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Job Description */}
        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-5 shadow-xl flex flex-col">
          <label className="font-semibold text-sm text-slate-200 mb-2 flex items-center gap-2">
            📄 Target Job Description
          </label>
          <textarea
            rows={8}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste target job description text..."
            className="w-full bg-[#0b0f19] border border-[#232d3f] rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none flex-1 font-mono text-xs leading-relaxed"
          />
        </div>

        {/* Resume Content */}
        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-5 shadow-xl flex flex-col">
          <label className="font-semibold text-sm text-slate-200 mb-2 flex items-center gap-2">
            👤 Candidate Resume Content
          </label>
          <textarea
            rows={8}
            value={resumeContent}
            onChange={(e) => setResumeContent(e.target.value)}
            placeholder="Paste resume content text..."
            className="w-full bg-[#0b0f19] border border-[#232d3f] rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none flex-1 font-mono text-xs leading-relaxed"
          />
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end mb-8">
        <button
          onClick={() => heatmapMutation.mutate()}
          disabled={heatmapMutation.isPending || !jobDescription || !resumeContent}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2"
        >
          <BarChart3 className="w-5 h-5" />
          {heatmapMutation.isPending ? 'Analyzing Heatmap...' : 'Run Enterprise ATS Analysis'}
        </button>
      </div>

      {/* Error Message */}
      {heatmapMutation.isError && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-2xl mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="text-sm font-medium">Failed to generate ATS heatmap analysis.</span>
        </div>
      )}

      {/* Results Panel */}
      {data && (
        <div className="space-y-6">
          {/* Match Score Meter */}
          <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <span className="font-bold text-base text-slate-200">Overall ATS Keyword Match Score</span>
                <span className={`ml-3 text-xs font-semibold px-2.5 py-0.5 rounded-full ${scoreTheme.bg} ${scoreTheme.color} border ${scoreTheme.border}`}>
                  {scoreTheme.label}
                </span>
              </div>
              <span className={`text-3xl font-black ${scoreTheme.color}`}>{overallScore}%</span>
            </div>
            <div className="w-full h-4 bg-[#0b0f19] rounded-full overflow-hidden border border-[#232d3f]">
              <div
                className={`h-full bg-gradient-to-r ${scoreTheme.gradient} transition-all duration-500`}
                style={{ width: `${overallScore}%` }}
              />
            </div>
          </div>

          {/* AI Insights & Recommendations */}
          {data.insights && data.insights.length > 0 && (
            <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 shadow-xl">
              <h3 className="font-bold text-sm text-cyan-400 mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5" /> Enterprise ATS Recommendations & Insights
              </h3>
              <div className="space-y-2">
                {data.insights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs md:text-sm text-slate-300">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Breakdown Grid */}
          {data.categoryBreakdown && data.categoryBreakdown.length > 0 && (
            <div>
              <h3 className="font-bold text-sm text-slate-200 mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" /> Technology & Skill Category Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.categoryBreakdown.map((cat) => (
                  <div key={cat.category} className="bg-[#131a26] border border-[#232d3f] rounded-xl p-4 shadow-lg flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-300">{cat.category}</span>
                      <span className={`text-xs font-bold ${cat.scorePct >= 75 ? 'text-emerald-400' : cat.scorePct >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {cat.matchedCount} / {cat.totalCount} ({cat.scorePct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#0b0f19] rounded-full overflow-hidden mb-3 border border-[#232d3f]">
                      <div
                        className={`h-full ${cat.scorePct >= 75 ? 'bg-emerald-500' : cat.scorePct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${cat.scorePct}%` }}
                      />
                    </div>
                    {/* Category Keywords List */}
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {cat.matched.map((m) => (
                        <div
                          key={m.keyword}
                          title={m.matchReason || (m.matchType === 'exact' ? 'Matched exactly' : `Matched using ${m.matchType}`)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-help flex items-center gap-1 transition-all ${
                            m.matchType === 'exact'
                              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                              : 'bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                          }`}
                        >
                          <span>✓ {m.keyword}</span>
                          {m.matchType !== 'exact' && (
                            <span className="text-[10px] opacity-75">({m.matchedTerm || m.matchType})</span>
                          )}
                        </div>
                      ))}
                      {cat.missing.map((miss) => (
                        <div
                          key={miss.keyword}
                          title="Missing from resume"
                          className="px-2.5 py-1 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-md text-xs font-medium cursor-help flex items-center gap-1 hover:bg-rose-500/25 transition-all"
                        >
                          <span>✗ {miss.keyword}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Side-by-Side Keyword Overlay */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matched Keywords */}
            <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 shadow-xl">
              <h3 className="font-bold text-sm text-emerald-400 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Matched Keywords ({data.matchedKeywords.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.matchedDetails ? (
                  data.matchedDetails.map((m) => (
                    <span
                      key={m.keyword}
                      title={m.matchReason || 'Matched'}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-help flex items-center gap-1.5 transition-colors ${
                        m.matchType === 'exact'
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                          : 'bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                      }`}
                    >
                      ✓ {m.keyword} {m.matchType !== 'exact' && <span className="text-[10px] opacity-75">({m.matchedTerm || m.matchType})</span>}
                    </span>
                  ))
                ) : (
                  data.matchedKeywords.map((kw: string) => (
                    <span
                      key={kw}
                      className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-medium"
                    >
                      ✓ {kw}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Missing Keywords */}
            <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 shadow-xl">
              <h3 className="font-bold text-sm text-rose-400 mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5" /> Missing Keywords ({data.missingKeywords.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.missingDetails ? (
                  data.missingDetails.map((miss) => (
                    <span
                      key={miss.keyword}
                      title="Missing from resume"
                      className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs font-medium cursor-help flex items-center gap-1 hover:bg-rose-500/20 transition-colors"
                    >
                      ✗ {miss.keyword}
                    </span>
                  ))
                ) : (
                  data.missingKeywords.map((kw: string) => (
                    <span
                      key={kw}
                      className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs font-medium"
                    >
                      ✗ {kw}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
