import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Award, BookOpen, UserCheck, Flame, ListChecks, HelpCircle } from 'lucide-react';

interface InterviewPrepPanelProps {
  jobHash: string;
  companyName: string;
  jobTitle: string;
  onClose: () => void;
}

export const InterviewPrepPanel: React.FC<InterviewPrepPanelProps> = ({ jobHash, companyName, jobTitle, onClose }) => {
  const [completedItems, setCompletedItems] = useState<Record<number, boolean>>({});

  const { data: prep, isLoading, error } = useQuery({
    queryKey: ['job-prep', jobHash],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${jobHash}/prep?profile=backend`);
      if (!res.ok) throw new Error('Failed to load interview prep guide');
      return res.json();
    }
  });

  const toggleCheck = (idx: number) => {
    setCompletedItems(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl w-full max-w-2xl p-12 text-center text-[#94a3b8] animate-pulse">
          Generating Interview Prep Guide...
        </div>
      </div>
    );
  }

  if (error || !prep) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl w-full max-w-2xl p-12 text-center text-red-400">
          Failed to generate: {(error as any).message}
        </div>
      </div>
    );
  }

  const { technicalQuestions, behavioralQuestions, companyResearch, starExamples, prepChecklist, resources, difficultyScore } = prep;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl w-full max-w-3xl flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-[#232d3f] flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white">Interview Preparation</h3>
            <p className="text-xs text-[#94a3b8]">Targeted guidelines for {jobTitle} at {companyName}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-[#1b2535] border border-[#232d3f] px-2.5 py-1 rounded-lg">
              <Flame className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-white">Difficulty: {difficultyScore}/10</span>
            </div>
            <button onClick={onClose} className="text-[#94a3b8] hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-6 text-xs text-[#94a3b8]">
          <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-4 space-y-2">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" /> Company Background Research
            </span>
            <p className="leading-relaxed">{companyResearch}</p>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-purple-400" /> Key Technical Questions
            </span>
            <div className="space-y-2">
              {technicalQuestions.map((q: string, i: number) => (
                <div key={i} className="p-3 bg-[#1b2535] border border-[#232d3f] rounded-xl flex items-start gap-3">
                  <span className="font-bold text-indigo-400 shrink-0">Q{i + 1}:</span>
                  <p className="text-white leading-relaxed">{q}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" /> Suggested Behavioral Questions
            </span>
            <div className="space-y-2">
              {behavioralQuestions.map((q: string, i: number) => (
                <div key={i} className="p-3 bg-[#1b2535] border border-[#232d3f] rounded-xl flex items-start gap-3">
                  <span className="font-bold text-emerald-400 shrink-0">Q{i + 1}:</span>
                  <p className="text-white leading-relaxed">{q}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" /> STAR Response Templates
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {starExamples.map((ex: string, i: number) => (
                <div key={i} className="p-4 bg-[#1b2535] border border-[#232d3f] rounded-xl whitespace-pre-wrap leading-relaxed">
                  {ex}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-indigo-400" /> Checklist Progress
            </span>
            <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-4 space-y-2">
              {prepChecklist.map((item: string, i: number) => (
                <label key={i} className="flex items-center gap-3 py-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!completedItems[i]}
                    onChange={() => toggleCheck(i)}
                    className="w-4 h-4 rounded border-[#232d3f] text-indigo-600 focus:ring-indigo-500 bg-[#131a26]"
                  />
                  <span className={`text-xs ${completedItems[i] ? 'line-through text-[#6b7280]' : 'text-white'}`}>{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Recommended Preparation Resources</span>
            <div className="grid grid-cols-2 gap-3">
              {resources.map((res: string, i: number) => (
                <div key={i} className="p-3 bg-[#1b2535] border border-[#232d3f] rounded-xl flex items-center gap-2 text-white">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0"></span>
                  <span>{res}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-[#232d3f] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-xs font-bold transition duration-200 cursor-pointer"
          >
            Close Preparation Guide
          </button>
        </div>
      </div>
    </div>
  );
};
