import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Download, Eye, Sparkles, Save, Trash2, AlertCircle, RefreshCw } from 'lucide-react';

type Tone = 'professional' | 'formal' | 'startup' | 'big-tech';

interface CoverLetterData {
  id?: string;
  name: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  tone: Tone;
  content: string;
}

const TONES: { id: Tone; name: string; description: string }[] = [
  { id: 'professional', name: 'Professional', description: 'Standard business tone, suitable for most corporate roles' },
  { id: 'formal', name: 'Formal', description: 'Very formal tone for traditional industries' },
  { id: 'startup', name: 'Startup', description: 'Casual yet professional, great for tech startups' },
  { id: 'big-tech', name: 'Big Tech', description: 'Modern, data-driven tone for FAANG companies' },
];

export const CoverLetterBuilder: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'build' | 'saved'>('build');
  const [selectedTone, setSelectedTone] = useState<Tone>('professional');
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [coverLetterData, setCoverLetterData] = useState<CoverLetterData>({
    name: 'My Cover Letter',
    companyName: '',
    jobTitle: '',
    jobDescription: '',
    tone: 'professional',
    content: ''
  });

  // Fetch saved cover letters
  const { data: savedCoverLetters = [], isLoading } = useQuery({
    queryKey: ['saved-cover-letters'],
    queryFn: async () => {
      const res = await fetch('/api/cover-letters/saved');
      if (!res.ok) throw new Error('Failed to load saved cover letters');
      return res.json();
    }
  });

  // Save cover letter mutation
  const saveMutation = useMutation({
    mutationFn: async (data: CoverLetterData) => {
      const res = await fetch('/api/cover-letters/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to save cover letter');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-cover-letters'] });
      alert('Cover letter saved successfully!');
    },
    onError: () => alert('Failed to save cover letter')
  });

  // Delete cover letter mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/cover-letters/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete cover letter');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-cover-letters'] });
      alert('Cover letter deleted successfully!');
    },
    onError: () => alert('Failed to delete cover letter')
  });

  // Generate AI cover letter
  const generateCoverLetter = async () => {
    if (!coverLetterData.companyName || !coverLetterData.jobTitle) {
      alert('Please enter company name and job title');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/cover-letters/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: coverLetterData.companyName,
          jobTitle: coverLetterData.jobTitle,
          jobDescription: coverLetterData.jobDescription,
          tone: selectedTone
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCoverLetterData({ ...coverLetterData, content: data.content || '' });
      } else {
        alert('Failed to generate cover letter');
      }
    } catch (error) {
      alert('Error generating cover letter');
    } finally {
      setIsGenerating(false);
    }
  };

  // Regenerate cover letter
  const regenerateCoverLetter = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/cover-letters/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: coverLetterData.companyName,
          jobTitle: coverLetterData.jobTitle,
          jobDescription: coverLetterData.jobDescription,
          tone: selectedTone,
          currentContent: coverLetterData.content
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCoverLetterData({ ...coverLetterData, content: data.content || '' });
      } else {
        alert('Failed to regenerate cover letter');
      }
    } catch (error) {
      alert('Error regenerating cover letter');
    } finally {
      setIsGenerating(false);
    }
  };

  // Export PDF
  const exportPdf = async () => {
    try {
      const res = await fetch('/api/cover-letters/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coverLetterData)
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${coverLetterData.name.replace(/\s+/g, '_')}_cover_letter.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      alert('Failed to export PDF');
    }
  };

  // Export LaTeX
  const exportLatex = async () => {
    try {
      const res = await fetch('/api/cover-letters/export/latex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coverLetterData)
      });
      if (res.ok) {
        const text = await res.text();
        const blob = new Blob([text], { type: 'application/x-tex' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${coverLetterData.name.replace(/\s+/g, '_')}_cover_letter.tex`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      alert('Failed to export LaTeX');
    }
  };

  const loadSavedCoverLetter = (coverLetter: CoverLetterData) => {
    setCoverLetterData(coverLetter);
    setSelectedTone(coverLetter.tone);
    setActiveTab('build');
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-indigo-400" /> Cover Letter Builder
          </h1>
          <p className="text-sm text-[#94a3b8]">Generate personalized cover letters with AI assistance</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab(activeTab === 'build' ? 'saved' : 'build')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'build' ? 'bg-indigo-600 text-white' : 'bg-[#1b2535] text-[#94a3b8]'
            }`}
          >
            {activeTab === 'build' ? 'View Saved' : 'Build New'}
          </button>
        </div>
      </div>

      {activeTab === 'build' && (
        <div className="space-y-6">
          {/* Tone Selection */}
          <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Select Tone</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {TONES.map(tone => (
                <button
                  key={tone.id}
                  onClick={() => { setSelectedTone(tone.id); setCoverLetterData({ ...coverLetterData, tone: tone.id }); }}
                  className={`p-4 rounded-xl border transition-all ${
                    selectedTone === tone.id
                      ? 'bg-indigo-600/10 border-indigo-600/30 text-indigo-400'
                      : 'bg-[#1b2535] border-[#232d3f] text-[#94a3b8] hover:border-indigo-600/30 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-semibold block">{tone.name}</span>
                  <span className="text-[9px] text-[#6b7280] mt-1 block">{tone.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cover Letter Input */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-6">
              <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Job Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-[#94a3b8] block mb-2">Cover Letter Name</label>
                    <input
                      type="text"
                      value={coverLetterData.name}
                      onChange={(e) => setCoverLetterData({ ...coverLetterData, name: e.target.value })}
                      className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl px-4 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#94a3b8] block mb-2">Company Name *</label>
                    <input
                      type="text"
                      value={coverLetterData.companyName}
                      onChange={(e) => setCoverLetterData({ ...coverLetterData, companyName: e.target.value })}
                      placeholder="e.g., Google, Amazon, Microsoft"
                      className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl px-4 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#94a3b8] block mb-2">Job Title *</label>
                    <input
                      type="text"
                      value={coverLetterData.jobTitle}
                      onChange={(e) => setCoverLetterData({ ...coverLetterData, jobTitle: e.target.value })}
                      placeholder="e.g., Software Engineer, Product Manager"
                      className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl px-4 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#94a3b8] block mb-2">Job Description</label>
                    <textarea
                      value={coverLetterData.jobDescription}
                      onChange={(e) => setCoverLetterData({ ...coverLetterData, jobDescription: e.target.value })}
                      rows={6}
                      placeholder="Paste the job description here for better personalization..."
                      className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl px-4 py-2 text-sm text-white resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={generateCoverLetter}
                  disabled={isGenerating}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-colors"
                >
                  <Sparkles className="w-4 h-4" /> {isGenerating ? 'Generating...' : 'Generate Cover Letter'}
                </button>
                {coverLetterData.content && (
                  <button
                    onClick={regenerateCoverLetter}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-6 py-3 bg-[#232d3f] hover:bg-[#1f2937] disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" /> Regenerate
                  </button>
                )}
              </div>
            </div>

            {/* Content Section */}
            <div className="space-y-6">
              <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Cover Letter Content</h3>
                  {coverLetterData.content && (
                    <button
                      onClick={() => setShowPreview(true)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      <Eye className="w-4 h-4 inline mr-1" /> Preview
                    </button>
                  )}
                </div>
                <textarea
                  value={coverLetterData.content}
                  onChange={(e) => setCoverLetterData({ ...coverLetterData, content: e.target.value })}
                  rows={20}
                  placeholder="Your AI-generated cover letter will appear here. You can also write your own..."
                  className="flex-1 w-full bg-[#1b2535] border border-[#232d3f] rounded-xl px-4 py-3 text-sm text-white resize-none font-mono"
                />
              </div>

              {coverLetterData.content && (
                <div className="flex gap-3">
                  <button
                    onClick={() => saveMutation.mutate(coverLetterData)}
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-colors"
                  >
                    <Save className="w-4 h-4" /> {saveMutation.isPending ? 'Saving...' : 'Save Template'}
                  </button>
                  <button
                    onClick={exportPdf}
                    className="flex items-center gap-2 px-6 py-3 bg-[#232d3f] hover:bg-[#1f2937] rounded-xl text-sm font-semibold text-white transition-colors"
                  >
                    <Download className="w-4 h-4" /> Export PDF
                  </button>
                  <button
                    onClick={exportLatex}
                    className="flex items-center gap-2 px-6 py-3 bg-[#232d3f] hover:bg-[#1f2937] rounded-xl text-sm font-semibold text-white transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" /> Export LaTeX
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-4 md:p-8 animate-pulse text-[#94a3b8]">Loading saved cover letters...</div>
          ) : savedCoverLetters.length === 0 ? (
            <div className="p-4 md:p-8 text-center text-[#6b7280]">No saved cover letters found. Create your first cover letter!</div>
          ) : (
            savedCoverLetters.map((coverLetter: CoverLetterData) => (
              <div key={coverLetter.id} className="bg-[#131a26] border border-[#232d3f] rounded-xl p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white">{coverLetter.name}</h3>
                  <p className="text-xs text-[#94a3b8]">{coverLetter.companyName} - {coverLetter.jobTitle}</p>
                  <p className="text-xs text-[#6b7280] mt-1">Tone: {TONES.find(t => t.id === coverLetter.tone)?.name}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadSavedCoverLetter(coverLetter)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-semibold text-white transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" /> Load
                  </button>
                  <button
                    onClick={() => { if (window.confirm(`Delete "${coverLetter.name}"?`)) deleteMutation.mutate(coverLetter.id!); }}
                    className="p-2 hover:bg-red-500/10 rounded text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Cover Letter Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <AlertCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 flex-1 overflow-y-auto text-gray-900">
              <div className="max-w-3xl mx-auto whitespace-pre-wrap font-serif leading-relaxed">
                {coverLetterData.content || 'No content to preview'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
