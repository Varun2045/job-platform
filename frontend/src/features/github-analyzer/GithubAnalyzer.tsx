import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Search, Star, Code, Lightbulb, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader.js';
import { useToast } from '../../context/ToastContext.js';

interface LanguageStat {
  name: string;
  percentage: number;
}

interface RepoHighlight {
  name: string;
  description: string;
  stars: number;
  language: string;
}

interface AnalysisResult {
  username: string;
  languages: LanguageStat[];
  highlights: RepoHighlight[];
  feedback: string[];
}

export const GithubAnalyzer: React.FC = () => {
  const { showToast } = useToast();
  const [username, setUsername] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: async (user: string) => {
      const res = await fetch('/api/github/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user })
      });
      if (!res.ok) throw new Error('Analysis request failed');
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (err: any) => {
      showToast(`✕ GitHub analysis failed: ${err.message}`, 'error');
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    analyzeMutation.mutate(username.trim());
  };

  const getLanguageColor = (lang: string) => {
    if (!lang) return 'bg-gray-400';
    switch (lang.toLowerCase()) {
      case 'typescript': return 'bg-indigo-500';
      case 'javascript': return 'bg-yellow-500';
      case 'go': return 'bg-blue-400';
      case 'python': return 'bg-emerald-500';
      case 'html': return 'bg-orange-500';
      case 'css': return 'bg-pink-500';
      case 'rust': return 'bg-orange-600';
      case 'ruby': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto h-full flex flex-col overflow-y-auto">
      <PageHeader
        themeKey="githubAnalyzer"
        title="GitHub Profile Analyzer"
        description="Evaluate developer repository statistics, language shares, and get recruiter-oriented profile optimization checklists."
        icon={Code}
      />

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="max-w-md shrink-0">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Enter GitHub username (e.g. torvalds)"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full bg-[#131a26] border border-[#232d3f] rounded-2xl py-3 pl-12 pr-32 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
          />
          <button
            type="submit"
            disabled={analyzeMutation.isPending}
            className="absolute right-2 top-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition duration-200 cursor-pointer"
          >
            {analyzeMutation.isPending ? 'Analyzing...' : 'Analyze Profile'}
          </button>
        </div>
      </form>

      {analyzeMutation.isPending && (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-[#94a3b8] gap-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold animate-pulse">Fetching repositories and analyzing commits telemetry...</p>
        </div>
      )}

      {!analyzeMutation.isPending && !result && (
        <div className="border border-dashed border-[#232d3f] rounded-2xl py-24 text-center text-xs text-[#94a3b8] flex flex-col items-center justify-center gap-2">
          <Code className="w-12 h-12 text-[#232d3f]" />
          <p className="font-bold text-white">No active profile queried</p>
          <p className="text-[#6b7280]">Input a public username to run telemetry diagnostics.</p>
        </div>
      )}

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column - Tech Stack */}
          <div className="lg:col-span-4 bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Code className="w-5 h-5 text-indigo-400" /> Language Distribution
            </h3>
            
            <div className="space-y-4">
              {result.languages.length === 0 ? (
                <p className="text-xs text-gray-500">No language data found.</p>
              ) : (
                result.languages.map((l) => (
                  <div key={l.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-white">
                      <span>{l.name}</span>
                      <span className="text-indigo-400">{l.percentage}%</span>
                    </div>
                    <div className="w-full bg-[#1b2535] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getLanguageColor(l.name)} rounded-full`}
                        style={{ width: `${l.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column - Highlights & Feedback */}
          <div className="lg:col-span-8 space-y-6">
            {/* Highlights */}
            <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-indigo-400" /> Repository Highlights
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.highlights.map((h, idx) => (
                  <div key={idx} className="bg-[#1b2535] border border-[#232d3f] p-4 rounded-xl flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-sm">{h.name}</span>
                        <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                          <Star className="w-3 h-3 fill-current" /> {h.stars}
                        </div>
                      </div>
                      <p className="text-xs text-[#94a3b8] line-clamp-2 leading-relaxed">{h.description}</p>
                    </div>
                    <span className="inline-block self-start text-[10px] font-black uppercase text-indigo-400 border border-indigo-600/20 bg-indigo-500/5 px-2 py-0.5 rounded">
                      {h.language}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Profile Feedback Checklist */}
            <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-indigo-400" /> Recruiter Optimization Audit
              </h3>
              
              <div className="space-y-3">
                {result.feedback.map((f, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs text-[#94a3b8] leading-relaxed">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GithubAnalyzer;
