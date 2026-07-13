import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Send, FileText, Target, BookOpen, MessageSquare, TrendingUp, DollarSign, Briefcase, Building2, GraduationCap } from 'lucide-react';

type Capability = 'resume' | 'match' | 'cover-letter' | 'interview' | 'referral' | 'career' | 'salary' | 'skills' | 'mock' | 'company';

const CAPABILITIES: { id: Capability; name: string; icon: any; description: string }[] = [
  { id: 'resume', name: 'Resume Review', icon: FileText, description: 'Get AI feedback on your resume' },
  { id: 'match', name: 'Job Match Explanation', icon: Target, description: 'Understand why a job matches your profile' },
  { id: 'cover-letter', name: 'Cover Letter Help', icon: MessageSquare, description: 'Generate or improve cover letters' },
  { id: 'interview', name: 'Interview Preparation', icon: Briefcase, description: 'Get tips and practice questions' },
  { id: 'referral', name: 'Referral Advice', icon: Building2, description: 'Guidance on referral outreach' },
  { id: 'career', name: 'Career Guidance', icon: TrendingUp, description: 'General career advice and planning' },
  { id: 'salary', name: 'Salary Negotiation', icon: DollarSign, description: 'Tips for negotiating compensation' },
  { id: 'skills', name: 'Skill Recommendations', icon: BookOpen, description: 'Identify skills to learn' },
  { id: 'mock', name: 'Mock Interview', icon: GraduationCap, description: 'Practice with AI interviewer' },
  { id: 'company', name: 'Company Research', icon: Building2, description: 'Learn about target companies' },
];

export const AICareerAssistant: React.FC = () => {
  const [selectedCapability, setSelectedCapability] = useState<Capability | null>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ sender: 'user' | 'assistant'; text: string }[]>([
    { sender: 'assistant', text: 'Hello! I\'m your AI Career Assistant. Select a capability above or ask me anything about your job search, career development, or interview preparation.' }
  ]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch('/api/career-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, capability: selectedCapability })
      });
      if (!res.ok) throw new Error('Failed to get response');
      return res.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, { sender: 'assistant', text: data.response }]);
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
    <div className="p-8 space-y-6 max-w-6xl mx-auto h-screen flex flex-col">
      <div className="shrink-0">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-indigo-400" /> AI Career Assistant
        </h1>
        <p className="text-sm text-[#94a3b8]">Your personal AI career coach for job search, interviews, and career growth</p>
      </div>

      {/* Capability Selection */}
      <div className="shrink-0 bg-[#131a26] border border-[#232d3f] rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white mb-4">Select a Capability</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {CAPABILITIES.map(cap => (
            <button
              key={cap.id}
              onClick={() => handleCapabilitySelect(cap.id)}
              className={`p-4 rounded-xl border transition-all ${
                selectedCapability === cap.id
                  ? 'bg-indigo-600/10 border-indigo-600/30 text-indigo-400'
                  : 'bg-[#1b2535] border-[#232d3f] text-[#94a3b8] hover:border-indigo-600/30 hover:text-white'
              }`}
            >
              <cap.icon className="w-6 h-6 mx-auto mb-2" />
              <span className="text-xs font-semibold block text-center">{cap.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 bg-[#131a26] border border-[#232d3f] rounded-2xl flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2xl p-4 rounded-2xl text-sm space-y-1 ${
                msg.sender === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-[#1b2535] border border-[#232d3f] text-[#94a3b8] rounded-tl-none'
              }`}>
                {msg.sender === 'assistant' && (
                  <span className="text-[10px] font-black text-indigo-400 block uppercase mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI Career Assistant
                  </span>
                )}
                <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-[#1b2535] border border-[#232d3f] text-[#94a3b8] rounded-2xl rounded-tl-none p-4 text-sm">
                <span className="text-[10px] font-black text-indigo-400 block uppercase mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Career Assistant
                </span>
                <p className="animate-pulse">Thinking...</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="shrink-0 px-6 py-3 border-t border-[#232d3f]">
          <div className="flex gap-2 flex-wrap">
            {[
              'Review my resume',
              'How should I prepare for interviews?',
              'What salary should I ask for?',
              'Help me write a cover letter',
              'What skills should I learn?'
            ].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => { setInput(prompt); }}
                className="bg-[#1b2535] hover:bg-[#232d3f] border border-[#232d3f] text-[#94a3b8] hover:text-white text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer transition"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="shrink-0 p-6 border-t border-[#232d3f]">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Ask me anything about your career..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-[#1b2535] border border-[#232d3f] rounded-xl px-4 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || chatMutation.isPending}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl cursor-pointer transition"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
