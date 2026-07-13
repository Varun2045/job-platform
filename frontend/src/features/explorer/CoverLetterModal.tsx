import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Printer, Copy, Check } from 'lucide-react';

interface CoverLetterModalProps {
  jobHash: string;
  companyName: string;
  jobTitle: string;
  onClose: () => void;
}

export const CoverLetterModal: React.FC<CoverLetterModalProps> = ({ jobHash, companyName, jobTitle, onClose }) => {
  const [letter, setLetter] = useState('');
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/jobs/${jobHash}/cover-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: 'backend' })
      });
      if (!res.ok) throw new Error('Failed to generate cover letter');
      return res.json();
    },
    onSuccess: (data) => {
      setLetter(data.coverLetter);
    }
  });

  useEffect(() => {
    mutation.mutate();
  }, [jobHash]);

  const handleCopy = () => {
    navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Cover Letter - ${companyName}</title>
            <style>
              body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
              pre { white-space: pre-wrap; font-size: 14px; }
            </style>
          </head>
          <body>
            <pre>${letter}</pre>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl w-full max-w-2xl flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-[#232d3f] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Cover Letter Generator</h3>
            <p className="text-xs text-[#94a3b8]">Tailored for {jobTitle} at {companyName}</p>
          </div>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {mutation.isPending ? (
            <div className="text-center text-xs text-[#94a3b8] py-12 animate-pulse">Generating Cover Letter...</div>
          ) : mutation.isError ? (
            <div className="text-center text-xs text-red-400 py-12">Failed to generate: {(mutation.error as any).message}</div>
          ) : (
            <textarea
              value={letter}
              onChange={(e) => setLetter(e.target.value)}
              className="w-full h-80 bg-[#1b2535] border border-[#232d3f] rounded-xl p-4 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600 resize-none font-mono leading-relaxed"
            />
          )}
        </div>

        <div className="p-6 border-t border-[#232d3f] flex items-center justify-between shrink-0">
          <button
            onClick={handlePrint}
            disabled={!letter}
            className="flex items-center gap-2 bg-[#1b2535] hover:bg-[#232d3f] border border-[#232d3f] text-white px-4 py-2 rounded-xl text-xs font-bold transition duration-200 cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4" /> Export PDF / Print
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              disabled={!letter}
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
