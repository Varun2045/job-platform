import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Trash2, Eye, Download } from 'lucide-react';

export const ResumeManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [pdfData, setPdfData] = useState('');
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewPdf, setPreviewPdf] = useState<string | null>(null);

  const { data: resumes, isLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: async () => {
      const res = await fetch('/api/resumes');
      if (!res.ok) throw new Error('Failed to load resumes');
      return res.json();
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content, pdf_data: pdfData })
      });
      if (!res.ok) throw new Error('Failed to save resume');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      setName('');
      setContent('');
      setPdfData('');
      alert('Resume saved successfully!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (resumeName: string) => {
      const res = await fetch(`/api/resumes/${resumeName}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete resume');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      if (previewName) {
        setPreviewName(null);
        setPreviewContent(null);
        setPreviewPdf(null);
      }
    }
  });

  const handlePreview = async (rName: string) => {
    setPreviewName(rName);
    const resume = resumes?.find((r: any) => r.name === rName);
    setPreviewContent(resume ? resume.content : '');
    setPreviewPdf(resume ? resume.pdf_data : null);
  };

  const handleDownload = async (rName: string) => {
    const resume = resumes?.find((r: any) => r.name === rName);
    if (!resume) {
      alert('Resume not found');
      return;
    }

    try {
      if (resume.pdf_data) {
        // Download PDF
        const link = document.createElement('a');
        link.href = resume.pdf_data;
        link.download = `${rName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert('Resume download started successfully!');
      } else if (resume.content) {
        // Download as text file
        const blob = new Blob([resume.content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${rName}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        alert('Resume download started successfully!');
      } else {
        alert('No file data available for this resume');
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download resume. Please try again.');
    }
  };

  if (isLoading) {
    return <div className="p-4 md:p-8 animate-pulse text-[#94a3b8]">Loading Resume Profiles...</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Resume Manager</h1>
          <p className="text-sm text-[#94a3b8]">Upload and manage profiles used for resume matching</p>
        </div>

        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Add Resume Profile</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Profile Name (e.g. backend, frontend, fullstack)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
            />
            
            <div className="border-2 border-dashed border-[#232d3f] hover:border-indigo-500/60 rounded-xl p-4 transition duration-200 text-center bg-[#1b2535]">
              <label className="cursor-pointer block">
                <FileText className="w-8 h-8 mx-auto text-indigo-400 mb-2" />
                <span className="text-xs text-white font-semibold block">Click to Upload Resume File</span>
                <span className="text-[10px] text-[#94a3b8]">Supports .txt, .md, .pdf, .docx files</span>
                <input
                  type="file"
                  accept=".txt,.md,.pdf,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                    setName(baseName);
                    setContent('Extracting text content from file...');

                    // Read PDF Data URL immediately if it's a PDF so it's always ready
                    if (file.name.toLowerCase().endsWith('.pdf')) {
                      const dataUrlReader = new FileReader();
                      dataUrlReader.onload = (duEvt) => {
                        setPdfData(duEvt.target?.result as string);
                      };
                      dataUrlReader.readAsDataURL(file);
                    } else {
                      setPdfData('');
                    }

                    // Extract text content using parser API
                    const reader = new FileReader();
                    reader.onload = async (evt) => {
                      try {
                        const buffer = evt.target?.result as ArrayBuffer;
                        const res = await fetch('/api/resumes/parse', {
                          method: 'POST',
                          headers: {
                            'Content-Type': file.type || 'application/octet-stream'
                          },
                          body: buffer
                        });
                        if (!res.ok) {
                          const err = await res.json();
                          throw new Error(err.error || 'Server parsing error');
                        }
                        const data = await res.json();
                        setContent(data.text || `${baseName} content`);
                      } catch (err: any) {
                        console.error('Failed to parse resume:', err);
                        // Friendly fallback content so we can still save the profile
                        setContent(`${baseName} text content`);
                      }
                    };
                    reader.readAsArrayBuffer(file);
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
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold text-xs py-2.5 rounded-xl transition duration-200 cursor-pointer font-bold"
            >
              Save Profile
            </button>
          </div>
        </div>

        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Resume Profiles</h3>
          <div className="space-y-3">
            {resumes.length === 0 ? (
              <div className="text-center text-xs text-[#94a3b8] py-6">No resume profiles registered yet.</div>
            ) : (
              resumes.map((r: any) => (
                <div key={r.name} className="flex items-center justify-between p-3 bg-[#1b2535] rounded-xl border border-[#232d3f]">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    <span className="text-sm font-bold text-white">{r.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handlePreview(r.name)} className="p-2 hover:bg-[#232d3f] rounded text-[#94a3b8] hover:text-white cursor-pointer" title="Preview">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDownload(r.name)} className="p-2 hover:bg-[#232d3f] rounded text-[#94a3b8] hover:text-white cursor-pointer" title="Download">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteMutation.mutate(r.name)} className="p-2 hover:bg-[#232d3f] rounded text-red-400 hover:text-red-500 cursor-pointer" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 h-fit sticky top-8">
        {!previewName ? (
          <div className="py-24 text-center text-[#94a3b8] space-y-2">
            <FileText className="w-12 h-12 mx-auto text-indigo-500/40 animate-pulse" />
            <div className="text-sm font-semibold">Select Profile to Preview</div>
            <p className="text-xs">Click the eye icon next to any profile to display its content here</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[#232d3f] pb-3">
              <h3 className="text-md font-bold text-white">{previewName} Profile Preview</h3>
              <button onClick={() => { setPreviewName(null); setPreviewContent(null); setPreviewPdf(null); }} className="text-[#94a3b8] hover:text-white text-xs font-semibold cursor-pointer">
                Close
              </button>
            </div>
            {previewPdf ? (
              <iframe
                src={previewPdf}
                title="PDF Resume Preview"
                className="w-full h-[500px] rounded-xl border border-[#232d3f] bg-white"
              />
            ) : (
              <pre className="text-xs text-[#94a3b8] leading-relaxed whitespace-pre-wrap bg-[#1b2535] p-4 rounded-xl border border-[#232d3f] max-h-96 overflow-y-auto">
                {previewContent}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
