import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, Save, Trash2, Eye, Edit3, BookOpen } from 'lucide-react';

interface CheatSheet {
  id?: string;
  companyName: string;
  talkingPoints: string;
  projects: string;
  templates: string;
  questions: string;
  updatedAt?: string;
}

export const CheatSheetDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(true);

  // Form states
  const [companyName, setCompanyName] = useState('');
  const [talkingPoints, setTalkingPoints] = useState('');
  const [projects, setProjects] = useState('');
  const [templates, setTemplates] = useState('');
  const [questions, setQuestions] = useState('');

  // Fetch saved cheat sheets
  const { data: sheets = [], isLoading } = useQuery<CheatSheet[]>({
    queryKey: ['cheat-sheets'],
    queryFn: async () => {
      const res = await fetch('/api/cheat-sheets');
      if (!res.ok) throw new Error('Failed to load cheat sheets');
      return res.json();
    }
  });

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (sheet: CheatSheet) => {
      const res = await fetch('/api/cheat-sheets/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedSheetId || undefined, ...sheet })
      });
      if (!res.ok) throw new Error('Failed to save cheat sheet');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cheat-sheets'] });
      setSelectedSheetId(data.cheatSheet.id);
      alert('Cheat sheet successfully saved!');
    },
    onError: (err: any) => {
      alert(`Save failed: ${err.message}`);
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/cheat-sheets/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete cheat sheet');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cheat-sheets'] });
      setSelectedSheetId(null);
      handleNewSheet();
      alert('Cheat sheet deleted.');
    },
    onError: (err: any) => {
      alert(`Delete failed: ${err.message}`);
    }
  });

  const handleSelectSheet = (sheet: CheatSheet) => {
    setSelectedSheetId(sheet.id || null);
    setCompanyName(sheet.companyName || '');
    setTalkingPoints(sheet.talkingPoints || '');
    setProjects(sheet.projects || '');
    setTemplates(sheet.templates || '');
    setQuestions(sheet.questions || '');
    setIsEditMode(false); // Open in Presenter/View Mode by default
  };

  const handleNewSheet = () => {
    setSelectedSheetId(null);
    setCompanyName('');
    setTalkingPoints('');
    setProjects('');
    setTemplates('');
    setQuestions('');
    setIsEditMode(true); // Open in Edit Mode for new sheet
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      alert('Company Name is required');
      return;
    }
    saveMutation.mutate({
      companyName,
      talkingPoints,
      projects,
      templates,
      questions
    });
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto h-full flex flex-col overflow-hidden">
      <div className="shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-indigo-400" /> Interview Cheat Sheets
          </h1>
          <p className="text-sm text-[#94a3b8]">Organize talking points, STAR project matrices, and questions for target company loops</p>
        </div>
        <button
          onClick={handleNewSheet}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition duration-200 cursor-pointer shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4" /> New Cheat Sheet
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0 overflow-hidden">
        {/* Left Sidebar - Cheat Sheets list */}
        <div className="lg:col-span-3 bg-[#131a26] border border-[#232d3f] rounded-2xl p-4 flex flex-col min-h-0 overflow-y-auto space-y-3">
          <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider block px-2">Saved Cheat Sheets</span>
          
          {isLoading ? (
            <p className="text-xs text-gray-500 italic p-2">Loading sheets...</p>
          ) : sheets.length === 0 ? (
            <p className="text-xs text-gray-500 italic p-2">No cheat sheets found. Create one to begin.</p>
          ) : (
            <div className="space-y-1">
              {sheets.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSheet(s)}
                  className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between text-xs cursor-pointer ${
                    selectedSheetId === s.id
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-[#94a3b8] hover:bg-[#1b2535] hover:text-white'
                  }`}
                >
                  <span className="truncate pr-2">{s.companyName}</span>
                  <FileText className="w-4 h-4 opacity-60 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Details Panel */}
        <div className="lg:col-span-9 bg-[#131a26] border border-[#232d3f] rounded-2xl flex flex-col min-h-0 overflow-hidden">
          {/* Header Controls */}
          <div className="h-14 border-b border-[#232d3f] px-6 flex items-center justify-between shrink-0">
            <span className="text-sm font-bold text-white">
              {selectedSheetId ? `Cheat Sheet: ${companyName}` : 'New Cheat Sheet'}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                  isEditMode
                    ? 'bg-[#1b2535] border-[#232d3f] text-[#94a3b8] hover:text-white'
                    : 'bg-indigo-600/10 border-indigo-600/20 text-indigo-400'
                }`}
              >
                {isEditMode ? (
                  <>
                    <Eye className="w-3.5 h-3.5" /> Presenter Mode
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3.5 h-3.5" /> Edit Sheet
                  </>
                )}
              </button>

              {selectedSheetId && (
                <button
                  onClick={() => deleteMutation.mutate(selectedSheetId)}
                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg cursor-pointer transition"
                  title="Delete Sheet"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Form Content / View Panel */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            {isEditMode ? (
              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#94a3b8] uppercase">Target Company</label>
                  <input
                    type="text"
                    placeholder="e.g. HuggingFace, Stripe"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#94a3b8] uppercase">Talking Points ("Why Company?")</label>
                    <textarea
                      placeholder="List details about the company's business model, engineering problems, culture, and why your experience matches their values..."
                      value={talkingPoints}
                      onChange={e => setTalkingPoints(e.target.value)}
                      className="w-full h-40 bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600 transition resize-none leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#94a3b8] uppercase">Project Highlights (STAR Matrix)</label>
                    <textarea
                      placeholder="Draft Situation, Task, Action, and Result bullet points for your top 2 engineering achievements..."
                      value={projects}
                      onChange={e => setProjects(e.target.value)}
                      className="w-full h-40 bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600 transition resize-none leading-relaxed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#94a3b8] uppercase">Code & System Architecture Templates</label>
                    <textarea
                      placeholder="Jot down quick reminders for system templates (e.g. Rate Limiter configurations, BFS graph traversal code snippets, database isolation levels)..."
                      value={templates}
                      onChange={e => setTemplates(e.target.value)}
                      className="w-full h-40 bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600 transition resize-none leading-relaxed font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#94a3b8] uppercase">Questions for the Interviewer</label>
                    <textarea
                      placeholder="Prepare thoughtful engineering-focused questions (e.g. testing practices, deployment frequencies, cross-team collaboration, post-mortems)..."
                      value={questions}
                      onChange={e => setQuestions(e.target.value)}
                      className="w-full h-40 bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600 transition resize-none leading-relaxed"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition duration-200 cursor-pointer shadow-lg ml-auto"
                >
                  <Save className="w-4 h-4" /> {saveMutation.isPending ? 'Saving...' : 'Save Cheat Sheet'}
                </button>
              </form>
            ) : (
              /* View/Presenter Mode (High contrast, readable card layout) */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="bg-[#1b2535] border border-[#232d3f] p-5 rounded-xl space-y-3">
                  <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider">Talking Points</h4>
                  <p className="text-white whitespace-pre-wrap leading-relaxed text-xs">
                    {talkingPoints || <span className="text-gray-500 italic">No talking points prepared. Click edit to add.</span>}
                  </p>
                </div>

                <div className="bg-[#1b2535] border border-[#232d3f] p-5 rounded-xl space-y-3">
                  <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider">STAR Project Highlights</h4>
                  <p className="text-white whitespace-pre-wrap leading-relaxed text-xs">
                    {projects || <span className="text-gray-500 italic">No project highlights drafted. Click edit to add.</span>}
                  </p>
                </div>

                <div className="bg-[#1b2535] border border-[#232d3f] p-5 rounded-xl space-y-3">
                  <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider">Architecture & Code Templates</h4>
                  <pre className="font-mono text-[11px] text-emerald-400 whitespace-pre-wrap leading-relaxed bg-[#0b0f19] p-3 rounded-lg border border-[#232d3f] max-h-60 overflow-y-auto">
                    {templates || 'No snippets saved.'}
                  </pre>
                </div>

                <div className="bg-[#1b2535] border border-[#232d3f] p-5 rounded-xl space-y-3">
                  <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider">Questions for Interviewers</h4>
                  <p className="text-white whitespace-pre-wrap leading-relaxed text-xs">
                    {questions || <span className="text-gray-500 italic">No questions prepared. Click edit to add.</span>}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheatSheetDashboard;
