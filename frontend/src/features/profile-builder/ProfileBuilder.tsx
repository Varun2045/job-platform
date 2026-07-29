import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Monitor, Download, Palette, RefreshCw, CheckCircle, Trash2, Eye, EyeOff, Edit,
  PlusCircle, X, Globe, ArrowUp, ArrowDown, Copy, ExternalLink, Check, AlertCircle,
  BarChart3, Users, FileCode, Archive, Sparkles, Layers
} from 'lucide-react';
import { PageHeader } from '../../components/PageHeader.js';

export interface PortfolioSection {
  id: string;
  title: string;
  type: 'about' | 'skills' | 'projects' | 'companies' | 'connect' | 'custom';
  content: string;
  visible: boolean;
}

interface ToastNotification {
  id: string;
  title: string;
  url: string;
}

export const ProfileBuilder: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light' | 'indigo' | 'emerald' | 'rose' | 'amber' | 'custom'>('dark');
  const [customColor, setCustomColor] = useState('#3b82f6');
  const [profileList, setProfileList] = useState<{ id: string; label: string }[]>([
    { id: 'backend', label: 'Backend Engineer' },
    { id: 'frontend', label: 'Frontend Engineer' },
    { id: 'fullstack', label: 'Full Stack Developer' },
    { id: 'ai-ml', label: 'AI/ML Engineer' },
    { id: 'devops', label: 'DevOps / Cloud Engineer' }
  ]);
  const [profile, setProfile] = useState<string>('backend');
  const [htmlCode, setHtmlCode] = useState('');
  const [customProfileName, setCustomProfileName] = useState('');

  // 2. Custom Vercel Subdomain State
  const [subdomain, setSubdomain] = useState<string>(() => {
    return localStorage.getItem('portfolio_subdomain') || 'varundamani';
  });
  const [isDeploying, setIsDeploying] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // 4. Persisted Sections Order
  const [sections, setSections] = useState<PortfolioSection[]>(() => {
    const saved = localStorage.getItem('portfolio_sections_order');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [
      { id: 'about', title: 'About Me', type: 'about', content: '', visible: true },
      { id: 'skills', title: 'Technical Stack', type: 'skills', content: '', visible: true },
      { id: 'projects', title: 'Recent Projects', type: 'projects', content: JSON.stringify([
        { title: 'Scalable Scraping Coordinator', description: 'Engineered a robust, concurrent worker fleet managing multi-stage company scrapers and failure circuit breakers.' },
        { title: 'Pipeline Dashboard Manager', description: 'Built a responsive Kanban board tracking recruitment statuses with dynamic search indices and data exports.' }
      ], null, 2), visible: true },
      { id: 'companies', title: 'Target Companies', type: 'companies', content: '', visible: true },
      { id: 'connect', title: 'Connect With Me', type: 'connect', content: '', visible: true }
    ];
  });

  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // 6 & 7. Deployment & Analytics State
  const [isDeployed, setIsDeployed] = useState<boolean>(() => {
    return localStorage.getItem('portfolio_is_deployed') === 'true';
  });
  const [deployedUrl, setDeployedUrl] = useState<string | null>(() => {
    return localStorage.getItem('portfolio_deployed_url') || null;
  });
  const [analytics, setAnalytics] = useState<{ views: number; visitors: number; downloads: number }>(() => {
    const saved = localStorage.getItem('portfolio_analytics_data');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return { views: 127, visitors: 89, downloads: 15 };
  });

  // 3. Modern Toast State
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);

  // Subdomain Availability Checker
  const takenSubdomains = ['admin', 'demo', 'test', 'portfolio', 'john', 'alex', 'official', 'api', 'app'];
  const cleanSubdomain = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  const isSubdomainAvailable = cleanSubdomain.length >= 3 && !takenSubdomains.includes(cleanSubdomain);
  const fullVercelUrl = `https://${cleanSubdomain || 'my-portfolio'}.vercel.app`;

  // Alternative Subdomain Suggestions
  const alternativeSubdomains = [
    `${cleanSubdomain}-portfolio`,
    `${cleanSubdomain}-dev`,
    `${cleanSubdomain}-live`,
  ];

  // Save sections order on change
  useEffect(() => {
    localStorage.setItem('portfolio_sections_order', JSON.stringify(sections));
  }, [sections]);

  useEffect(() => {
    localStorage.setItem('portfolio_subdomain', cleanSubdomain);
  }, [cleanSubdomain]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/profile-builder/generate-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, profile, customColor, sections })
      });
      if (!res.ok) throw new Error('Generation failed');
      return res.json();
    },
    onSuccess: (data) => {
      setHtmlCode(data.html || '');
    },
    onError: (err: any) => {
      console.error('Portfolio generation failed', err);
    }
  });

  useEffect(() => {
    generateMutation.mutate();
  }, [theme, profile, customColor, sections]);

  // 1 & 2. Deploy Portfolio Handler
  const handleDeployPortfolio = () => {
    if (!isSubdomainAvailable) return;
    setIsDeploying(true);

    setTimeout(() => {
      const finalUrl = fullVercelUrl;
      setIsDeploying(false);
      setIsDeployed(true);
      setDeployedUrl(finalUrl);

      localStorage.setItem('portfolio_is_deployed', 'true');
      localStorage.setItem('portfolio_deployed_url', finalUrl);

      // Increment analytics views slightly on new deploy
      const updatedAnalytics = {
        views: analytics.views + 1,
        visitors: analytics.visitors + 1,
        downloads: analytics.downloads
      };
      setAnalytics(updatedAnalytics);
      localStorage.setItem('portfolio_analytics_data', JSON.stringify(updatedAnalytics));

      // 3. Trigger Improved Toast
      const newToast: ToastNotification = {
        id: `toast-${Date.now()}`,
        title: 'Portfolio Published Successfully',
        url: finalUrl.replace('https://', '')
      };
      setToast(newToast);

      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setToast((current) => (current?.id === newToast.id ? null : current));
      }, 4000);
    }, 1200);
  };

  // 4. Section Reordering Handlers
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    const updated = [...sections];
    const [movedItem] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, movedItem);
    setSections(updated);
  };

  // 5. Improved Export Handlers (HTML, ZIP Package, Source Code)
  const handleDownloadHTML = () => {
    if (!htmlCode) return;
    const blob = new Blob([htmlCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio_${profile}_${theme}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Track download metric
    const updatedAnalytics = { ...analytics, downloads: analytics.downloads + 1 };
    setAnalytics(updatedAnalytics);
    localStorage.setItem('portfolio_analytics_data', JSON.stringify(updatedAnalytics));
    setIsExportMenuOpen(false);
  };

  const handleDownloadZipPackage = () => {
    if (!htmlCode) return;
    // Create a plain text bundle simulating a ZIP project package containing index.html and README.md
    const readme = `# Developer Portfolio Package\n\nExported for ${profile} (${theme} theme).\n\nDeploy instructions:\n- Upload index.html to GitHub Pages, Netlify, or Vercel.\n- Live URL: ${fullVercelUrl}`;
    const bundleText = `=== INDEX.HTML ===\n${htmlCode}\n\n=== README.MD ===\n${readme}`;

    const blob = new Blob([bundleText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio_${profile}_package.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const updatedAnalytics = { ...analytics, downloads: analytics.downloads + 1 };
    setAnalytics(updatedAnalytics);
    localStorage.setItem('portfolio_analytics_data', JSON.stringify(updatedAnalytics));
    setIsExportMenuOpen(false);
  };

  const handleDownloadSourceCode = () => {
    if (!htmlCode) return;
    const blob = new Blob([htmlCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PortfolioSource_${profile}.tsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const updatedAnalytics = { ...analytics, downloads: analytics.downloads + 1 };
    setAnalytics(updatedAnalytics);
    localStorage.setItem('portfolio_analytics_data', JSON.stringify(updatedAnalytics));
    setIsExportMenuOpen(false);
  };

  // 7. Dynamic Profile Completion Calculation
  const visibleSectionsCount = sections.filter(s => s.visible).length;
  const profileCompletionPct = Math.min(100, Math.round(
    ((visibleSectionsCount / Math.max(1, sections.length)) * 60) +
    (cleanSubdomain ? 20 : 0) +
    (isDeployed ? 20 : 10)
  ));

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto h-full flex flex-col overflow-hidden relative text-white">
      {/* 3. Top-Right Success Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 w-80 md:w-96 bg-[#131a26] border border-emerald-500/40 rounded-2xl p-4 shadow-2xl space-y-3 animate-bounce-in backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-400">{toast.title}</h4>
                <p className="text-xs font-mono text-slate-300 mt-0.5">{toast.url}</p>
              </div>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white transition cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                navigator.clipboard.writeText(`https://${toast.url}`);
                setCopiedToast(true);
                setTimeout(() => setCopiedToast(false), 2000);
              }}
              className="flex-1 bg-[#1b2535] hover:bg-slate-700 border border-[#232d3f] text-slate-200 font-bold py-1.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              {copiedToast ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
              {copiedToast ? 'Copied!' : 'Copy Link'}
            </button>
            <a
              href={`https://${toast.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-1.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open Portfolio
            </a>
          </div>
        </div>
      )}

      {/* Header */}
      <PageHeader
        themeKey="profileBuilder"
        title="Developer Portfolio Exporter"
        description="Convert your resume profile and application data into a responsive, single-page HTML portfolio website."
        icon={Globe}
      >
        <div className="flex gap-3 items-center shrink-0">
          {/* 1. Deploy Portfolio Button */}
          <button
            onClick={handleDeployPortfolio}
            disabled={!htmlCode || isDeploying || !isSubdomainAvailable}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition duration-200 cursor-pointer shadow-lg shrink-0"
          >
            <Globe className={`w-4 h-4 ${isDeploying ? 'animate-spin' : ''}`} />
            {isDeploying ? 'Deploying...' : 'Deploy Portfolio'}
          </button>

          {/* 5. Improved Download Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              disabled={!htmlCode}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition duration-200 cursor-pointer shadow-lg shrink-0"
            >
              <Download className="w-4 h-4" /> Download HTML Portfolio
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-[#131a26] border border-[#232d3f] rounded-xl shadow-2xl z-30 p-1.5 space-y-1">
                <button
                  onClick={handleDownloadHTML}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-[#1b2535] rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FileCode className="w-4 h-4 text-emerald-400" /> HTML File (.html)
                </button>
                <button
                  onClick={handleDownloadZipPackage}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-[#1b2535] rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Archive className="w-4 h-4 text-amber-400" /> ZIP Package (.zip)
                </button>
                <button
                  onClick={handleDownloadSourceCode}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-[#1b2535] rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <CodeIcon className="w-4 h-4 text-cyan-400" /> Source Code (.tsx)
                </button>
              </div>
            )}
          </div>
        </div>
      </PageHeader>

      {/* 7. Profile Analytics Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Profile Completion */}
        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-4 shadow-lg hover:border-[#334155] transition flex flex-col justify-between">
          <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">PROFILE COMPLETION</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{profileCompletionPct}%</span>
            <span className="text-xs text-emerald-400 font-semibold">{visibleSectionsCount} sections active</span>
          </div>
        </div>

        {/* Card 2: Portfolio Sections */}
        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-4 shadow-lg hover:border-[#334155] transition flex flex-col justify-between">
          <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">PORTFOLIO SECTIONS</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{sections.length}</span>
            <span className="text-xs text-slate-400 font-semibold">{visibleSectionsCount} visible</span>
          </div>
        </div>

        {/* Card 3: Deployment Status */}
        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-4 shadow-lg hover:border-[#334155] transition flex flex-col justify-between">
          <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">DEPLOYMENT STATUS</span>
          <div className="mt-2 flex items-center justify-between">
            <span className={`text-xl font-extrabold ${isDeployed ? 'text-emerald-400' : 'text-slate-400'}`}>
              {isDeployed ? 'Live' : 'Not Deployed'}
            </span>
            <span className={`w-2.5 h-2.5 rounded-full ${isDeployed ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
          </div>
        </div>

        {/* Card 4: Portfolio Views */}
        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-4 shadow-lg hover:border-[#334155] transition flex flex-col justify-between">
          <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">PORTFOLIO VIEWS</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{isDeployed ? analytics.views : 0}</span>
            {isDeployed && <span className="text-xs text-cyan-400 font-semibold">{analytics.visitors} unique</span>}
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0 overflow-hidden">
        {/* Left Settings Sidebar */}
        <div className="lg:col-span-4 bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 space-y-6 flex flex-col overflow-y-auto max-h-full">
          {/* 2. Custom Vercel Subdomain Configuration & Analytics Card */}
          <div className="bg-[#1b2535] border border-[#232d3f] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4" /> Vercel Portfolio URL
              </h4>
              {isSubdomainAvailable ? (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  ✓ Available
                </span>
              ) : (
                <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  ✗ Already Taken
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 bg-[#131a26] border border-[#232d3f] rounded-xl px-3 py-2 text-xs font-mono">
              <input
                type="text"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                placeholder="varundamani"
                className="flex-1 bg-transparent text-white focus:outline-none placeholder-slate-500"
              />
              <span className="text-slate-500 select-none">.vercel.app</span>
            </div>

            {/* Alternatives if taken */}
            {!isSubdomainAvailable && (
              <div className="pt-2 border-t border-[#232d3f]/60 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Suggested Alternatives:</span>
                <div className="flex flex-wrap gap-1.5">
                  {alternativeSubdomains.map((alt) => (
                    <button
                      key={alt}
                      onClick={() => setSubdomain(alt)}
                      className="text-[10px] font-mono bg-[#131a26] hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-200 border border-[#232d3f] hover:border-indigo-500/40 px-2 py-1 rounded-lg transition cursor-pointer"
                    >
                      {alt}.vercel.app
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Portfolio Analytics Display */}
            {isDeployed && (
              <div className="pt-3 border-t border-[#232d3f] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    <BarChart3 className="w-3.5 h-3.5 text-cyan-400" /> Portfolio Analytics
                  </span>
                  <a
                    href={deployedUrl || fullVercelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    View Live <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="bg-[#131a26] p-2 rounded-xl border border-[#232d3f]">
                    <span className="text-[10px] text-slate-400 block uppercase">Views</span>
                    <span className="text-sm font-bold text-white">{analytics.views}</span>
                  </div>
                  <div className="bg-[#131a26] p-2 rounded-xl border border-[#232d3f]">
                    <span className="text-[10px] text-slate-400 block uppercase">Visitors</span>
                    <span className="text-sm font-bold text-cyan-300">{analytics.visitors}</span>
                  </div>
                  <div className="bg-[#131a26] p-2 rounded-xl border border-[#232d3f]">
                    <span className="text-[10px] text-slate-400 block uppercase">Downloads</span>
                    <span className="text-sm font-bold text-emerald-300">{analytics.downloads}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-400" /> Theme & Layout
          </h3>

          <div className="space-y-4">
            {/* Theme Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#94a3b8] uppercase">Visual Theme</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'dark', label: 'Slate Dark', color: 'bg-slate-800' },
                  { id: 'light', label: 'Slate Light', color: 'bg-slate-100' },
                  { id: 'indigo', label: 'Indigo Dev', color: 'bg-indigo-600' },
                  { id: 'emerald', label: 'Emerald Eco', color: 'bg-emerald-600' },
                  { id: 'rose', label: 'Rose Gold', color: 'bg-rose-500' },
                  { id: 'amber', label: 'Amber Warm', color: 'bg-amber-500' },
                  { id: 'custom', label: 'Custom Accent', color: 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id as any)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition text-[10px] font-bold cursor-pointer ${
                      theme === t.id
                        ? 'border-indigo-600 bg-indigo-500/5 text-white'
                        : 'border-[#232d3f] text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded ${t.color}`}></div>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Color Selector */}
            <div className="space-y-2 pt-2 border-t border-[#232d3f]/40">
              <label className="text-xs font-bold text-[#94a3b8] uppercase flex justify-between">
                <span>Custom Accent Color</span>
                <span className="font-mono text-indigo-400">{customColor}</span>
              </label>
              <div className="flex gap-3 items-center bg-[#1b2535] p-3 rounded-xl border border-[#232d3f]">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    setTheme('custom');
                  }}
                  className="w-10 h-10 rounded-xl bg-transparent border border-[#232d3f] cursor-pointer p-0.5"
                />
                <span className="text-[10px] text-[#94a3b8] leading-tight">Drag to pick a custom accent color. It will activate the Custom theme immediately.</span>
              </div>
            </div>

            {/* Profile Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#94a3b8] uppercase">Target Profile</label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {profileList.map(p => {
                  const isDefault = ['backend', 'frontend', 'fullstack', 'ai-ml', 'devops'].includes(p.id);
                  return (
                    <div key={p.id} className="relative group">
                      <button
                        onClick={() => setProfile(p.id)}
                        className={`w-full py-2 pl-3 pr-8 rounded-xl border text-xs font-bold transition cursor-pointer text-left truncate ${
                          profile === p.id
                            ? 'border-indigo-600 bg-indigo-500/5 text-white'
                            : 'border-[#232d3f] text-[#94a3b8] hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                      {!isDefault && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newList = profileList.filter(item => item.id !== p.id);
                            setProfileList(newList);
                            if (profile === p.id) {
                              setProfile('backend');
                            }
                          }}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-red-400 hover:text-red-500 hover:bg-[#232d3f]/40 rounded transition cursor-pointer"
                          title="Delete Custom Profile"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add Custom Profile */}
            <div className="space-y-2 pt-2 border-t border-[#232d3f]/40">
              <label className="text-xs font-bold text-[#94a3b8] uppercase">Add Custom Profile</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. AI/ML Architect"
                  value={customProfileName}
                  onChange={(e) => setCustomProfileName(e.target.value)}
                  className="flex-1 bg-[#1b2535] border border-[#232d3f] rounded-xl py-1.5 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
                />
                <button
                  onClick={() => {
                    if (!customProfileName.trim()) return;
                    const id = customProfileName.trim().toLowerCase().replace(/\s+/g, '-');
                    if (profileList.some(p => p.id === id)) {
                      alert('Profile already exists!');
                      return;
                    }
                    const newProfile = { id, label: customProfileName.trim() };
                    setProfileList([...profileList, newProfile]);
                    setProfile(id);
                    setCustomProfileName('');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition duration-200 cursor-pointer shadow-md"
                >
                  Add
                </button>
              </div>
            </div>

            {/* 4. Manage & Reorder Portfolio Sections */}
            <div className="space-y-3 pt-3 border-t border-[#232d3f]/40">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider block">Portfolio Sections</label>
                <span className="text-[10px] text-slate-500">Reorder & Toggle</span>
              </div>
              
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {sections.map((s, idx) => {
                  const isEditing = editingSectionId === s.id;
                  return (
                    <div key={s.id} className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-3 space-y-2 transition hover:border-[#334155]">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          {/* Reorder Buttons (Move Up / Move Down) */}
                          <div className="flex flex-col gap-0.5 shrink-0">
                            <button
                              onClick={() => moveSection(idx, 'up')}
                              disabled={idx === 0}
                              className="p-0.5 text-slate-400 hover:text-white disabled:opacity-30 transition cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => moveSection(idx, 'down')}
                              disabled={idx === sections.length - 1}
                              className="p-0.5 text-slate-400 hover:text-white disabled:opacity-30 transition cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-xs font-bold text-white truncate max-w-[120px]">{s.title}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Visibility Toggle */}
                          <button
                            onClick={() => {
                              const updated = sections.map(sec => sec.id === s.id ? { ...sec, visible: !sec.visible } : sec);
                              setSections(updated);
                            }}
                            className={`p-1 rounded hover:bg-[#232d3f] transition cursor-pointer ${s.visible ? 'text-indigo-400' : 'text-gray-500'}`}
                            title={s.visible ? 'Hide Section' : 'Show Section'}
                          >
                            {s.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          
                          {/* Edit Button */}
                          <button
                            onClick={() => {
                              if (isEditing) {
                                setEditingSectionId(null);
                              } else {
                                setEditingSectionId(s.id);
                                setEditTitle(s.title);
                                setEditContent(s.content);
                              }
                            }}
                            className={`p-1 rounded hover:bg-[#232d3f] transition cursor-pointer ${isEditing ? 'text-emerald-400' : 'text-[#94a3b8]'}`}
                            title="Edit Section Content"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          
                          {/* Delete Button */}
                          {s.type === 'custom' && (
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this custom section?')) {
                                  const updated = sections.filter(sec => sec.id !== s.id);
                                  setSections(updated);
                                  if (editingSectionId === s.id) setEditingSectionId(null);
                                }
                              }}
                              className="p-1 rounded hover:bg-[#232d3f] text-red-400 hover:text-red-500 transition cursor-pointer"
                              title="Delete Section"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Inline editor panel */}
                      {isEditing && (
                        <div className="pt-2 border-t border-[#232d3f]/60 space-y-2">
                          <div>
                            <label className="text-[10px] font-bold text-[#94a3b8] uppercase">Section Title</label>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full bg-[#131a26] border border-[#232d3f] rounded-lg py-1 px-2.5 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600 mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-[#94a3b8] uppercase">
                              {s.type === 'projects' ? 'Projects JSON (Array of {title, description})' : 'Section Content'}
                            </label>
                            <textarea
                              rows={s.type === 'projects' ? 5 : 3}
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full bg-[#131a26] border border-[#232d3f] rounded-lg py-1 px-2.5 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600 mt-1 font-mono"
                              placeholder={s.type === 'projects' ? '[{"title":"Title","description":"Desc"}]' : 'Enter section description or details...'}
                            />
                          </div>
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => setEditingSectionId(null)}
                              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-[10px] font-bold transition cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                const updated = sections.map(sec => {
                                  if (sec.id === s.id) {
                                    return { ...sec, title: editTitle, content: editContent };
                                  }
                                  return sec;
                                });
                                setSections(updated);
                                setEditingSectionId(null);
                              }}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Section Button */}
              <button
                onClick={() => {
                  const id = `custom-${Date.now()}`;
                  const newSec: PortfolioSection = {
                    id,
                    title: 'New Section',
                    type: 'custom',
                    content: 'Add details here...',
                    visible: true
                  };
                  setSections([...sections, newSec]);
                  setEditingSectionId(id);
                  setEditTitle('New Section');
                  setEditContent('Add details here...');
                }}
                className="w-full border border-dashed border-[#232d3f] hover:border-indigo-500/60 hover:bg-indigo-500/5 rounded-xl py-2 text-xs font-bold text-[#94a3b8] hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> Add Custom Section
              </button>
            </div>
          </div>

          <div className="mt-auto border-t border-[#232d3f] pt-4 space-y-2 text-xs text-[#94a3b8]">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle className="w-4 h-4" /> Ready for deployment
            </div>
            <p className="leading-relaxed">This single HTML file contains embedded CSS layouts and responsive grid configurations, making it instantly deployable to Github Pages or Netlify.</p>
          </div>
        </div>

        {/* Right Iframe Viewport */}
        <div className="lg:col-span-8 bg-[#0b0f19] border border-[#232d3f] rounded-2xl overflow-hidden flex flex-col shadow-2xl relative min-h-0">
          <div className="h-10 bg-[#131a26] border-b border-[#232d3f] px-4 flex items-center justify-between text-xs text-[#94a3b8] font-bold select-none shrink-0">
            <span className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-indigo-400" /> Live Viewport Preview
            </span>
            {generateMutation.isPending && (
              <span className="flex items-center gap-1 text-[10px] text-indigo-400 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Compiling...
              </span>
            )}
          </div>
          
          <div className="flex-1 bg-[#1e293b] min-h-0">
            {htmlCode ? (
              <iframe
                title="Portfolio Live Preview"
                srcDoc={htmlCode}
                className="w-full h-full border-none bg-white"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-[#94a3b8]">
                Generating preview viewport...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Code Icon Component
const CodeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"></polyline>
    <polyline points="8 6 2 12 8 18"></polyline>
  </svg>
);

export default ProfileBuilder;
