import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Send, FileText, Target, BookOpen, MessageSquare, TrendingUp, DollarSign, Briefcase, Building2, GraduationCap, Award, Mail, Bot } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader.js';

type Capability = 'resume' | 'match' | 'cover-letter' | 'interview' | 'referral' | 'career' | 'salary' | 'skills' | 'mock' | 'company' | 'linkedin-opt' | 'cold-email';

const CAPABILITIES: { id: Capability; name: string; icon: any; description: string; color: string; bgClass: string; borderClass: string }[] = [
  { id: 'resume', name: 'Resume Review', icon: FileText, description: 'Get AI feedback on your resume', color: 'text-blue-400', bgClass: 'bg-blue-500/10 border-blue-500/30 text-blue-400', borderClass: 'hover:border-blue-500/30 hover:bg-blue-500/5' },
  { id: 'match', name: 'Job Match Explanation', icon: Target, description: 'Understand why a job matches your profile', color: 'text-emerald-400', bgClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', borderClass: 'hover:border-emerald-500/30 hover:bg-emerald-500/5' },
  { id: 'cover-letter', name: 'Cover Letter Help', icon: MessageSquare, description: 'Generate or improve cover letters', color: 'text-purple-400', bgClass: 'bg-purple-500/10 border-purple-500/30 text-purple-400', borderClass: 'hover:border-purple-500/30 hover:bg-purple-500/5' },
  { id: 'interview', name: 'Interview Preparation', icon: Briefcase, description: 'Get tips and practice questions', color: 'text-amber-400', bgClass: 'bg-amber-500/10 border-amber-500/30 text-amber-400', borderClass: 'hover:border-amber-500/30 hover:bg-amber-500/5' },
  { id: 'referral', name: 'Referral Advice', icon: Building2, description: 'Guidance on referral outreach', color: 'text-red-400', bgClass: 'bg-red-500/10 border-red-500/30 text-red-400', borderClass: 'hover:border-red-500/30 hover:bg-red-500/5' },
  { id: 'career', name: 'Career Guidance', icon: TrendingUp, description: 'General career advice and planning', color: 'text-pink-400', bgClass: 'bg-pink-500/10 border-pink-500/30 text-pink-400', borderClass: 'hover:border-pink-500/30 hover:bg-pink-500/5' },
  { id: 'salary', name: 'Salary Negotiation', icon: DollarSign, description: 'Tips for negotiating compensation', color: 'text-green-400', bgClass: 'bg-green-500/10 border-green-500/30 text-green-400', borderClass: 'hover:border-green-500/30 hover:bg-green-500/5' },
  { id: 'skills', name: 'Skill Recommendations', icon: BookOpen, description: 'Identify skills to learn', color: 'text-cyan-400', bgClass: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400', borderClass: 'hover:border-cyan-500/30 hover:bg-cyan-500/5' },
  { id: 'mock', name: 'Mock Interview', icon: GraduationCap, description: 'Practice with AI interviewer', color: 'text-rose-400', bgClass: 'bg-rose-500/10 border-rose-500/30 text-rose-400', borderClass: 'hover:border-rose-500/30 hover:bg-rose-500/5' },
  { id: 'company', name: 'Company Research', icon: Building2, description: 'Learn about target companies', color: 'text-indigo-400', bgClass: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400', borderClass: 'hover:border-indigo-500/30 hover:bg-indigo-500/5' },
  { id: 'linkedin-opt', name: 'LinkedIn Optimizer', icon: Award, description: 'Improve your LinkedIn profile and visibility', color: 'text-teal-400', bgClass: 'bg-teal-500/10 border-teal-500/30 text-teal-400', borderClass: 'hover:border-teal-500/30 hover:bg-teal-500/5' },
  { id: 'cold-email', name: 'Cold Email Generator', icon: Mail, description: 'Draft high-converting outreach messages', color: 'text-orange-400', bgClass: 'bg-orange-500/10 border-orange-500/30 text-orange-400', borderClass: 'hover:border-orange-500/30 hover:bg-orange-500/5' },
];

export const AICareerAssistant: React.FC = () => {
  const [selectedCapability, setSelectedCapability] = useState<Capability | null>(null);
  const [input, setInput] = useState('');
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    'Review my resume',
    'How should I prepare for interviews?',
    'What salary should I ask for?',
    'Help me write a cover letter',
    'What skills should I learn?'
  ]);
  const [messages, setMessages] = useState<{ sender: 'user' | 'assistant'; text: string }[]>([
    { sender: 'assistant', text: 'Hello! I\'m your AI Career Assistant. Select a capability from the panel on the left or ask me anything about your job search, career development, or interview preparation.' }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, capability: selectedCapability })
      });
      if (!res.ok) throw new Error('Failed to get response');
      return res.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, { sender: 'assistant', text: data.answer }]);
      if (data.suggestedPrompts && data.suggestedPrompts.length > 0) {
        setSuggestedPrompts(data.suggestedPrompts);
      }
    },
    onError: () => {
      setMessages(prev => [...prev, { sender: 'assistant', text: 'Sorry, I encountered an error. Please try again.' }]);
    }
  });

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { sender: 'user', text: input }]);
    const messageToSend = input;
    setInput('');
    chatMutation.mutate(messageToSend);
  };

  const handleCapabilitySelect = (capability: Capability) => {
    setSelectedCapability(capability);
    const cap = CAPABILITIES.find(c => c.id === capability);
    setMessages(prev => [...prev, { sender: 'assistant', text: `I can help you with ${cap?.name}. ${cap?.description}. What would you like to know?` }]);
  };

  return (
    <div className="pt-8 px-8 pb-4 space-y-6 max-w-7xl mx-auto h-[calc(100vh-1.5rem)] flex flex-col">
      <PageHeader
        themeKey="careerAssistant"
        title="AI Career Assistant"
        description="Your personal AI career coach for job search, interviews, and career growth"
        icon={Bot}
      />

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Panel: Capability Selection */}
        <div className="flex-1 bg-[#131a26]/50 backdrop-blur-md border border-[#232d3f] rounded-2xl p-5 shadow-xl flex flex-col overflow-hidden">
          <h2 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider mb-4 flex items-center gap-2 shrink-0">
            <Target className="w-4 h-4 text-indigo-400" /> Select a Capability
          </h2>
          <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 pr-1 custom-scrollbar content-start">
            {CAPABILITIES.map(cap => {
              const isSelected = selectedCapability === cap.id;
              return (
                <button
                  key={cap.id}
                  onClick={() => handleCapabilitySelect(cap.id)}
                  className={`w-full p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center gap-3 group text-left ${
                    isSelected
                      ? `${cap.bgClass} shadow-[0_0_15px_rgba(99,102,241,0.12)] scale-[1.01]`
                      : `bg-[#1b2535]/40 border-[#232d3f] text-[#94a3b8] ${cap.borderClass}`
                  }`}
                >
                  <cap.icon className={`w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                    isSelected ? cap.color : 'text-[#475569] group-hover:text-white'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <span className={`text-[11px] font-bold block truncate ${
                      isSelected ? 'text-white' : 'text-[#cbd5e1] group-hover:text-white'
                    }`}>{cap.name}</span>
                    <span className="text-[9px] text-[#6b7280] group-hover:text-[#94a3b8] block truncate mt-0.5">{cap.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Chat Interface */}
        <div className="flex-1 bg-[#131a26]/30 backdrop-blur-md border border-[#232d3f] rounded-2xl flex flex-col overflow-hidden shadow-2xl relative">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-2xl w-fit p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${
                  isUser 
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tr-none' 
                    : 'bg-[#1b2535]/80 border border-[#232d3f] text-[#cbd5e1] rounded-tl-none border-l-2 border-l-indigo-500'
                }`}>
                    {!isUser && (
                      <span className="text-[10px] font-black text-indigo-400 block uppercase mb-1.5 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> AI Coach
                      </span>
                    )}
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>
              );
            })}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-[#1b2535]/80 border border-[#232d3f] text-[#cbd5e1] rounded-2xl rounded-tl-none border-l-2 border-l-indigo-500 p-4 text-xs shadow-sm">
                  <span className="text-[10px] font-black text-indigo-400 block uppercase mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" /> AI Coach
                  </span>
                  <div className="flex items-center gap-1 py-1">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 px-6 py-2 border-t border-[#232d3f]/60 bg-[#131a26]/20">
            <div className="flex gap-2 flex-wrap">
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => { setInput(prompt); }}
                  className="bg-[#1b2535]/60 hover:bg-[#232d3f]/80 border border-[#232d3f] text-[#94a3b8] hover:text-white text-[10px] font-semibold px-3 py-1 rounded-full cursor-pointer transition duration-150 shadow-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

        {/* Input */}
        <div className="shrink-0 py-2.5 px-4 border-t border-[#232d3f]/60 bg-[#131a26]/40">
          <div className="flex gap-2 items-center bg-[#1b2535]/80 border border-[#232d3f] rounded-xl p-1 pl-3 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20 transition duration-200 shadow-inner">
            <input
              type="text"
              placeholder="Ask me anything about your career..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-transparent border-none text-xs text-white placeholder-[#4b5563] focus:outline-none focus:ring-0 py-1"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || chatMutation.isPending}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-[#131a26] disabled:text-[#475569] disabled:cursor-not-allowed text-white rounded-lg cursor-pointer transition shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};
