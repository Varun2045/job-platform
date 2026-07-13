import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Printer, Copy, Check } from 'lucide-react';

interface ResumeTailoringModalProps {
  jobHash: string;
  companyName: string;
  jobTitle: string;
  onClose: () => void;
}

export const ResumeTailoringModal: React.FC<ResumeTailoringModalProps> = ({ jobHash, companyName, jobTitle, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/jobs/${jobHash}/tailor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: 'backend' })
      });
      if (!res.ok) throw new Error('Failed to tailor resume');
      return res.json();
    },
    onSuccess: (resData) => {
      setData(resData);
    }
  });

  useEffect(() => {
    mutation.mutate();
  }, [jobHash]);

  const handleCopy = () => {
    if (data) {
      navigator.clipboard.writeText(data.tailoredResume);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (!data) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Tailored Resume - ${companyName}</title>
            <style>
              body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
              pre { white-space: pre-wrap; font-size: 14px; }
            </style>
          </head>
          <body>
            <pre>${data.tailoredResume}</pre>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl w-full max-w-3xl flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-[#232d3f] flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white">AI Resume Tailoring</h3>
            <p className="text-xs text-[#94a3b8]">Optimizing alignment for {jobTitle} at {companyName}</p>
          </div>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {mutation.isPending ? (
            <div className="text-center text-xs text-[#94a3b8] py-12 animate-pulse">Analyzing and Tailoring Resume...</div>
          ) : mutation.isError ? (
            <div className="text-center text-xs text-red-400 py-12">Failed to tailor: {(mutation.error as any).message}</div>
          ) : data ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-4 space-y-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Skills to Emphasize</span>
                  <div className="flex flex-wrap gap-1.5">
                    {data.skillsToEmphasize.length === 0 ? (
                      <span className="text-xs text-[#94a3b8]">None identified</span>
                    ) : (
                      data.skillsToEmphasize.map((s: string) => (
                        <span key={s} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded">
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-4 space-y-2">
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Missing Keywords</span>
                  <div className="flex flex-wrap gap-1.5">
                    {data.missingKeywords.length === 0 ? (
                      <span className="text-xs text-[#94a3b8]">None missing! Complete match.</span>
                    ) : (
                      data.missingKeywords.map((s: string) => (
                        <span key={s} className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded">
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-4 space-y-3">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Optimized Bullet Points</span>
                <ul className="text-xs text-[#94a3b8] list-disc list-inside space-y-2 leading-relaxed">
                  {data.betterBulletPoints.map((b: string, i: number) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Tailored Draft Output</span>
                <pre className="text-xs text-[#94a3b8] leading-relaxed whitespace-pre-wrap bg-[#1b2535] p-4 rounded-xl border border-[#232d3f] max-h-64 overflow-y-auto font-mono">
                  {data.tailoredResume}
                </pre>
              </div>
            </div>
          ) : null}
        </div>

        <div className="p-6 border-t border-[#232d3f] flex items-center justify-between shrink-0">
          <button
            onClick={handlePrint}
            disabled={!data}
            className="flex items-center gap-2 bg-[#1b2535] hover:bg-[#232d3f] border border-[#232d3f] text-white px-4 py-2 rounded-xl text-xs font-bold transition duration-200 cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4" /> Export PDF / Print
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              disabled={!data}
              className="flex items-center gap-2 bg-[#1b2535] hover:bg-[#232d3f] border border-[#232d3f] text-white px-4 py-2 rounded-xl text-xs font-bold transition duration-200 cursor-pointer disabled:opacity-50"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={onClose}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition duration-200 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
