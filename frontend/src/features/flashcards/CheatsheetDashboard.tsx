import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, RotateCw, FileText, 
  Heart, Copy, Check, BookOpen, Brain,
  ChevronRight, ChevronLeft, Compass, Code,
  Layers, Terminal, AlertTriangle, BookmarkCheck,
  ChevronDown, ExternalLink, RefreshCw, Star,
  Bookmark, Download
} from 'lucide-react';

interface Concept {
  name: string;
  explanation: string;
  realWorldUsage: string;
  interviewPoints: string;
}

interface InterviewQA {
  question: string;
  answer: string;
  example: string;
  commonMistakes: string;
  followUp: string[];
  difficulty: string;
}

interface CodingProblem {
  problemStatement: string;
  difficulty: string;
  expectedApproach: string;
  timeComplexity: string;
  spaceComplexity: string;
  optimizedSolution: string;
  commonMistakes: string;
}

interface PracticalExample {
  title: string;
  description: string;
  code: string;
}

interface BestPractice {
  category: string;
  tip: string;
  details: string;
}

interface CommonMistake {
  mistake: string;
  whyWrong: string;
  howToAvoid: string;
}

interface RevisionSheet {
  keywords: string[];
  definitions: Record<string, string>;
  importantAPIsOrCommands: string[];
  shortNotes: string[];
}

interface Resources {
  officialDoc: string;
  bestBooks: string[];
  gitHubRepos: string[];
  recommendedArticles: string[];
  practicePlatforms: string[];
}

interface CheatsheetData {
  title: string;
  description: string;
  overview?: {
    introduction?: string;
    whyMatters?: string;
    industryUsage?: string;
    difficulty?: string;
    readingTime?: string;
  };
  concepts?: Concept[];
  interviewQA?: InterviewQA[];
  companyQuestions?: Record<string, string[]>;
  codingProblems?: CodingProblem[];
  practicalExamples?: PracticalExample[];
  bestPractices?: BestPractice[];
  commonMistakes?: CommonMistake[];
  revisionSheet?: RevisionSheet;
  relatedTopics?: string[];
  resources?: Resources;
}

// Saved library item structure
interface LibraryItem {
  id: string;
  topic: string;
  timestamp: string;
  data: CheatsheetData;
}

export const CheatsheetDashboard: React.FC = () => {
  const [topicInput, setTopicInput] = useState('');
  const [difficultyMode, setDifficultyMode] = useState<'Intermediate' | 'Beginner' | 'Advanced'>('Intermediate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingTab, setIsLoadingTab] = useState(false);
  const [cheatsheetData, setCheatsheetData] = useState<CheatsheetData | null>(null);
  
  // UX Features
  const [mainTab, setMainTab] = useState<'guide' | 'library'>('guide');
  const [activeTab, setActiveTab] = useState<'overview' | 'concepts' | 'qa' | 'coding' | 'company' | 'examples' | 'best-practices' | 'revision' | 'resources'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [expandedQAIdx, setExpandedQAIdx] = useState<number | null>(null);
  const [expandedCodeIdx, setExpandedCodeIdx] = useState<number | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('Google');
  const [customCompanyInput, setCustomCompanyInput] = useState<string>('');
  const targetCompany = selectedCompany === 'Custom...' ? (customCompanyInput.trim() || 'Custom') : selectedCompany;
  
  // Library, History, and Favorites from localStorage
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [libraryFilter, setLibraryFilter] = useState<'saved' | 'favorites'>('saved');
  const [compareA, setCompareA] = useState<LibraryItem | null>(null);
  const [compareB, setCompareB] = useState<LibraryItem | null>(null);

  // Auto-initialize matrix targets
  useEffect(() => {
    if (library.length >= 2) {
      if (!compareA || !library.some(x => x.id === compareA.id)) {
        setCompareA(library[0]);
      }
      if (!compareB || !library.some(x => x.id === compareB.id)) {
        setCompareB(library[1]);
      }
    } else {
      setCompareA(null);
      setCompareB(null);
    }
  }, [library]);

  // Sub-generation states
  const [subLoading, setSubLoading] = useState(false);
  const [subModalData, setSubModalData] = useState<{ title: string; type: string; content: any } | null>(null);

  // References for scrolling
  const containerRef = useRef<HTMLDivElement>(null);

  // Load stats from localStorage
  useEffect(() => {
    try {
      const storedLibrary = localStorage.getItem('prep_hub_library');
      if (storedLibrary) setLibrary(JSON.parse(storedLibrary));

      const storedHistory = localStorage.getItem('prep_hub_history');
      if (storedHistory) setHistory(JSON.parse(storedHistory));

      const storedFavorites = localStorage.getItem('prep_hub_favorites');
      if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
    } catch (e) {
      console.error('Failed to load local storage stats', e);
    }
  }, []);

  // Save changes to library
  const saveLibraryToDisk = (updatedLibrary: LibraryItem[]) => {
    setLibrary(updatedLibrary);
    localStorage.setItem('prep_hub_library', JSON.stringify(updatedLibrary));
  };

  // Add search history
  const addToHistory = (topic: string) => {
    const trimmed = topic.trim();
    if (!trimmed) return;
    const filtered = history.filter(h => h.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...filtered].slice(0, 10);
    setHistory(updated);
    localStorage.setItem('prep_hub_history', JSON.stringify(updated));
  };

  // Favorite toggle
  const toggleFavorite = (topic: string) => {
    const trimmed = topic.trim();
    let updated: string[];
    if (favorites.includes(trimmed)) {
      updated = favorites.filter(f => f !== trimmed);
    } else {
      updated = [...favorites, trimmed];
    }
    setFavorites(updated);
    localStorage.setItem('prep_hub_favorites', JSON.stringify(updated));
  };

  // On-demand tab loading logic
  const handleTabChange = async (tab: typeof activeTab, forceReload = false) => {
    setActiveTab(tab);
    if (!cheatsheetData) return;

    let needLoad = false;
    let mode: any = null;
    
    if (tab === 'qa' && (forceReload || !cheatsheetData.interviewQA || cheatsheetData.interviewQA.length === 0)) {
      needLoad = true; mode = 'qa';
    } else if (tab === 'coding' && (forceReload || !cheatsheetData.codingProblems || cheatsheetData.codingProblems.length === 0)) {
      needLoad = true; mode = 'coding';
    } else if (tab === 'company' && (forceReload || !cheatsheetData.companyQuestions || !cheatsheetData.companyQuestions[targetCompany])) {
      needLoad = true; mode = 'company';
    } else if (tab === 'examples' && (forceReload || !cheatsheetData.practicalExamples || cheatsheetData.practicalExamples.length === 0)) {
      needLoad = true; mode = 'examples';
    } else if (tab === 'best-practices' && (forceReload || !cheatsheetData.bestPractices || cheatsheetData.bestPractices.length === 0)) {
      needLoad = true; mode = 'best-practices';
    } else if (tab === 'revision' && (forceReload || !cheatsheetData.revisionSheet || !cheatsheetData.revisionSheet.definitions)) {
      needLoad = true; mode = 'revision';
    } else if (tab === 'resources' && (forceReload || !cheatsheetData.resources || !cheatsheetData.resources.officialDoc)) {
      needLoad = true; mode = 'resources';
    }

    if (needLoad && mode) {
      setIsLoadingTab(true);
      try {
        const res = await fetch('/api/cheatsheet/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: cheatsheetData.title,
            options: { mode, difficulty: difficultyMode, company: targetCompany }
          })
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Server returned status ${res.status}`);
        }
        const data = await res.json();
        if (data.success && data.cheatsheet) {
          const merged = { ...cheatsheetData };
          if (mode === 'qa') {
            merged.interviewQA = data.cheatsheet.interviewQA;
          } else if (mode === 'coding') {
            merged.codingProblems = data.cheatsheet.codingProblems;
          } else if (mode === 'company') {
            merged.companyQuestions = {
              ...(merged.companyQuestions || {}),
              ...data.cheatsheet.companyQuestions
            };
          } else if (mode === 'examples') {
            merged.practicalExamples = data.cheatsheet.practicalExamples;
          } else if (mode === 'best-practices') {
            merged.bestPractices = data.cheatsheet.bestPractices;
            merged.commonMistakes = data.cheatsheet.commonMistakes;
          } else if (mode === 'revision') {
            merged.revisionSheet = data.cheatsheet.revisionSheet;
          } else if (mode === 'resources') {
            merged.resources = data.cheatsheet.resources;
          }
          setCheatsheetData(merged);
        } else {
          throw new Error(data.error || 'Invalid API response');
        }
      } catch (err: any) {
        alert(`Failed to load ${tab} data: ${err.message}`);
      } finally {
        setIsLoadingTab(false);
      }
    }
  };

  // Trigger loading when selected company changes
  useEffect(() => {
    if (activeTab === 'company' && cheatsheetData) {
      handleTabChange('company');
    }
  }, [selectedCompany]);

  // Generate study guide
  const handleGenerate = async (topic: string, diffOverride?: 'Beginner' | 'Advanced') => {
    const targetTopic = topic.trim();
    if (!targetTopic) {
      alert('Please enter an interview topic');
      return;
    }

    setIsGenerating(true);
    setActiveTab('overview');
    setSidebarOpen(true);
    setSearchQuery('');
    setExpandedQAIdx(null);
    setExpandedCodeIdx(null);
    const difficulty = diffOverride || difficultyMode;

    try {
      const res = await fetch('/api/cheatsheet/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: targetTopic,
          options: { mode: 'core', difficulty }
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned status ${res.status}`);
      }
      const data = await res.json();
      if (data.success && data.cheatsheet) {
        setCheatsheetData(data.cheatsheet);
        addToHistory(targetTopic);
      } else {
        throw new Error(data.error || 'Invalid API response structure');
      }
    } catch (err: any) {
      alert(`Generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Specialized Sub-Generations
  const handleSubGenerate = async (mode: 'hr' | 'system-design' | 'eli5' | 'revision' | 'coding' | 'company', extraParam?: string) => {
    if (!cheatsheetData) return;
    setSubLoading(true);

    try {
      const res = await fetch('/api/cheatsheet/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: cheatsheetData.title,
          options: { 
            mode, 
            difficulty: difficultyMode,
            company: extraParam || targetCompany
          }
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned status ${res.status}`);
      }
      const data = await res.json();
      if (data.success && data.cheatsheet) {
        setSubModalData({
          title: data.cheatsheet.title || `${mode.toUpperCase()} Generator Output`,
          type: mode,
          content: data.cheatsheet
        });
      } else {
        throw new Error(data.error || 'Failed to fetch options data');
      }
    } catch (err: any) {
      alert(`AI Sub-generation failed: ${err.message}`);
    } finally {
      setSubLoading(false);
    }
  };

  // Save current study guide to Library
  const handleSaveToLibrary = () => {
    if (!cheatsheetData) return;
    const exists = library.find(item => item.topic.toLowerCase() === cheatsheetData.title.toLowerCase());
    if (exists) {
      alert('This topic is already saved in your Library.');
      return;
    }

    const newItem: LibraryItem = {
      id: Math.random().toString(36).substring(2, 9),
      topic: cheatsheetData.title,
      timestamp: new Date().toLocaleDateString(),
      data: cheatsheetData
    };
    saveLibraryToDisk([newItem, ...library]);
    alert('Study guide saved to your library successfully!');
  };

  // Load from library
  const handleLoadFromLibrary = (item: LibraryItem) => {
    setCheatsheetData(item.data);
    setActiveTab('overview');
    setSidebarOpen(true);
  };

  // Export PDF compilation
  const handleDownloadPdf = () => {
    if (!cheatsheetData) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const renderListToHtml = (items: string[]) => {
      if (!Array.isArray(items)) return '';
      return `
        <ul style="padding-left:20px; margin-top:8px; margin-bottom:8px; line-height:1.6; font-size:13px;">
          ${items.map(item => `<li style="margin-bottom:6px;">${item}</li>`).join('')}
        </ul>
      `;
    };

    const renderCodeToHtml = (code: string) => {
      return `
        <pre style="background-color:#0f172a; color:#f8fafc; padding:14px; border-radius:8px; font-family:monospace; font-size:11.5px; overflow-x:auto; margin-top:8px; margin-bottom:8px; white-space:pre-wrap; word-break:break-all;">${code}</pre>
      `;
    };

    const conceptsHtml = (cheatsheetData.concepts || []).map(c => `
      <div style="margin-bottom:18px;">
        <h3 style="font-size:14px; color:#4f46e5; margin:0 0 6px 0;">${c.name}</h3>
        <p style="font-size:12px; line-height:1.5; margin:0 0 4px 0;"><strong>Explanation:</strong> ${c.explanation}</p>
        <p style="font-size:11px; color:#64748b; margin:0;"><strong>Real-world:</strong> ${c.realWorldUsage}</p>
      </div>
    `).join('');

    const qaHtml = (cheatsheetData.interviewQA || []).map(qa => `
      <div style="margin-bottom:24px; border-bottom:1px solid #e2e8f0; padding-bottom:12px; page-break-inside:avoid;">
        <h3 style="font-size:13px; color:#1e293b; margin:0 0 8px 0;">Q: ${qa.question}</h3>
        <p style="font-size:12px; line-height:1.5; margin:0 0 8px 0;"><strong>A:</strong> ${qa.answer}</p>
        ${qa.example ? renderCodeToHtml(qa.example) : ''}
        <p style="font-size:11px; color:#ef4444; margin:0 0 4px 0;"><strong>Common Mistake:</strong> ${qa.commonMistakes}</p>
      </div>
    `).join('');

    const codingHtml = (cheatsheetData.codingProblems || []).map(p => `
      <div style="margin-bottom:20px; page-break-inside:avoid;">
        <h3 style="font-size:13px; color:#1e293b; margin:0 0 4px 0;">Problem: ${p.problemStatement} (${p.difficulty})</h3>
        <p style="font-size:11px; margin:4px 0;"><strong>Complexity:</strong> Time ${p.timeComplexity} | Space ${p.spaceComplexity}</p>
        <p style="font-size:11px; margin:4px 0;"><strong>Approach:</strong> ${p.expectedApproach}</p>
        ${p.optimizedSolution ? renderCodeToHtml(p.optimizedSolution) : ''}
      </div>
    `).join('');

    const resourcesHtml = `
      <div style="margin-top:10px;">
        <p style="font-size:12px;"><strong>Official Docs:</strong> <a href="${cheatsheetData.resources?.officialDoc || ''}">${cheatsheetData.resources?.officialDoc || ''}</a></p>
        <p style="font-size:12px;"><strong>Recommended Books:</strong></p>
        ${renderListToHtml(cheatsheetData.resources?.bestBooks || [])}
        <p style="font-size:12px;"><strong>GitHub Repositories:</strong></p>
        ${renderListToHtml(cheatsheetData.resources?.gitHubRepos || [])}
        <p style="font-size:12px;"><strong>Practice Platforms:</strong></p>
        ${renderListToHtml(cheatsheetData.resources?.practicePlatforms || [])}
      </div>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>${cheatsheetData.title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #334155;
              background-color: #ffffff;
              margin: 0;
              padding: 40px;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div style="max-w-4xl mx-auto;">
            <div style="border-bottom:3px solid #4f46e5; padding-bottom:12px; margin-bottom:24px;">
              <h1 style="font-size:24px; font-weight:800; color:#1e1b4b; margin:0 0 6px 0;">${cheatsheetData.title}</h1>
              <p style="font-size:13px; color:#64748b; margin:0; line-height:1.5;">${cheatsheetData.description || ''}</p>
            </div>
            
            <h2 style="font-size:16px; border-bottom:2px solid #4f46e5; padding-bottom:6px; color:#1e293b; font-weight:bold; margin-top:24px;">Topic Overview</h2>
            <p style="font-size:12px; line-height:1.6;">${cheatsheetData.overview?.introduction || ''}</p>
            
            <h2 style="font-size:16px; border-bottom:2px solid #4f46e5; padding-bottom:6px; color:#1e293b; font-weight:bold; margin-top:24px;">Must Know Concepts</h2>
            ${conceptsHtml}

            <h2 style="font-size:16px; border-bottom:2px solid #4f46e5; padding-bottom:6px; color:#1e293b; font-weight:bold; margin-top:24px; page-break-before:always;">Interview Questions & Answers</h2>
            ${qaHtml}

            <h2 style="font-size:16px; border-bottom:2px solid #4f46e5; padding-bottom:6px; color:#1e293b; font-weight:bold; margin-top:24px; page-break-before:always;">Coding Problems</h2>
            ${codingHtml}

            <h2 style="font-size:16px; border-bottom:2px solid #4f46e5; padding-bottom:6px; color:#1e293b; font-weight:bold; margin-top:24px;">Resources</h2>
            ${resourcesHtml}

            <div style="margin-top:40px; border-top:1px solid #e2e8f0; padding-top:12px; text-align:center; font-size:10px; color:#94a3b8;">
              Generated via Interview Prep Hub &copy; ${new Date().getFullYear()}
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 400);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Copy code blocks helper
  const handleCopyCode = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeId(id);
      setTimeout(() => setCopiedCodeId(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Search parameters filter helper
  const filterBySearch = (text: string) => {
    if (!searchQuery) return true;
    return (text || '').toLowerCase().includes(searchQuery.toLowerCase());
  };

  const filteredConcepts = (cheatsheetData?.concepts || []).filter(c => 
    filterBySearch(c.name) || filterBySearch(c.explanation) || filterBySearch(c.realWorldUsage)
  );

  const filteredQA = (cheatsheetData?.interviewQA || []).filter(qa => 
    filterBySearch(qa.question) || filterBySearch(qa.answer)
  );

  const filteredCoding = (cheatsheetData?.codingProblems || []).filter(p => 
    filterBySearch(p.problemStatement) || filterBySearch(p.expectedApproach)
  );

  // Loading skeleton layout for on-demand sections
  const renderTabSkeleton = () => (
    <div className="space-y-4 animate-pulse py-8">
      <div className="h-6 bg-slate-800 rounded-lg w-1/3"></div>
      <div className="h-4 bg-slate-800/60 rounded-lg w-full"></div>
      <div className="h-4 bg-slate-800/60 rounded-lg w-5/6"></div>
      <div className="h-32 bg-slate-800/40 rounded-xl w-full mt-6"></div>
    </div>
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen flex flex-col text-slate-100 pb-16 bg-[#090d16]" ref={containerRef}>
      
      {/* Header Panel */}
      <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-800 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-indigo-400" /> Interview Preparation Hub
          </h1>
          <p className="text-sm text-slate-400">Generate comprehensive, production-grade technical interview study guides, code challenges, and company-specific resources</p>
        </div>

        {/* Difficulty Selectors */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          {(['Beginner', 'Intermediate', 'Advanced'] as const).map(diff => (
            <button
              key={diff}
              onClick={() => setDifficultyMode(diff)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                difficultyMode === diff 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Navigation Tabs - 2 Tabs Only */}
      <div className="flex gap-2 border-b-2 border-slate-700 pb-px mb-8">
        <button
          onClick={() => setMainTab('guide')}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-colors border-b-2 px-6 cursor-pointer ${
            mainTab === 'guide' 
              ? 'text-purple-400 border-purple-500 font-bold' 
              : 'text-slate-550 border-transparent hover:text-slate-300'
          }`}
        >
          Active Study Guide
        </button>
        <button
          onClick={() => setMainTab('library')}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-colors border-b-2 px-6 cursor-pointer ${
            mainTab === 'library' 
              ? 'text-purple-400 border-purple-500 font-bold' 
              : 'text-slate-550 border-transparent hover:text-slate-300'
          }`}
        >
          Saved Library
        </button>
      </div>

      {mainTab === 'guide' ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left column: Controls, saved guides, history */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Topic entry panel */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4 backdrop-blur-md">
            <h3 className="text-xs font-black uppercase text-purple-400 tracking-widest flex items-center justify-center gap-2">
              <Compass className="w-4 h-4" /> Study Guide Builder
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed text-center">
              Enter any framework, concept, or tech stack (e.g. React, Spring Boot, Spring, Docker, System Design, AWS).
            </p>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleGenerate(topicInput);
              }}
              className="space-y-3"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Topic (e.g. Kubernetes, React)..."
                  value={topicInput}
                  onChange={e => setTopicInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-4 pr-10 text-xs text-white focus:outline-none focus:border-purple-500 transition placeholder-slate-600 font-semibold"
                  disabled={isGenerating}
                />
                <Sparkles className="absolute right-3.5 top-3.5 w-4 h-4 text-purple-500 animate-pulse pointer-events-none" />
              </div>
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-3 rounded-xl text-xs transition duration-200 cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-500/10"
              >
                {isGenerating ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin text-white" /> Synthesizing guide...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Generate Core Study Guide
                  </>
                )}
              </button>
            </form>
          </div>

          {/* AI Copilot Actions */}
          {cheatsheetData && (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4 backdrop-blur-md">
              <h3 className="text-xs font-black uppercase text-purple-400 tracking-widest flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" /> AI Copilot Actions
              </h3>
              <div className="space-y-2">
                <button
                  disabled={subLoading}
                  onClick={() => handleSubGenerate('hr')}
                  className="w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-950 hover:bg-slate-850 border border-slate-800/60 text-slate-300 hover:text-white transition cursor-pointer disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" /> HR / Behavioral Qs
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                </button>
                <button
                  disabled={subLoading}
                  onClick={() => handleSubGenerate('system-design')}
                  className="w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-950 hover:bg-slate-850 border border-slate-800/60 text-slate-300 hover:text-white transition cursor-pointer disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" /> System Design Scenarios
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                </button>
                <button
                  disabled={subLoading}
                  onClick={() => handleSubGenerate('eli5')}
                  className="w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-950 hover:bg-slate-850 border border-slate-800/60 text-slate-300 hover:text-white transition cursor-pointer disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <Brain className="w-3.5 h-3.5 text-pink-400" /> Explain Like I'm 5
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                </button>
                <button
                  disabled={subLoading}
                  onClick={() => handleSubGenerate('revision')}
                  className="w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-950 hover:bg-slate-850 border border-slate-800/60 text-slate-300 hover:text-white transition cursor-pointer disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-yellow-400" /> 30-Min Revision Sheet
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                </button>
                <button
                  disabled={subLoading}
                  onClick={() => handleSubGenerate('coding')}
                  className="w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-950 hover:bg-slate-850 border border-slate-800/60 text-slate-300 hover:text-white transition cursor-pointer disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <Code className="w-3.5 h-3.5 text-green-400" /> Extra Coding Problems
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                </button>
              </div>
            </div>
          )}



        </div>

        {/* Right side: Loading skeletons / Tab Contents */}
        <div className="lg:col-span-3 flex flex-col min-h-[600px] space-y-6">
          
          {isGenerating ? (
            <div className="flex-1 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-12 flex flex-col items-center justify-center space-y-6 shadow-xl backdrop-blur-md">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin"></div>
                <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-purple-400 animate-pulse" />
              </div>
              <div className="text-center space-y-2.5 max-w-md">
                <h4 className="text-lg font-bold text-white tracking-tight">Synthesizing Technical Interview Guide...</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Our AI is mapping core concepts, coding scenarios, optimized time/space complexities, best practices, and company interview matrices.
                </p>
                <div className="pt-4 flex justify-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping delay-75"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping delay-150"></span>
                </div>
              </div>
            </div>
          ) : !cheatsheetData ? (
            <div className="flex-1 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-6 shadow-xl backdrop-blur-md">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500/10 to-indigo-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 shadow-inner">
                <BookOpen className="w-10 h-10 text-purple-400" />
              </div>
              <div className="space-y-2 max-w-md">
                <h4 className="text-lg font-extrabold text-white tracking-tight">Interview Prep Hub Empty</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter an interview topic on the left (e.g. <span className="text-slate-300 font-bold">React</span>, <span className="text-slate-300 font-bold">Docker</span>, <span className="text-slate-300 font-bold">System Design</span>) to dynamically build a premium, print-ready technical interview guide.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-slate-900/40 border border-slate-800/85 rounded-3xl flex flex-col overflow-hidden shadow-xl backdrop-blur-md">
              
              {/* Document Actions & Info Header */}
              <div className="p-6 bg-slate-950/70 border-b border-slate-800/80 flex flex-col md:flex-row items-center gap-4">
                {/* Left side dummy spacer to balance the right buttons for perfect text centering */}
                <div className="hidden md:block w-32 shrink-0"></div>

                <div className="min-w-0 space-y-1.5 flex-1 flex flex-col items-center text-center">
                  <h3 className="text-xl font-black text-white tracking-tight leading-snug">{cheatsheetData.title}</h3>
                  <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">{cheatsheetData.description}</p>
                </div>
                
                {/* Download and Share row (Right Aligned) */}
                <div className="flex items-center justify-center md:justify-end gap-2 w-32 shrink-0">
                  <button
                    onClick={() => toggleFavorite(cheatsheetData.title)}
                    className="flex items-center justify-center w-9 h-9 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition duration-150 cursor-pointer"
                    title={favorites.includes(cheatsheetData.title) ? "Remove from Favorites" : "Add to Favorites"}
                  >
                    <Heart className={`w-4 h-4 ${favorites.includes(cheatsheetData.title) ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                  <button
                    onClick={handleSaveToLibrary}
                    className="flex items-center justify-center w-9 h-9 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition duration-150 cursor-pointer"
                    title="Save to Library"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    className="flex items-center justify-center w-9 h-9 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition duration-150 cursor-pointer"
                    title="Export PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sub-Generation Overlay Modal */}
              {subModalData && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-850 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden animate-fade-in">
                    
                    {/* Modal header */}
                    <div className="p-5 bg-slate-950/80 border-b border-slate-800/60 flex items-center justify-between">
                      <h4 className="font-bold text-sm text-purple-400 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" /> {subModalData.title}
                      </h4>
                      <button 
                        onClick={() => setSubModalData(null)}
                        className="text-slate-400 hover:text-white text-xs font-bold bg-slate-800 px-3 py-1 rounded-lg cursor-pointer"
                      >
                        Close
                      </button>
                    </div>

                    {/* Modal content */}
                    <div className="p-6 overflow-y-auto space-y-6">
                      
                      {/* HR Questions render */}
                      {subModalData.type === 'hr' && Array.isArray(subModalData.content?.questions) && (
                        <div className="space-y-6">
                          {subModalData.content.questions.map((q: any, idx: number) => (
                            <div key={idx} className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/40 space-y-2">
                              <h5 className="font-bold text-xs text-white">Q: {q.question} <span className="text-[10px] text-purple-400">({q.difficulty || ''})</span></h5>
                              <p className="text-xs text-slate-300 leading-relaxed"><strong>STAR Strategy:</strong> {q.answer}</p>
                              {q.commonMistakes && <p className="text-[11px] text-red-400 font-semibold">⚠️ Mistake to Avoid: {q.commonMistakes}</p>}
                              {q.followUp && q.followUp.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1.5">
                                  {q.followUp.map((f: string) => (
                                    <span key={f} className="px-2 py-0.5 rounded bg-slate-900 text-[10px] text-slate-500 font-bold border border-slate-800">{f}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* System Design render */}
                      {subModalData.type === 'system-design' && Array.isArray(subModalData.content?.scenarios) && (
                        <div className="space-y-6">
                          {subModalData.content.scenarios.map((s: any, idx: number) => (
                            <div key={idx} className="bg-slate-950/40 p-5 rounded-xl border border-slate-800/40 space-y-3">
                              <h5 className="font-bold text-xs text-white uppercase tracking-wider text-indigo-400">{s.title}</h5>
                              <p className="text-xs text-slate-400 leading-relaxed"><strong>Challenge:</strong> {s.problem}</p>
                              <p className="text-xs text-slate-300 leading-relaxed"><strong>Proposal:</strong> {s.solution}</p>
                              {s.keyComponents && s.keyComponents.length > 0 && (
                                <div className="space-y-1">
                                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Key Components:</span>
                                  <ul className="list-disc pl-5 text-xs text-slate-400 space-y-0.5">
                                    {s.keyComponents.map((c: string) => <li key={c}>{c}</li>)}
                                  </ul>
                                </div>
                              )}
                              {s.tradeOffs && s.tradeOffs.length > 0 && (
                                <div className="space-y-1 pt-1 border-t border-slate-800/40">
                                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Trade-offs & Considerations:</span>
                                  <ul className="list-disc pl-5 text-xs text-slate-400 space-y-0.5">
                                    {s.tradeOffs.map((t: string) => <li key={t}>{t}</li>)}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* ELI5 render */}
                      {subModalData.type === 'eli5' && (
                        <div className="space-y-6">
                          <div className="bg-pink-500/5 border border-pink-500/10 p-5 rounded-xl space-y-3">
                            <h5 className="font-bold text-xs text-pink-400 tracking-widest uppercase">Summary Overview</h5>
                            <p className="text-xs text-slate-350 leading-relaxed">{subModalData.content?.explanation || ''}</p>
                          </div>
                          {Array.isArray(subModalData.content?.analogies) && (
                            <div className="space-y-4">
                              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Concepts Explained Simply:</span>
                              {subModalData.content.analogies.map((item: any, idx: number) => (
                                <div key={idx} className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-1.5">
                                  <span className="font-bold text-xs text-white">{item.concept}</span>
                                  <p className="text-xs text-slate-400 leading-relaxed italic">"{item.analogy}"</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Revision render */}
                      {subModalData.type === 'revision' && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Keywords</span>
                              <div className="flex flex-wrap gap-1.5">
                                {subModalData.content?.keywords?.map((k: string) => (
                                  <span key={k} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300">{k}</span>
                                ))}
                              </div>
                            </div>
                            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Apis / Commands</span>
                              <ul className="list-disc pl-5 text-xs text-slate-400 space-y-1">
                                {subModalData.content?.importantAPIsOrCommands?.map((c: string) => <li key={c}>{c}</li>)}
                              </ul>
                            </div>
                          </div>
                          {subModalData.content?.formulasOrPatterns && (
                            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Formulas & Core Patterns</span>
                              <ul className="list-disc pl-5 text-xs text-slate-400 space-y-1">
                                {subModalData.content.formulasOrPatterns.map((f: string) => <li key={f}>{f}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Coding problems render */}
                      {subModalData.type === 'coding' && Array.isArray(subModalData.content?.codingProblems) && (
                        <div className="space-y-6">
                          {subModalData.content.codingProblems.map((prob: any, idx: number) => (
                            <div key={idx} className="bg-slate-950/40 p-5 rounded-xl border border-slate-800/40 space-y-4">
                              <div className="flex items-center justify-between">
                                <h5 className="font-bold text-sm text-white">{prob.title}</h5>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  prob.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                  prob.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                  'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                  {prob.difficulty}
                                </span>
                              </div>
                              <p className="text-xs text-slate-350 leading-relaxed">{prob.description}</p>
                              
                              {prob.starterCode && (
                                <div className="space-y-1">
                                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Starter Code</span>
                                  <pre className="p-3 bg-slate-950 rounded-lg text-[11px] font-mono text-indigo-350 border border-slate-900 overflow-x-auto">
                                    <code>{prob.starterCode}</code>
                                  </pre>
                                </div>
                              )}

                              {prob.solution && (
                                <div className="space-y-1">
                                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Optimal Solution</span>
                                  <pre className="p-3 bg-slate-950 rounded-lg text-[11px] font-mono text-emerald-400 border border-slate-900 overflow-x-auto">
                                    <code>{prob.solution}</code>
                                  </pre>
                                </div>
                              )}
                              
                              {prob.explanation && (
                                <div className="text-xs text-slate-400 leading-relaxed bg-slate-950/20 p-3 rounded-lg border border-slate-900/40">
                                  <strong>Approach / Walkthrough:</strong> {prob.explanation}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              )}

              {/* Sub-loading indicator */}
              {subLoading && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <div className="bg-slate-900 border border-slate-850 p-6 rounded-xl flex items-center gap-3 shadow-xl text-slate-100">
                    <RotateCw className="w-5 h-5 text-purple-500 animate-spin" />
                    <span className="text-xs font-bold">AI is parsing sub-guide query...</span>
                  </div>
                </div>
              )}

              {/* Split List & Detail Layout */}
              <div className="flex-1 flex overflow-hidden min-h-0">
                {/* Left Column: Sections List */}
                <div className={`flex flex-col border-[#232d3f] transition-all duration-300 ${
                  sidebarOpen ? 'w-full md:w-80 border-r shrink-0' : 'w-0 border-0 overflow-hidden opacity-0'
                }`}>
                  <div className="flex-1 overflow-y-auto p-5 scroll-smooth">
                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4 backdrop-blur-md">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase text-purple-400 tracking-widest flex items-center gap-2">
                          <Layers className="w-4 h-4" /> Navigation tree
                        </h3>
                        <button
                          onClick={() => setSidebarOpen(false)}
                          className="p-1.5 bg-[#1b2535]/40 border border-[#232d3f] rounded-xl text-slate-400 hover:text-white transition cursor-pointer flex items-center justify-center"
                          title="Collapse Sidebar"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {[
                          { id: 'overview', label: 'Overview' },
                          { id: 'concepts', label: 'Core Concepts' },
                          { id: 'qa', label: 'Interview Q&A' },
                          { id: 'coding', label: 'Coding Problems' },
                          { id: 'company', label: 'Company Questions' },
                          { id: 'examples', label: 'Practical Examples' },
                          { id: 'best-practices', label: 'Best Practices' },
                          { id: 'revision', label: 'Revision Sheet' },
                          { id: 'resources', label: 'Resources' }
                        ].map(item => {
                          const isSelected = activeTab === item.id && sidebarOpen;

                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                setActiveTab(item.id as any);
                                setSidebarOpen(true);
                                // Trigger load if needed
                                const tabKeys: Record<string, string> = {
                                  overview: 'overview',
                                  concepts: 'concepts',
                                  qa: 'qa',
                                  coding: 'coding',
                                  company: 'company',
                                  examples: 'examples',
                                  'best-practices': 'best-practices',
                                  revision: 'revision',
                                  resources: 'resources'
                                };
                                const dataKey = tabKeys[item.id];
                                if (dataKey) {
                                  const hasData = cheatsheetData && cheatsheetData[dataKey as keyof typeof cheatsheetData];
                                  if (!hasData) {
                                    handleTabChange(dataKey as any);
                                  }
                                }
                              }}
                              className={`w-full flex items-center gap-2 text-left px-3.5 py-2 rounded-xl text-xs font-bold transition duration-150 cursor-pointer ${
                                isSelected 
                                  ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-400' 
                                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
                              }`}
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Active Section Details Panel */}
                <div className="flex-1 flex flex-col bg-[#131a26]/20 overflow-hidden">
                  {/* Detail Panel Header */}
                  <div className="p-4 border-b border-[#232d3f] bg-[#131a26]/40 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                      {!sidebarOpen && (
                        <button
                          onClick={() => setSidebarOpen(true)}
                          className="p-1.5 bg-[#1b2535]/40 border border-[#232d3f] rounded-xl text-slate-400 hover:text-white transition cursor-pointer flex items-center justify-center mr-1"
                          title="Expand Sidebar"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                        {(() => {
                          const iconsMap: Record<string, React.ComponentType<any>> = {
                            overview: BookOpen,
                            concepts: Layers,
                            qa: Brain,
                            coding: Code,
                            company: Compass,
                            examples: Terminal,
                            'best-practices': Star,
                            revision: FileText,
                            resources: BookmarkCheck
                          };
                          const SelectedIcon = iconsMap[activeTab] || BookOpen;
                          return <SelectedIcon className="w-4 h-4 text-indigo-400" />;
                        })()}
                        <span className="text-xs font-black uppercase text-white tracking-widest">
                          {(() => {
                            const labelsMap: Record<string, string> = {
                              overview: 'Overview',
                              concepts: 'Core Concepts',
                              qa: 'Interview Q&A',
                              coding: 'Coding Problems',
                              company: 'Company Questions',
                              examples: 'Practical Examples',
                              'best-practices': 'Best Practices',
                              revision: 'Revision Sheet',
                              resources: 'Resources'
                            };
                            return labelsMap[activeTab] || 'Section Details';
                          })()}
                        </span>
                      </div>
                    </div>

                    {/* Detail Panel Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-[#131a26]/30">
                      {isLoadingTab ? (
                        renderTabSkeleton()
                      ) : (
                        <>
                          {/* 1. OVERVIEW TAB */}
                          {activeTab === 'overview' && (
                      <div className="space-y-6 animate-fade-in">
                        
                        {/* Intro card */}
                        <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6 space-y-2">
                          <div className="space-y-2">
                            <h4 className="text-base font-bold text-white tracking-tight">Introduction</h4>
                            <p className="text-xs text-slate-300 leading-relaxed">{cheatsheetData.overview?.introduction || ''}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6 space-y-2">
                            <h4 className="text-xs font-black uppercase text-purple-400 tracking-wider">Why it matters in interviews</h4>
                            <p className="text-xs text-slate-355 leading-relaxed">{cheatsheetData.overview?.whyMatters || ''}</p>
                          </div>
                          <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6 space-y-2">
                            <h4 className="text-xs font-black uppercase text-purple-400 tracking-wider">Industry applications</h4>
                            <p className="text-xs text-slate-355 leading-relaxed">{cheatsheetData.overview?.industryUsage || ''}</p>
                          </div>
                        </div>

                        {/* Related topics path */}
                        <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6 space-y-3">
                          <h4 className="text-xs font-black uppercase text-purple-400 tracking-wider">Recommended learning path</h4>
                          <div className="flex flex-wrap items-center gap-2">
                            {(cheatsheetData.relatedTopics || []).map((topic, index) => (
                              <React.Fragment key={topic}>
                                {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-650" />}
                                <span 
                                  onClick={() => { setTopicInput(topic); handleGenerate(topic); }}
                                  className="px-3 py-1.5 rounded-full bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 cursor-pointer transition"
                                >
                                  {topic}
                                </span>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>

                      </div>
                    )}

                    {/* 2. CONCEPTS TAB */}
                    {activeTab === 'concepts' && (
                      <div className="space-y-6 animate-fade-in">
                        {filteredConcepts.length === 0 ? (
                          <p className="text-xs text-slate-500 py-6 text-center">No concepts match your search query.</p>
                        ) : (
                          <div className="space-y-4">
                            {filteredConcepts.map((concept, idx) => (
                              <div key={idx} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition">
                                <h4 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2.5">
                                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                  {concept.name}
                                </h4>
                                <p className="text-xs text-slate-300 leading-relaxed">{concept.explanation}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800/40">
                                  <div className="space-y-0.5">
                                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Real-world usage</span>
                                    <p className="text-xs text-slate-400 leading-normal">{concept.realWorldUsage}</p>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Interview strategy</span>
                                    <p className="text-xs text-slate-400 leading-normal">{concept.interviewPoints}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. INTERVIEW Q&A TAB */}
                    {activeTab === 'qa' && (
                      <div className="space-y-4 animate-fade-in">
                        {filteredQA.length === 0 ? (
                          <div className="py-12 text-center space-y-3">
                            <p className="text-xs text-slate-500">Interview Q&A is not loaded for this topic yet.</p>
                            <button
                              onClick={() => handleTabChange('qa', true)}
                              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition cursor-pointer"
                            >
                              Load Q&A via AI
                            </button>
                          </div>
                        ) : (
                          filteredQA.map((qa, idx) => {
                            const isExpanded = expandedQAIdx === idx;
                            return (
                              <div 
                                key={idx} 
                                className="bg-slate-950/40 border border-slate-800 rounded-2xl overflow-hidden transition"
                              >
                                <button
                                  onClick={() => setExpandedQAIdx(isExpanded ? null : idx)}
                                  className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-slate-950 transition"
                                >
                                  <div className="space-y-1 pr-4">
                                    <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                      qa.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                      qa.difficulty === 'Hard' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                      'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                    }`}>
                                      {qa.difficulty}
                                    </span>
                                    <h4 className="text-xs md:text-sm font-extrabold text-white leading-snug">Q: {qa.question}</h4>
                                  </div>
                                  <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`} />
                                </button>

                                {isExpanded && (
                                  <div className="p-5 border-t border-slate-800 bg-slate-950/60 space-y-4">
                                    <div className="space-y-1.5">
                                      <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Detailed Answer</span>
                                      <p className="text-xs text-slate-350 leading-relaxed whitespace-pre-wrap">{qa.answer}</p>
                                    </div>

                                    {qa.example && (
                                      <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                          <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                                            <Code className="w-3.5 h-3.5 text-indigo-400" /> Implementation Example
                                          </span>
                                          <button
                                            onClick={() => handleCopyCode(`qa-${idx}`, qa.example)}
                                            className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-2 py-1 rounded"
                                          >
                                            {copiedCodeId === `qa-${idx}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                            Copy
                                          </button>
                                        </div>
                                        <pre className="bg-slate-955 text-slate-300 p-4 rounded-xl border border-slate-800/80 font-mono text-[10.5px] overflow-x-auto whitespace-pre">
                                          {qa.example}
                                        </pre>
                                      </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800/40">
                                      <div className="space-y-1">
                                        <span className="text-[9px] font-black uppercase text-red-400 tracking-wider flex items-center gap-1">
                                          <AlertTriangle className="w-3 h-3 text-red-500" /> Common Mistakes
                                        </span>
                                        <p className="text-xs text-slate-400 leading-normal">{qa.commonMistakes}</p>
                                      </div>
                                      <div className="space-y-1">
                                        <span className="text-[9px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1">
                                          <RefreshCw className="w-3 h-3 text-indigo-400" /> Follow-up Topics
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                          {(qa.followUp || []).map(follow => (
                                            <span key={follow} className="px-2 py-0.5 rounded bg-slate-900 text-[10px] text-slate-400 font-bold border border-slate-800/50">{follow}</span>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* 4. CODING PROBLEMS TAB */}
                    {activeTab === 'coding' && (
                      <div className="space-y-6 animate-fade-in">
                        {filteredCoding.length === 0 ? (
                          <div className="py-12 text-center space-y-3">
                            <p className="text-xs text-slate-500">Coding challenges are not loaded for this topic yet.</p>
                            <button
                              onClick={() => handleTabChange('coding', true)}
                              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition cursor-pointer"
                            >
                              Load Challenges via AI
                            </button>
                          </div>
                        ) : (
                          filteredCoding.map((problem, idx) => {
                            const isExpanded = expandedCodeIdx === idx;
                            return (
                              <div 
                                key={idx} 
                                className="bg-slate-950/40 border border-slate-800 rounded-2xl overflow-hidden"
                              >
                                <button
                                  onClick={() => setExpandedCodeIdx(isExpanded ? null : idx)}
                                  className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-slate-955 transition"
                                >
                                  <div className="space-y-1 pr-4">
                                    <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                      problem.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                      problem.difficulty === 'Hard' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                      'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                    }`}>
                                      {problem.difficulty}
                                    </span>
                                    <h4 className="text-xs md:text-sm font-extrabold text-white leading-snug">Problem: {problem.problemStatement}</h4>
                                  </div>
                                  <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`} />
                                </button>

                                {isExpanded && (
                                  <div className="p-5 border-t border-slate-800 bg-slate-950/60 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-1">
                                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Expected Approach</span>
                                        <p className="text-xs text-slate-355 leading-relaxed">{problem.expectedApproach}</p>
                                      </div>
                                      <div className="space-y-1 flex flex-col justify-center">
                                        <div className="flex gap-4">
                                          <div>
                                            <span className="text-[9px] font-black uppercase text-indigo-400 tracking-wider">Time Complexity</span>
                                            <p className="text-xs text-white font-mono">{problem.timeComplexity}</p>
                                          </div>
                                          <div>
                                            <span className="text-[9px] font-black uppercase text-indigo-400 tracking-wider">Space Complexity</span>
                                            <p className="text-xs text-white font-mono">{problem.spaceComplexity}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                                          <Terminal className="w-3.5 h-3.5 text-green-400" /> Optimized Solution
                                        </span>
                                        <button
                                          onClick={() => handleCopyCode(`code-${idx}`, problem.optimizedSolution)}
                                          className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-2 py-1 rounded"
                                        >
                                          {copiedCodeId === `code-${idx}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                          Copy
                                        </button>
                                      </div>
                                      <pre className="bg-slate-955 text-slate-300 p-4 rounded-xl border border-slate-800/80 font-mono text-[10.5px] overflow-x-auto whitespace-pre">
                                        {problem.optimizedSolution}
                                      </pre>
                                    </div>

                                    <div className="p-3 bg-red-955/25 border border-red-900/35 rounded-xl space-y-1">
                                      <span className="text-[9px] font-black uppercase text-red-400 tracking-wider flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> Common Coding Pitfalls
                                      </span>
                                      <p className="text-xs text-slate-400 leading-normal">{problem.commonMistakes}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* 5. COMPANY QUESTIONS TAB */}
                    {activeTab === 'company' && (
                      <div className="space-y-6 animate-fade-in">
                        <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6 space-y-4">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800/60 pb-3 gap-2">
                            <span className="text-xs font-black uppercase text-purple-400 tracking-widest">Select target company:</span>
                            <div className="flex flex-wrap items-center gap-2">
                              <select 
                                value={selectedCompany} 
                                onChange={(e) => setSelectedCompany(e.target.value)}
                                className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500 font-bold text-slate-100 cursor-pointer"
                              >
                                {['Google', 'Amazon', 'Microsoft', 'Meta', 'Netflix', 'Apple', 'Uber', 'Atlassian', 'Walmart', 'Goldman Sachs', 'Oracle', 'PayPal', 'Flipkart', 'Meesho', 'Custom...'].map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>

                              {selectedCompany === 'Custom...' && (
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="text"
                                    value={customCompanyInput}
                                    onChange={(e) => setCustomCompanyInput(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleTabChange('company');
                                      }
                                    }}
                                    placeholder="Type company..."
                                    className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500 font-bold text-slate-100 w-36"
                                  />
                                  <button
                                    onClick={() => handleTabChange('company')}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-black transition cursor-pointer"
                                  >
                                    Go
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <Layers className="w-4 h-4 text-purple-400 animate-pulse" /> Commonly Asked in {targetCompany} Interviews
                              </h4>
                            </div>

                            {cheatsheetData.companyQuestions && cheatsheetData.companyQuestions[targetCompany] ? (
                              <ul className="space-y-2.5 pl-4 list-disc text-xs text-slate-350">
                                {cheatsheetData.companyQuestions[targetCompany].map((q, idx) => (
                                  <li key={idx} className="leading-relaxed">{q}</li>
                                ))}
                              </ul>
                            ) : (
                              <div className="py-8 text-center space-y-3">
                                <p className="text-xs text-slate-500">Company-specific questions are not loaded yet.</p>
                                <button
                                  onClick={() => handleTabChange('company', true)}
                                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition cursor-pointer"
                                >
                                  Query AI for {targetCompany}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 6. PRACTICAL EXAMPLES TAB */}
                    {activeTab === 'examples' && (
                      <div className="space-y-6 animate-fade-in">
                        {!cheatsheetData.practicalExamples || cheatsheetData.practicalExamples.length === 0 ? (
                          <div className="py-12 text-center space-y-3">
                            <p className="text-xs text-slate-500">Practical examples are not loaded for this topic yet.</p>
                            <button
                              onClick={() => handleTabChange('examples', true)}
                              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition cursor-pointer"
                            >
                              Load Examples via AI
                            </button>
                          </div>
                        ) : (
                          (cheatsheetData.practicalExamples || []).map((example, idx) => (
                            <div key={idx} className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6 space-y-4">
                              <div className="space-y-1 border-b border-slate-800/60 pb-3">
                                <h4 className="text-sm font-extrabold text-white tracking-tight uppercase text-indigo-400">{example.title}</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">{example.description}</p>
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                                    <Code className="w-3.5 h-3.5 text-indigo-400" /> Implementation snippet
                                  </span>
                                  <button
                                    onClick={() => handleCopyCode(`example-${idx}`, example.code)}
                                    className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-2.5 py-1 rounded"
                                  >
                                    {copiedCodeId === `example-${idx}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                    Copy Code
                                  </button>
                                </div>
                                <pre className="bg-slate-955 text-slate-355 p-5 rounded-2xl border border-slate-800/80 font-mono text-[10.5px] overflow-x-auto whitespace-pre">
                                  {example.code}
                                </pre>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* 7. BEST PRACTICES TAB */}
                    {activeTab === 'best-practices' && (
                      <div className="space-y-6 animate-fade-in">
                        {!cheatsheetData.bestPractices || cheatsheetData.bestPractices.length === 0 ? (
                          <div className="py-12 text-center space-y-3">
                            <p className="text-xs text-slate-500">Best practices are not loaded for this topic yet.</p>
                            <button
                              onClick={() => handleTabChange('best-practices', true)}
                              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition cursor-pointer"
                            >
                              Load Best Practices via AI
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {(cheatsheetData.bestPractices || []).map((bp, idx) => (
                                <div key={idx} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-[9px] font-black uppercase text-indigo-400 tracking-wider">
                                      {bp.category}
                                    </span>
                                  </div>
                                  <h5 className="font-extrabold text-xs text-white">{bp.tip}</h5>
                                  <p className="text-xs text-slate-400 leading-normal">{bp.details}</p>
                                </div>
                              ))}
                            </div>

                            {/* Common mistakes sub-box */}
                            <div className="bg-red-955/15 border border-red-900/35 rounded-3xl p-6 space-y-4">
                              <h4 className="text-sm font-extrabold text-red-400 tracking-tight flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-500" /> Critical Interview Pitfalls to Avoid
                              </h4>
                              <div className="space-y-4 divide-y divide-slate-800/50">
                                {(cheatsheetData.commonMistakes || []).map((m, idx) => (
                                  <div key={idx} className={`space-y-1.5 ${idx > 0 ? 'pt-4' : ''}`}>
                                    <span className="font-bold text-xs text-white">{m.mistake}</span>
                                    <p className="text-xs text-slate-400 leading-normal"><strong>Why it is wrong:</strong> {m.whyWrong}</p>
                                    <p className="text-xs text-green-400 font-semibold"><strong>How to avoid:</strong> {m.howToAvoid}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* 8. REVISION TAB */}
                    {activeTab === 'revision' && (
                      <div className="space-y-6 animate-fade-in">
                        {!cheatsheetData.revisionSheet || !cheatsheetData.revisionSheet.definitions ? (
                          <div className="py-12 text-center space-y-3">
                            <p className="text-xs text-slate-500">Revision sheet is not loaded for this topic yet.</p>
                            <button
                              onClick={() => handleTabChange('revision', true)}
                              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition cursor-pointer"
                            >
                              Load Revision Sheet via AI
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              
                              {/* Keyword quick definition dictionary */}
                              <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6 space-y-3">
                                <h4 className="text-xs font-black uppercase text-purple-400 tracking-wider">Term Dictionary</h4>
                                <div className="space-y-3">
                                  {Object.entries(cheatsheetData.revisionSheet?.definitions || {}).map(([word, def]) => (
                                    <div key={word} className="space-y-0.5">
                                      <span className="font-extrabold text-xs text-white">{word}</span>
                                      <p className="text-xs text-slate-450 leading-normal">{def}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Commands and APIs */}
                              <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6 space-y-4">
                                <div className="space-y-3">
                                  <h4 className="text-xs font-black uppercase text-purple-400 tracking-wider">Quick keywords</h4>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(cheatsheetData.revisionSheet?.keywords || []).map(word => (
                                      <span key={word} className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300">
                                        {word}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {cheatsheetData.revisionSheet?.importantAPIsOrCommands && cheatsheetData.revisionSheet.importantAPIsOrCommands.length > 0 && (
                                  <div className="space-y-2 pt-2 border-t border-slate-800/50">
                                    <h4 className="text-xs font-black uppercase text-purple-400 tracking-wider">Important APIs or Commands</h4>
                                    <ul className="list-disc pl-5 text-xs text-slate-400 space-y-1">
                                      {cheatsheetData.revisionSheet.importantAPIsOrCommands.map(api => <li key={api}>{api}</li>)}
                                    </ul>
                                  </div>
                                )}
                              </div>

                            </div>

                            {/* Short notes */}
                            {cheatsheetData.revisionSheet?.shortNotes && cheatsheetData.revisionSheet.shortNotes.length > 0 && (
                              <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6 space-y-3">
                                <h4 className="text-xs font-black uppercase text-purple-400 tracking-wider">Short notes & last-minute review</h4>
                                <ul className="list-disc pl-5 text-xs text-slate-350 space-y-1.5">
                                  {cheatsheetData.revisionSheet.shortNotes.map((note, idx) => <li key={idx}>{note}</li>)}
                                </ul>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* 9. RESOURCES TAB */}
                    {activeTab === 'resources' && (
                      <div className="space-y-6 animate-fade-in">
                        {!cheatsheetData.resources || !cheatsheetData.resources.officialDoc ? (
                          <div className="py-12 text-center space-y-3">
                            <p className="text-xs text-slate-500">Reference resources are not loaded for this topic yet.</p>
                            <button
                              onClick={() => handleTabChange('resources', true)}
                              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition cursor-pointer"
                            >
                              Load Resources via AI
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Documentations and books */}
                            <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6 space-y-4">
                              <h4 className="text-xs font-black uppercase text-purple-400 tracking-wider">Reference Publications</h4>
                              <div className="space-y-3">
                                <div>
                                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3 text-slate-400" /> Official documentation
                                  </span>
                                  {cheatsheetData.resources?.officialDoc ? (
                                    <a href={cheatsheetData.resources.officialDoc} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1.5 mt-1">
                                      {cheatsheetData.resources.officialDoc} <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ) : (
                                    <p className="text-xs text-slate-500 italic">No link available.</p>
                                  )}
                                </div>
                                
                                <div className="space-y-1 pt-1.5 border-t border-slate-800/40">
                                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Recommended Books</span>
                                  <ul className="list-disc pl-5 text-xs text-slate-400 space-y-1">
                                    {(cheatsheetData.resources?.bestBooks || []).map(book => <li key={book}>{book}</li>)}
                                  </ul>
                                </div>
                              </div>
                            </div>

                            {/* Repos, articles, and platforms */}
                            <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6 space-y-4">
                              <h4 className="text-xs font-black uppercase text-purple-400 tracking-wider flex items-center gap-1">
                                <Code className="w-3.5 h-3.5 text-purple-400" /> GitHub & Practice Repositories
                              </h4>
                              
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">GitHub repositories</span>
                                  <ul className="list-disc pl-5 text-xs text-slate-400 space-y-1">
                                    {(cheatsheetData.resources?.gitHubRepos || []).map(repo => <li key={repo}>{repo}</li>)}
                                  </ul>
                                </div>

                                <div className="space-y-1 pt-1.5 border-t border-slate-800/40">
                                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Practice Platforms</span>
                                  <ul className="list-disc pl-5 text-xs text-slate-400 space-y-1">
                                    {(cheatsheetData.resources?.practicePlatforms || []).map(platform => <li key={platform}>{platform}</li>)}
                                  </ul>
                                </div>
                              </div>
                            </div>

                          </div>
                        )}
                      </div>
                    )}
                        </>
                      )}
                    </div>
                  </div>
              </div>
            </div>
          )}
        </div>
      </div>
      ) : (
        // Library Matrix full-width view
        <div className="space-y-6 animate-fade-in">
          {/* Filter Selector - Underline style tabs above the box */}
          <div className="border-b border-slate-800/65 pb-px">
            <div className="flex gap-2 -mb-px">
              <button
                onClick={() => setLibraryFilter('saved')}
                className={`pb-3 text-xs font-black uppercase tracking-wider transition-colors border-b-2 px-4 cursor-pointer ${
                  libraryFilter === 'saved'
                    ? 'text-purple-400 border-purple-500 font-bold'
                    : 'text-slate-550 border-transparent hover:text-slate-300'
                }`}
              >
                Saved Guides
              </button>
              <button
                onClick={() => setLibraryFilter('favorites')}
                className={`pb-3 text-xs font-black uppercase tracking-wider transition-colors border-b-2 px-4 cursor-pointer ${
                  libraryFilter === 'favorites'
                    ? 'text-purple-400 border-purple-500 font-bold'
                    : 'text-slate-550 border-transparent hover:text-slate-300'
                }`}
              >
                Favorite Topics
              </button>
            </div>
          </div>

          {/* Main library container box */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 shadow-xl backdrop-blur-md space-y-6">
            
            {/* Filtered Content */}
            {libraryFilter === 'saved' ? (
              <div className="space-y-4">
                {library.length === 0 ? (
                  <div className="py-16 text-center flex flex-col items-center justify-center space-y-3">
                    <BookOpen className="w-8 h-8 text-slate-600" />
                    <h5 className="text-sm font-bold text-slate-400">No saved study guides yet</h5>
                    <p className="text-xs text-slate-500 max-w-sm">Generate a study guide on the Active Study Guide tab and save it to your library to access it here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {library.map(item => (
                      <div key={item.id} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition duration-150 shadow-md">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-bold text-indigo-400">
                              {item.data.overview?.difficulty || 'Intermediate'}
                            </span>
                            <span className="text-[10px] text-slate-550 font-semibold">{item.timestamp}</span>
                          </div>
                          <h4 className="text-base font-black text-white leading-tight tracking-tight pt-1">{item.topic}</h4>
                          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{item.data.description || 'Comprehensive technical interview guide.'}</p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-900/60">
                          <button
                            onClick={() => handleLoadFromLibrary(item)}
                            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition cursor-pointer shadow-sm shadow-purple-500/5 flex items-center gap-1"
                          >
                            <BookOpen className="w-3.5 h-3.5" /> Read Study Guide
                          </button>
                          <button
                            onClick={() => {
                              const updated = library.filter(x => x.id !== item.id);
                              saveLibraryToDisk(updated);
                            }}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-red-500/10 border border-slate-800 text-slate-550 hover:text-red-400 transition cursor-pointer"
                            title="Delete Guide"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {favorites.length === 0 ? (
                  <div className="py-16 text-center flex flex-col items-center justify-center space-y-3">
                    <Heart className="w-8 h-8 text-slate-600" />
                    <h5 className="text-sm font-bold text-slate-400">No favorite topics yet</h5>
                    <p className="text-xs text-slate-500 max-w-sm">Add topics to your favorites list inside any active study guide header to see them here.</p>
                  </div>
                ) : (
                  <div className="bg-slate-950/20 border border-slate-850 rounded-2xl p-6 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {favorites.map(fav => (
                        <button
                          key={fav}
                          onClick={() => { setTopicInput(fav); handleGenerate(fav); }}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-xs font-bold text-purple-400 hover:text-purple-300 transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          <span>{fav}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Side-by-Side Comparison Matrix Section */}
          {library.length >= 2 && (
            <div className="space-y-6 pt-8 border-t border-slate-800/80">
              <div>
                <h3 className="text-lg font-black uppercase text-indigo-400 tracking-wider">Side-by-Side Comparison Matrix</h3>
                <p className="text-xs text-slate-450">Compare difficulties, core concepts, and focus areas across your saved guides</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/30 p-4 rounded-2xl border border-slate-850">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-purple-400 tracking-wider">Select Topic A:</label>
                  <select
                    value={compareA?.id || ''}
                    onChange={(e) => {
                      const found = library.find(x => x.id === e.target.value);
                      if (found) setCompareA(found);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-bold"
                  >
                    {library.map(item => (
                      <option key={item.id} value={item.id}>{item.topic}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-purple-400 tracking-wider">Select Topic B:</label>
                  <select
                    value={compareB?.id || ''}
                    onChange={(e) => {
                      const found = library.find(x => x.id === e.target.value);
                      if (found) setCompareB(found);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-bold"
                  >
                    {library.map(item => (
                      <option key={item.id} value={item.id}>{item.topic}</option>
                    ))}
                  </select>
                </div>
              </div>

              {compareA && compareB && (
                <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-xl bg-slate-950/20">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950/80 border-b border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        <th className="p-4 w-1/4">Comparison Metric</th>
                        <th className="p-4 w-3/8 text-purple-400">{compareA.topic}</th>
                        <th className="p-4 w-3/8 text-indigo-400">{compareB.topic}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60">
                      <tr>
                        <td className="p-4 font-bold text-slate-300 bg-slate-955/10">Estimated Reading Time</td>
                        <td className="p-4 text-slate-350">{compareA.data.overview?.readingTime || '10 mins'}</td>
                        <td className="p-4 text-slate-350">{compareB.data.overview?.readingTime || '10 mins'}</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-bold text-slate-300 bg-slate-955/10">Difficulty Level</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400">
                            {compareA.data.overview?.difficulty || 'Intermediate'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400">
                            {compareB.data.overview?.difficulty || 'Intermediate'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-4 font-bold text-slate-300 bg-slate-955/10">Industry Application</td>
                        <td className="p-4 text-slate-350 leading-relaxed">{compareA.data.overview?.industryUsage || 'Web / Backend Applications'}</td>
                        <td className="p-4 text-slate-350 leading-relaxed">{compareB.data.overview?.industryUsage || 'Web / Backend Applications'}</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-bold text-slate-300 bg-slate-955/10">Primary Core Concepts</td>
                        <td className="p-4 text-slate-355 leading-relaxed">
                          {(compareA.data.concepts || []).slice(0, 3).map(c => c.name).join(', ')}
                        </td>
                        <td className="p-4 text-slate-355 leading-relaxed">
                          {(compareB.data.concepts || []).slice(0, 3).map(c => c.name).join(', ')}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-4 font-bold text-slate-300 bg-slate-955/10">Interview Questions</td>
                        <td className="p-4 text-slate-350">{(compareA.data.interviewQA || []).length || 8} Q&A items</td>
                        <td className="p-4 text-slate-350">{(compareB.data.interviewQA || []).length || 8} Q&A items</td>
                      </tr>
                      <tr className="bg-slate-950/5">
                        <td className="p-4 font-bold text-slate-300">Quick Actions</td>
                        <td className="p-4">
                          <button
                            onClick={() => handleLoadFromLibrary(compareA)}
                            className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600 border border-purple-500/25 text-purple-400 hover:text-white text-[11px] font-bold transition cursor-pointer"
                          >
                            Load Guide
                          </button>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleLoadFromLibrary(compareB)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/25 text-indigo-400 hover:text-white text-[11px] font-bold transition cursor-pointer"
                          >
                            Load Guide
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};
