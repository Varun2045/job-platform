import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, CheckCircle2, XCircle, BarChart3, AlertCircle } from 'lucide-react';

export const AtsHeatmapView: React.FC = () => {
  const [jobDescription, setJobDescription] = useState(
    'Seeking a Senior TypeScript Developer proficient in Node.js, React, Express, PostgreSQL, Docker, Kubernetes, and AWS cloud services.',
  );
  const [resumeContent, setResumeContent] = useState(
    'Experienced Software Engineer with strong expertise in TypeScript, Node.js, React, Express, PostgreSQL, and Docker containerization.',
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
      return json.data;
    },
  });

  const heatmapData = heatmapMutation.data;

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto min-h-screen text-white">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-emerald-400" /> ATS Keyword Match Heatmap
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Analyze resume skill density against job description requirements to optimize ATS passing rate.
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
            className="w-full bg-[#0b0f19] border border-[#232d3f] rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none flex-1"
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
            className="w-full bg-[#0b0f19] border border-[#232d3f] rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none flex-1"
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
          {heatmapMutation.isPending ? 'Analyzing Heatmap...' : 'Generate Keyword Heatmap'}
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
      {heatmapData && (
        <div className="space-y-6">
          {/* Match Score Meter */}
          <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm text-slate-200">Keyword Density Match</span>
              <span className="text-2xl font-black text-emerald-400">{heatmapData.matchDensityPct}%</span>
            </div>
            <div className="w-full h-4 bg-[#0b0f19] rounded-full overflow-hidden border border-[#232d3f]">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${heatmapData.matchDensityPct}%` }}
              />
            </div>
          </div>

          {/* Side-by-Side Keyword Overlay */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matched Keywords */}
            <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 shadow-xl">
              <h3 className="font-bold text-sm text-emerald-400 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Matched Keywords ({heatmapData.matchedKeywords.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {heatmapData.matchedKeywords.map((kw: string) => (
                  <span
                    key={kw}
                    className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-medium"
                  >
                    ✓ {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Keywords */}
            <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 shadow-xl">
              <h3 className="font-bold text-sm text-rose-400 mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5" /> Missing Keywords ({heatmapData.missingKeywords.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {heatmapData.missingKeywords.map((kw: string) => (
                  <span
                    key={kw}
                    className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs font-medium"
                  >
                    ✗ {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
