import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Monitor, Layout, Download, Palette, RefreshCw, CheckCircle, Trash2, Eye, EyeOff, Edit, PlusCircle, X, Globe } from 'lucide-react';

export interface PortfolioSection {
  id: string;
  title: string;
  type: 'about' | 'skills' | 'projects' | 'companies' | 'connect' | 'custom';
  content: string;
  visible: boolean;
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

  const [sections, setSections] = useState<PortfolioSection[]>([
    { id: 'about', title: 'About Me', type: 'about', content: '', visible: true },
    { id: 'skills', title: 'Technical Stack', type: 'skills', content: '', visible: true },
    { id: 'projects', title: 'Recent Projects', type: 'projects', content: JSON.stringify([
      { title: 'Scalable Scraping Coordinator', description: 'Engineered a robust, concurrent worker fleet managing multi-stage company scrapers and failure circuit breakers.' },
      { title: 'Pipeline Dashboard Manager', description: 'Built a responsive Kanban board tracking recruitment statuses with dynamic search indices and data exports.' }
    ], null, 2), visible: true },
    { id: 'companies', title: 'Target Companies', type: 'companies', content: '', visible: true },
    { id: 'connect', title: 'Connect With Me', type: 'connect', content: '', visible: true }
  ]);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

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
      alert(`Portfolio generation failed: ${err.message}`);
    }
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/profile-builder/publish-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: htmlCode })
      });
      if (!res.ok) throw new Error('Publishing failed');
      return res.json();
    },
    onSuccess: (data) => {
      setPublishedUrl(`${data.url}?t=${Date.now()}`);
    },
    onError: (err: any) => {
      alert(`Publishing failed: ${err.message}`);
    }
  });

  useEffect(() => {
    // Generate initially on load
    generateMutation.mutate();
  }, [theme, profile, customColor, sections]);

  const handleDownload = () => {
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
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto h-full flex flex-col overflow-hidden">
      <div className="shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Layout className="w-8 h-8 text-indigo-400" /> Developer Portfolio Exporter
          </h1>
          <p className="text-sm text-[#94a3b8]">Convert your resume profile and application data into a responsive, single-page HTML portfolio website</p>
        </div>
        <div className="flex gap-3 items-center shrink-0">
          <button
            onClick={() => publishMutation.mutate()}
            disabled={!htmlCode || publishMutation.isPending}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition duration-200 cursor-pointer shadow-lg shrink-0"
          >
            <Globe className={`w-4 h-4 ${publishMutation.isPending ? 'animate-spin' : ''}`} /> 
            {publishMutation.isPending ? 'Publishing...' : 'Publish Online'}
          </button>
          
          <button
            onClick={handleDownload}
            disabled={!htmlCode}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition duration-200 cursor-pointer shadow-lg shrink-0"
          >
            <Download className="w-4 h-4" /> Download HTML Portfolio
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0 overflow-hidden">
        {/* Left Settings Sidebar */}
        <div className="lg:col-span-4 bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 space-y-6 flex flex-col overflow-y-auto max-h-full">
          {publishedUrl && (
            <div className="bg-[#1b2535] border border-[#232d3f] rounded-2xl p-4 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Portfolio Published!</h4>
                <button
                  onClick={() => setPublishedUrl(null)}
                  className="text-[#94a3b8] hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-[#94a3b8]">Your developer profile is live at -</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={publishedUrl}
                  className="flex-1 bg-[#131a26] border border-[#232d3f] rounded-xl py-1.5 px-3 text-xs text-indigo-300 font-mono select-all focus:outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(publishedUrl);
                    alert('Link copied to clipboard!');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition duration-200 cursor-pointer shadow-md"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

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

            {/* Manage Portfolio Sections */}
            <div className="space-y-3 pt-3 border-t border-[#232d3f]/40">
              <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider block">Portfolio Sections</label>
              
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {sections.map(s => {
                  const isEditing = editingSectionId === s.id;
                  return (
                    <div key={s.id} className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-3 space-y-2 transition hover:border-[#334155]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate max-w-[120px]">{s.title}</span>
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

export default ProfileBuilder;
