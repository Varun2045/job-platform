import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText, Trash2, Eye, Download, Edit3, Star, Search, UploadCloud,
  CheckCircle2, AlertCircle, Info, X, HardDrive
} from 'lucide-react';
import { PageHeader } from '../../components/PageHeader.js';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ExtendedResume {
  name: string;
  content: string;
  pdf_data?: string;
  fileType?: string;
  pageCount?: number;
  fileSize?: string;
  lastUpdated?: string;
}

// Helper: Formats bytes to KB/MB string
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Helper: Formats date to e.g. "Jul 29" or "Today"
function formatDateShort(dateStr?: string): string {
  if (!dateStr) return 'Recently';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Recently';
  
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const ResumeManager: React.FC = () => {
  const queryClient = useQueryClient();

  // Input states
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [pdfData, setPdfData] = useState('');
  const [uploadedMeta, setUploadedMeta] = useState<{
    fileType: string;
    pageCount: number;
    fileSize: string;
    fileSizeBytes: number;
  }>({ fileType: 'PDF', pageCount: 1, fileSize: '150 KB', fileSizeBytes: 153600 });

  // Preview & Search states
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewPdf, setPreviewPdf] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Drag & drop highlight state
  const [isDragging, setIsDragging] = useState(false);

  // Rename modal / inline state
  const [editingResumeName, setEditingResumeName] = useState<string | null>(null);
  const [newResumeName, setNewResumeName] = useState('');

  // Toast Notification System
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Default Resume Profile (persisted in localStorage)
  const [defaultResume, setDefaultResume] = useState<string>(() => {
    return localStorage.getItem('defaultResumeProfile') || '';
  });

  const handleSetDefault = (rName: string) => {
    setDefaultResume(rName);
    localStorage.setItem('defaultResumeProfile', rName);
    addToast('success', `Set "${rName}" as Default Resume`);
  };

  // Fetch Resumes
  const { data: resumes = [], isLoading } = useQuery<ExtendedResume[]>({
    queryKey: ['resumes'],
    queryFn: async () => {
      const res = await fetch('/api/resumes');
      if (!res.ok) throw new Error('Failed to load resumes');
      const data = await res.json();
      return data;
    },
  });

  // Ensure default resume is auto-selected if not set
  useEffect(() => {
    if (resumes.length > 0 && !defaultResume) {
      const first = resumes[0].name;
      setDefaultResume(first);
      localStorage.setItem('defaultResumeProfile', first);
    }
  }, [resumes, defaultResume]);

  // Persistent Resume Metadata Store (localStorage fallback)
  const getResumeMeta = (rName: string, textContent: string, pdfStr?: string) => {
    const stored = localStorage.getItem(`resume_meta_${rName}`);
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    // Generate intelligent default metadata if not stored
    const approxBytes = pdfStr ? Math.round(pdfStr.length * 0.75) : textContent.length;
    const estimatedPages = Math.max(1, Math.ceil(textContent.length / 2800));
    return {
      fileType: pdfStr ? 'PDF' : 'TXT',
      pageCount: estimatedPages,
      fileSize: formatBytes(approxBytes),
      fileSizeBytes: approxBytes,
      lastUpdated: new Date().toISOString(),
    };
  };

  // Upload / Save Mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content, pdf_data: pdfData }),
      });
      if (!res.ok) throw new Error('Failed to save resume profile');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      // Store metadata
      const metaToStore = {
        ...uploadedMeta,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(`resume_meta_${name}`, JSON.stringify(metaToStore));

      if (!defaultResume) {
        handleSetDefault(name);
      }

      setName('');
      setContent('');
      setPdfData('');
      addToast('success', 'Resume saved successfully!');
    },
    onError: (err: any) => {
      addToast('error', err.message || 'Failed to save resume');
    },
  });

  // Rename Resume Profile Mutation
  const renameMutation = useMutation({
    mutationFn: async ({ oldName, targetName }: { oldName: string; targetName: string }) => {
      // 1. Fetch old content
      const oldResume = resumes.find((r) => r.name === oldName);
      if (!oldResume) throw new Error('Original resume not found');

      // 2. Save new profile
      const saveRes = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: targetName,
          content: oldResume.content,
          pdf_data: oldResume.pdf_data,
        }),
      });
      if (!saveRes.ok) throw new Error('Failed to save renamed profile');

      // 3. Delete old profile
      await fetch(`/api/resumes/${encodeURIComponent(oldName)}`, { method: 'DELETE' });

      // Move metadata in storage
      const oldMetaStr = localStorage.getItem(`resume_meta_${oldName}`);
      if (oldMetaStr) {
        localStorage.setItem(`resume_meta_${targetName}`, oldMetaStr);
        localStorage.removeItem(`resume_meta_${oldName}`);
      }

      if (defaultResume === oldName) {
        setDefaultResume(targetName);
        localStorage.setItem('defaultResumeProfile', targetName);
      }

      return { oldName, targetName };
    },
    onSuccess: ({ oldName, targetName }) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      if (previewName === oldName) {
        setPreviewName(targetName);
      }
      setEditingResumeName(null);
      setNewResumeName('');
      addToast('success', `Resume renamed to "${targetName}"`);
    },
    onError: (err: any) => {
      addToast('error', err.message || 'Failed to rename resume');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (resumeName: string) => {
      const res = await fetch(`/api/resumes/${encodeURIComponent(resumeName)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete resume');
      return res.json();
    },
    onSuccess: (_data, resumeName) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      localStorage.removeItem(`resume_meta_${resumeName}`);
      if (previewName === resumeName) {
        setPreviewName(null);
        setPreviewContent(null);
        setPreviewPdf(null);
      }
      if (defaultResume === resumeName) {
        const remaining = resumes.filter((r) => r.name !== resumeName);
        const nextDefault = remaining.length > 0 ? remaining[0].name : '';
        setDefaultResume(nextDefault);
        localStorage.setItem('defaultResumeProfile', nextDefault);
      }
      addToast('info', `Resume "${resumeName}" deleted`);
    },
    onError: (err: any) => {
      addToast('error', err.message || 'Failed to delete resume');
    },
  });

  const base64ToBlobUrl = (base64Data: string): string => {
    try {
      const base64Clean = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      const binaryStr = atob(base64Clean);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (err) {
      console.error('Failed to convert base64 PDF to blob URL', err);
      return base64Data;
    }
  };

  const handlePreview = async (rName: string) => {
    setPreviewName(rName);
    const resume = resumes?.find((r) => r.name === rName);
    setPreviewContent(resume ? resume.content : '');
    if (resume?.pdf_data) {
      setPreviewPdf(base64ToBlobUrl(resume.pdf_data));
    } else {
      setPreviewPdf(null);
    }
  };

  const handleDownload = async (rName: string) => {
    const resume = resumes?.find((r) => r.name === rName);
    if (!resume) {
      addToast('error', 'Resume profile not found');
      return;
    }

    try {
      if (resume.pdf_data) {
        const link = document.createElement('a');
        link.href = resume.pdf_data;
        link.download = `${rName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast('success', 'Resume download started!');
      } else if (resume.content) {
        const blob = new Blob([resume.content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${rName}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        addToast('success', 'Resume download started!');
      } else {
        addToast('error', 'No file data available for this resume');
      }
    } catch (error) {
      console.error('Download failed:', error);
      addToast('error', 'Failed to download resume');
    }
  };

  // Process File Selection / Drop
  const processFile = (file: File) => {
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const ext = (file.name.split('.').pop() || 'PDF').toUpperCase();
    const sizeStr = formatBytes(file.size);

    setName(baseName);
    setContent('Extracting text content from file...');

    setUploadedMeta({
      fileType: ext,
      pageCount: Math.max(1, Math.ceil(file.size / 30000)),
      fileSize: sizeStr,
      fileSizeBytes: file.size,
    });

    if (file.name.toLowerCase().endsWith('.pdf')) {
      const dataUrlReader = new FileReader();
      dataUrlReader.onload = (duEvt) => {
        setPdfData(duEvt.target?.result as string);
      };
      dataUrlReader.readAsDataURL(file);
    } else {
      setPdfData('');
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const res = await fetch('/api/resumes/parse', {
          method: 'POST',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
          body: buffer,
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Server parsing error');
        }
        const parsed = await res.json();
        setContent(parsed.text || `${baseName} content`);
      } catch (err: any) {
        console.error('Failed to parse resume:', err);
        setContent(`${baseName} text content`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Calculate Statistics
  const totalResumes = resumes.length;
  const currentDefaultName = defaultResume || (resumes[0]?.name || 'None');
  const totalSizeBytes = resumes.reduce((sum, r) => {
    const meta = getResumeMeta(r.name, r.content, r.pdf_data);
    return sum + (meta.fileSizeBytes || 150000);
  }, 0);
  const totalStorageFormatted = formatBytes(totalSizeBytes);

  // Filtered resumes search
  const filteredResumes = resumes.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.content?.toLowerCase().includes(q);
  });

  if (isLoading) {
    return <div className="p-4 md:p-8 animate-pulse text-[#94a3b8]">Loading Resume Profiles...</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto">
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-2xl transition-all duration-300 animate-slide-in ${
              toast.type === 'success'
                ? 'bg-[#131a26] border-emerald-500/40 text-emerald-300'
                : toast.type === 'error'
                ? 'bg-[#131a26] border-rose-500/40 text-rose-300'
                : 'bg-[#131a26] border-cyan-500/40 text-cyan-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-cyan-400 shrink-0" />}
              <span className="text-xs font-semibold">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <PageHeader
        themeKey="resumeManager"
        title="Resume Manager"
        description="Upload and manage profiles used for resume matching"
        icon={FileText}
      />

      {/* 7. Resume Statistics Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-4 flex flex-col justify-between hover:border-indigo-600/50 transition duration-200 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">📄 Resume Profiles</span>
            <div className="p-2 rounded-xl bg-indigo-500/10">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white">{totalResumes}</span>
          </div>
        </div>

        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-4 flex flex-col justify-between hover:border-indigo-600/50 transition duration-200 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">⭐ Default Resume</span>
            <div className="p-2 rounded-xl bg-amber-500/10">
              <Star className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl font-extrabold text-white truncate block">{currentDefaultName}</span>
          </div>
        </div>

        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-4 flex flex-col justify-between hover:border-indigo-600/50 transition duration-200 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">💾 Storage Used</span>
            <div className="p-2 rounded-xl bg-cyan-500/10">
              <HardDrive className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white">{totalStorageFormatted}</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Upload & Active Profiles */}
        <div className="space-y-6">
          {/* 3. Improved Upload Area */}
          <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Add Resume Profile</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Profile Name (e.g. backend, frontend, fullstack)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) processFile(file);
                }}
                className={`border-2 border-dashed rounded-xl p-5 transition duration-200 text-center bg-[#1b2535] ${
                  isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-[#232d3f] hover:border-indigo-500/60'
                }`}
              >
                <label className="cursor-pointer block">
                  <UploadCloud className="w-9 h-9 mx-auto text-indigo-400 mb-2" />
                  <span className="text-xs text-white font-bold block mb-1">
                    Drag & Drop Resume Here
                  </span>
                  <span className="text-[11px] text-indigo-400 font-semibold underline block mb-2">
                    or Click to Browse
                  </span>
                  <span className="text-[10px] text-[#94a3b8] block">
                    Supports .txt, .md, .pdf, .docx files
                  </span>
                  <input
                    type="file"
                    accept=".txt,.md,.pdf,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) processFile(file);
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {content && !content.startsWith('Extracting') && (
                <div className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl text-center font-bold">
                  ✓ Resume file successfully processed.
                </div>
              )}

              <button
                onClick={() => uploadMutation.mutate()}
                disabled={!name || !content || content.startsWith('Extracting')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold text-xs py-2.5 rounded-xl transition duration-200 cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                Save Profile
              </button>
            </div>
          </div>

          {/* Active Profiles Section with 6. Search Bar */}
          <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Resume Profiles</h3>
              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                {filteredResumes.length} profiles
              </span>
            </div>

            {/* 6. Instant Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search resumes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0b0f19] border border-[#232d3f] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 2. Improved Resume Cards List */}
            <div className="space-y-3">
              {filteredResumes.length === 0 ? (
                <div className="text-center text-xs text-[#94a3b8] py-8 border border-dashed border-[#232d3f] rounded-xl">
                  {searchQuery ? 'No matching resume profiles found.' : 'No resume profiles registered yet.'}
                </div>
              ) : (
                filteredResumes.map((r) => {
                  const meta = getResumeMeta(r.name, r.content, r.pdf_data);
                  const isDefault = defaultResume === r.name;
                  const isEditing = editingResumeName === r.name;

                  return (
                    <div
                      key={r.name}
                      className={`p-4 bg-[#1b2535] rounded-xl border transition-all ${
                        isDefault ? 'border-amber-500/50 shadow-md shadow-amber-500/5' : 'border-[#232d3f] hover:border-indigo-500/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        {/* Name & Metadata */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                            {isEditing ? (
                              <div className="flex items-center gap-1.5 flex-1">
                                <input
                                  type="text"
                                  value={newResumeName}
                                  onChange={(e) => setNewResumeName(e.target.value)}
                                  className="bg-[#0b0f19] border border-indigo-500 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                                />
                                <button
                                  onClick={() => {
                                    if (newResumeName.trim() && newResumeName.trim() !== r.name) {
                                      renameMutation.mutate({ oldName: r.name, targetName: newResumeName.trim() });
                                    } else {
                                      setEditingResumeName(null);
                                    }
                                  }}
                                  className="text-xs bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-bold"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingResumeName(null)}
                                  className="text-xs text-slate-400 px-1 hover:text-white"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <span className="text-sm font-bold text-white truncate">{r.name}</span>
                            )}

                            {/* 5. Default Badge */}
                            {isDefault && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                                ⭐ Default
                              </span>
                            )}
                          </div>

                          {/* 4. Metadata Line */}
                          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-2 mt-1">
                            <span>{meta.fileType || 'PDF'}</span>
                            <span>•</span>
                            <span>{meta.pageCount || 1} {meta.pageCount === 1 ? 'Page' : 'Pages'}</span>
                            <span>•</span>
                            <span>{meta.fileSize || '150 KB'}</span>
                          </div>

                          {/* Last Updated Date */}
                          <div className="text-[10px] text-slate-500 mt-1">
                            Updated {formatDateShort(meta.lastUpdated)}
                          </div>
                        </div>

                        {/* Action Icons */}
                        <div className="flex items-center gap-1 shrink-0">
                          {!isDefault && (
                            <button
                              onClick={() => handleSetDefault(r.name)}
                              className="p-1.5 hover:bg-[#232d3f] rounded text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                              title="Set as Default Resume"
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handlePreview(r.name)}
                            className="p-1.5 hover:bg-[#232d3f] rounded text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
                            title="Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDownload(r.name)}
                            className="p-1.5 hover:bg-[#232d3f] rounded text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setEditingResumeName(r.name);
                              setNewResumeName(r.name);
                            }}
                            className="p-1.5 hover:bg-[#232d3f] rounded text-[#94a3b8] hover:text-indigo-300 transition-colors cursor-pointer"
                            title="Rename"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => deleteMutation.mutate(r.name)}
                            className="p-1.5 hover:bg-[#232d3f] rounded text-red-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Preview Panel (Preserved Layout) */}
        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 h-fit sticky top-8 shadow-xl">
          {!previewName ? (
            <div className="py-24 text-center text-[#94a3b8] space-y-2">
              <FileText className="w-12 h-12 mx-auto text-indigo-500/40 animate-pulse" />
              <div className="text-sm font-semibold">Select Profile to Preview</div>
              <p className="text-xs">Click the eye icon next to any profile to display its content here</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-[#232d3f] pb-3">
                <h3 className="text-md font-bold text-white flex items-center gap-2">
                  {previewName} Profile Preview
                  {defaultResume === previewName && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                      ⭐ Default
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => {
                    setPreviewName(null);
                    setPreviewContent(null);
                    setPreviewPdf(null);
                  }}
                  className="text-[#94a3b8] hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
              {previewPdf ? (
                <object
                  data={previewPdf}
                  type="application/pdf"
                  className="w-full h-[550px] rounded-xl border border-[#232d3f] bg-white overflow-hidden shadow-inner"
                >
                  <div className="p-6 text-center text-xs text-[#94a3b8] space-y-3">
                    <p>Your browser does not support embedded PDF rendering.</p>
                    <a
                      href={previewPdf}
                      download={`${previewName}.pdf`}
                      className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-lg transition"
                    >
                      Download PDF Document
                    </a>
                  </div>
                </object>
              ) : (
                <pre className="text-xs text-[#94a3b8] leading-relaxed whitespace-pre-wrap bg-[#1b2535] p-4 rounded-xl border border-[#232d3f] max-h-96 overflow-y-auto font-mono">
                  {previewContent}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
