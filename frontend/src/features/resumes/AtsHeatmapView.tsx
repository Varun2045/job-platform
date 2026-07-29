import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Sparkles, CheckCircle2, XCircle, BarChart3, AlertCircle, Layers, Lightbulb,
  Download, FileText, FileCode, Target, TrendingUp, User
} from 'lucide-react';

export interface KeywordMatchItem {
  keyword: string;
  category: string;
  matchType: 'exact' | 'synonym' | 'fuzzy' | 'semantic';
  matchedTerm?: string;
  matchReason?: string;
  creditPct?: number;
  inferredFrom?: string;
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

export interface ImpactImprovement {
  keyword: string;
  category: string;
  estimatedScoreGain: number;
}

export interface EnterpriseHeatmapData {
  jobId: string;
  resumeProfileId: string;
  matchedKeywords: string[];
  semanticKeywords?: string[];
  missingKeywords: string[];
  matchDensityPct: number;
  overallAtsScore: number;
  categoryBreakdown?: CategoryBreakdownItem[];
  matchedDetails?: KeywordMatchItem[];
  semanticDetails?: KeywordMatchItem[];
  missingDetails?: KeywordMissingItem[];
  highestImpactImprovements?: ImpactImprovement[];
  totalEstimatedGain?: number;
  insights?: string[];
  timestamp?: string;
}

const DEMO_JOB = `Seeking a Senior Software Engineer with strong experience in Java, Python, TypeScript, Spring Boot, FastAPI, Node.js, React, and Next.js. Must be proficient with PostgreSQL, MongoDB Atlas, Redis, AWS cloud services, Docker containerization, Kubernetes, Terraform, and CI/CD pipelines. Candidates should demonstrate excellent Problem Solving, Communication, Leadership, and Agile teamwork skills.`;

const DEMO_RESUME = `Experienced Full-Stack Developer skilled in Java, Python, TypeScript, Spring Boot, Express, Nodejs, React, and Next.js. Proven expertise with postgres, mongo, AWS, docker containers, and RESTful APIs. Served as Publicity Head leading event organization and presentations. Conducted benchmarking, performance tuning, and adaptive algorithms optimization.`;

export const AtsHeatmapView: React.FC = () => {
  // Empty initial state
  const [jobDescription, setJobDescription] = useState('');
  const [resumeContent, setResumeContent] = useState('');

  // Animated score state
  const [animatedScore, setAnimatedScore] = useState<number>(0);
  const [isExportOpen, setIsExportOpen] = useState(false);

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
  const targetScore = data ? (data.overallAtsScore ?? data.matchDensityPct) : 0;

  // Animate ATS Score from 0 to Target Score in 1 second
  useEffect(() => {
    if (!data) {
      setAnimatedScore(0);
      return;
    }

    const duration = 1000; // 1 second
    const steps = 60;
    const stepTime = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const val = Math.round(targetScore * easeProgress);

      setAnimatedScore(val);

      if (currentStep >= steps) {
        setAnimatedScore(targetScore);
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [data, targetScore]);

  // Determine score theme
  const getScoreTheme = (score: number) => {
    if (score >= 75) return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', gradient: 'from-emerald-500 to-teal-400', label: 'Strong ATS Match' };
    if (score >= 50) return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', gradient: 'from-amber-500 to-yellow-400', label: 'Moderate ATS Match' };
    return { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', gradient: 'from-rose-500 to-red-400', label: 'Needs ATS Improvement' };
  };

  const scoreTheme = getScoreTheme(animatedScore);

  const handleLoadDemo = () => {
    setJobDescription(DEMO_JOB);
    setResumeContent(DEMO_RESUME);
  };

  const handleExportJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ATS_Report_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setIsExportOpen(false);
  };

  const handleExportMarkdown = () => {
    if (!data) return;
    let md = `# Enterprise ATS Keyword Match Report\n\n`;
    md += `**Timestamp:** ${data.timestamp || new Date().toLocaleString()}\n`;
    md += `**Overall ATS Score:** ${data.overallAtsScore}% (${scoreTheme.label})\n\n`;

    md += `## 🚀 Highest Impact Improvements\n`;
    if (data.highestImpactImprovements && data.highestImpactImprovements.length > 0) {
      md += `*Estimated Score Gain: +${data.totalEstimatedGain || 0}%*\n\n`;
      data.highestImpactImprovements.forEach((imp) => {
        md += `- **+ ${imp.keyword}** (+${imp.estimatedScoreGain}% ATS gain in ${imp.category})\n`;
      });
    } else {
      md += `No missing high-impact improvements detected.\n`;
    }
    md += `\n`;

    md += `## 💡 Recruiter Recommendations & Insights\n`;
    if (data.insights) {
      data.insights.forEach((ins) => {
        md += `- ${ins}\n`;
      });
    }
    md += `\n`;

    md += `## 📊 Technology Category Breakdown\n`;
    if (data.categoryBreakdown) {
      data.categoryBreakdown.forEach((cat) => {
        md += `### ${cat.category} (${cat.scorePct}% Match)\n`;
        cat.matched.forEach((m) => {
          if (m.matchType === 'semantic') {
            md += `- 🟡 ${m.keyword} *(Semantic: inferred through ${m.inferredFrom || 'experience'})*\n`;
          } else {
            md += `- 🟢 ${m.keyword} *(${m.matchType === 'exact' ? 'Exact' : 'Synonym/Fuzzy'})*\n`;
          }
        });
        cat.missing.forEach((miss) => {
          md += `- 🔴 ${miss.keyword} *(Missing)*\n`;
        });
        md += `\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ATS_Report_${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
    setIsExportOpen(false);
  };

  const handleExportPDF = () => {
    handleExportMarkdown();
  };

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto min-h-screen text-white">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-emerald-400" /> Enterprise ATS Keyword Match Heatmap
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Simulate enterprise ATS ranking engines (Jobscan, Resume Worded, Greenhouse, Lever, Ashby) with semantic skill inference, synonym normalization, fuzzy matching, and weighted scoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {(!jobDescription || !resumeContent) && (
            <button
              onClick={handleLoadDemo}
              className="px-3.5 py-2 bg-[#1b2535] hover:bg-slate-700 border border-[#232d3f] text-indigo-300 hover:text-indigo-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Load Demo Example
            </button>
          )}

          {/* Export Button (Visible when data present) */}
          {data && (
            <div className="relative">
              <button
                onClick={() => setIsExportOpen(!isExportOpen)}
                className="px-4 py-2.5 bg-[#1b2535] hover:bg-slate-700 border border-[#232d3f] text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg"
              >
                <Download className="w-4 h-4 text-emerald-400" /> Export Analysis Report
              </button>

              {isExportOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#131a26] border border-[#232d3f] rounded-xl shadow-2xl z-30 p-1.5 space-y-1">
                  <button
                    onClick={handleExportMarkdown}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-[#1b2535] rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-cyan-400" /> Export as Markdown (.md)
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-[#1b2535] rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <FileCode className="w-4 h-4 text-amber-400" /> Export as JSON (.json)
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-[#1b2535] rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-400" /> Export as Report (.txt)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Input Text Grid with Centered Empty State */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Job Description Box */}
        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-5 shadow-xl flex flex-col">
          <label className="font-semibold text-sm text-slate-200 mb-2 flex items-center gap-2">
            📄 Target Job Description
          </label>
          <div className="relative border border-[#232d3f] rounded-xl bg-[#0b0f19] flex-1 flex flex-col min-h-[220px]">
            <textarea
              rows={9}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full h-full bg-transparent p-4 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 rounded-xl transition-colors resize-none z-10 relative font-mono leading-relaxed"
            />
            {/* Centered Empty State Overlay */}
            {!jobDescription && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none z-0">
                <FileText className="w-10 h-10 text-slate-600 mb-2" />
                <span className="font-bold text-sm text-slate-300">Paste a Job Description</span>
                <span className="text-xs text-slate-500 mt-1">Paste target job requirements or responsibilities here</span>
              </div>
            )}
          </div>
        </div>

        {/* Candidate Resume Content Box */}
        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-5 shadow-xl flex flex-col">
          <label className="font-semibold text-sm text-slate-200 mb-2 flex items-center gap-2">
            👤 Candidate Resume Content
          </label>
          <div className="relative border border-[#232d3f] rounded-xl bg-[#0b0f19] flex-1 flex flex-col min-h-[220px]">
            <textarea
              rows={9}
              value={resumeContent}
              onChange={(e) => setResumeContent(e.target.value)}
              className="w-full h-full bg-transparent p-4 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 rounded-xl transition-colors resize-none z-10 relative font-mono leading-relaxed"
            />
            {/* Centered Empty State Overlay */}
            {!resumeContent && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none z-0">
                <User className="w-10 h-10 text-slate-600 mb-2" />
                <span className="font-bold text-sm text-slate-300">Paste a Resume</span>
                <span className="text-xs text-slate-500 mt-1">Paste candidate profile or resume text here</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end mb-8">
        <button
          onClick={() => heatmapMutation.mutate()}
          disabled={heatmapMutation.isPending || !jobDescription.trim() || !resumeContent.trim()}
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

      {/* Professional Empty State (Before analysis run) */}
      {!data && !heatmapMutation.isPending && !heatmapMutation.isError && (
        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-12 shadow-xl text-center space-y-4 max-w-2xl mx-auto my-8">
          <div className="w-16 h-16 mx-auto bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
            <Target className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-xl font-extrabold text-white">Ready for Enterprise ATS Analysis</h3>
          <p className="text-slate-400 text-xs md:text-sm max-w-md mx-auto leading-relaxed">
            Paste a job description and candidate resume above, then click <strong>Run Enterprise ATS Analysis</strong> to generate ATS match score, semantic skill inference, technology breakdowns, and recruiter recommendations.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-400 pt-2">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Exact Matching</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Semantic Inference</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400"></span> Gap Analysis</span>
          </div>
        </div>
      )}

      {/* Results Panel */}
      {data && (
        <div className="space-y-6">
          {/* Animated Match Score Meter */}
          <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <span className="font-bold text-base text-slate-200">Overall ATS Keyword Match Score</span>
                <span className={`ml-3 text-xs font-semibold px-2.5 py-0.5 rounded-full ${scoreTheme.bg} ${scoreTheme.color} border ${scoreTheme.border}`}>
                  {scoreTheme.label}
                </span>
              </div>
              <span className={`text-3xl font-black ${scoreTheme.color}`}>{animatedScore}%</span>
            </div>
            <div className="w-full h-4 bg-[#0b0f19] rounded-full overflow-hidden border border-[#232d3f]">
              <div
                className={`h-full bg-gradient-to-r ${scoreTheme.gradient} transition-all duration-1000`}
                style={{ width: `${animatedScore}%` }}
              />
            </div>
          </div>

          {/* Recruiter-Style Recommendations & Highest Impact Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Highest Impact Improvements */}
            <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" /> Highest Impact Improvements
                  </h3>
                  {data.totalEstimatedGain !== undefined && data.totalEstimatedGain > 0 && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                      +{data.totalEstimatedGain}% Score Gain Potential
                    </span>
                  )}
                </div>

                {data.highestImpactImprovements && data.highestImpactImprovements.length > 0 ? (
                  <div className="space-y-2.5">
                    {data.highestImpactImprovements.slice(0, 5).map((imp) => (
                      <div
                        key={imp.keyword}
                        className="bg-[#0b0f19] border border-[#232d3f] rounded-xl p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-bold text-xs">+</span>
                          <span className="font-bold text-xs text-slate-200">{imp.keyword}</span>
                          <span className="text-[10px] text-slate-500">({imp.category})</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          +{imp.estimatedScoreGain}% ATS Gain
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No missing high-impact improvements detected. Excellent score!</p>
                )}
              </div>
            </div>

            {/* Recruiter Recommendations & Semantic Insights */}
            <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-cyan-400 mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" /> Recruiter Insights & Semantic Inference
                </h3>
                <div className="space-y-2.5">
                  {data.insights && data.insights.length > 0 ? (
                    data.insights.map((insight, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed bg-[#0b0f19] p-3 rounded-xl border border-[#232d3f]">
                        <span className="text-cyan-400 font-bold shrink-0">•</span>
                        <span>{insight}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">No additional recommendations required.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

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

                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {cat.matched.map((m) => {
                        const isSemantic = m.matchType === 'semantic';
                        const isExact = m.matchType === 'exact';

                        return (
                          <div
                            key={m.keyword}
                            title={m.matchReason || (isExact ? 'Exact Match' : isSemantic ? `Inferred from ${m.inferredFrom}` : `Matched using ${m.matchType}`)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-help flex items-center gap-1 transition-all ${
                              isExact || m.matchType === 'synonym' || m.matchType === 'fuzzy'
                                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                                : 'bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                            }`}
                          >
                            <span>
                              {isExact || m.matchType === 'synonym' || m.matchType === 'fuzzy' ? '🟢' : '🟡'} {m.keyword}
                            </span>
                            {isSemantic && (
                              <span className="text-[10px] opacity-80">(Semantic)</span>
                            )}
                          </div>
                        );
                      })}
                      {cat.missing.map((miss) => (
                        <div
                          key={miss.keyword}
                          title="Missing from resume"
                          className="px-2.5 py-1 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-md text-xs font-medium cursor-help flex items-center gap-1 hover:bg-rose-500/25 transition-all"
                        >
                          <span>🔴 {miss.keyword}</span>
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
                <CheckCircle2 className="w-5 h-5" /> Matched & Inferred Keywords ({(data.matchedKeywords?.length || 0) + (data.semanticKeywords?.length || 0)})
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.matchedDetails && data.matchedDetails.map((m) => (
                  <span
                    key={m.keyword}
                    title={m.matchReason || 'Matched'}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-help flex items-center gap-1.5 transition-colors ${
                      m.matchType === 'semantic'
                        ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                        : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    {m.matchType === 'semantic' ? '🟡' : '🟢'} {m.keyword}
                    {m.matchType === 'semantic' && <span className="text-[10px] opacity-75">(Inferred)</span>}
                  </span>
                ))}
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
                      🔴 {miss.keyword}
                    </span>
                  ))
                ) : (
                  data.missingKeywords.map((kw: string) => (
                    <span
                      key={kw}
                      className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs font-medium"
                    >
                      🔴 {kw}
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
