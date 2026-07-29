import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Calendar, BookOpen, RefreshCw, CheckCircle2, AlertCircle, Clock, FileText, TrendingUp, Target, Zap } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader.js';

export const CopilotDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'brief' | 'gap'>('brief');

  // Skill Gap Roadmap Progress persistence state
  const [roadmapProgress, setRoadmapProgress] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('skill_gap_roadmap_progress');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleProgressChange = (taskId: string, newProgress: number) => {
    const updated = { ...roadmapProgress, [taskId]: newProgress };
    setRoadmapProgress(updated);
    try {
      localStorage.setItem('skill_gap_roadmap_progress', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save roadmap progress:', err);
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'intermediate':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'advanced':
      default:
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    }
  };

  const getTechnologyResources = (title: string, description: string = '') => {
    const text = `${title} ${description}`.toLowerCase();

    let docUrl = '';
    let tutUrl = '';
    let pracUrl = '';

    if (text.includes('react')) {
      docUrl = 'https://react.dev';
      tutUrl = 'https://www.youtube.com/watch?v=bMknfKXIFA8';
      pracUrl = 'https://react.dev/learn';
    } else if (text.includes('typescript')) {
      docUrl = 'https://www.typescriptlang.org/docs/';
      tutUrl = 'https://www.youtube.com/watch?v=d56mG7DezGs';
      pracUrl = 'https://www.typescriptlang.org/play';
    } else if (text.includes('node')) {
      docUrl = 'https://nodejs.org/docs/latest/api/';
      tutUrl = 'https://www.youtube.com/watch?v=TlB_eWDSMt4';
      pracUrl = 'https://nodeschool.io/';
    } else if (text.includes('docker')) {
      docUrl = 'https://docs.docker.com/';
      tutUrl = 'https://www.youtube.com/watch?v=3c-iBn73dDE';
      pracUrl = 'https://labs.play-with-docker.com/';
    } else if (text.includes('kubernetes') || text.includes('k8s')) {
      docUrl = 'https://kubernetes.io/docs/';
      tutUrl = 'https://www.youtube.com/watch?v=X48VuDVv0do';
      pracUrl = 'https://killercoda.com/playgrounds';
    } else if (text.includes('postgres') || text.includes('sql')) {
      docUrl = 'https://www.postgresql.org/docs/';
      tutUrl = 'https://www.youtube.com/watch?v=qw--VYLpxG4';
      pracUrl = 'https://sqlbolt.com/';
    } else if (text.includes('go') || text.includes('golang')) {
      docUrl = 'https://go.dev/doc/';
      tutUrl = 'https://www.youtube.com/watch?v=un6ZyFkqFKo';
      pracUrl = 'https://go.dev/tour/';
    } else if (text.includes('python')) {
      docUrl = 'https://docs.python.org/3/';
      tutUrl = 'https://www.youtube.com/watch?v=rfscVS0vtbw';
      pracUrl = 'https://futurecoder.io/';
    } else if (text.includes('fastapi')) {
      docUrl = 'https://fastapi.tiangolo.com/';
      tutUrl = 'https://www.youtube.com/watch?v=tLKKmouUams';
      pracUrl = 'https://fastapi.tiangolo.com/tutorial/';
    } else if (text.includes('next')) {
      docUrl = 'https://nextjs.org/docs/';
      tutUrl = 'https://www.youtube.com/watch?v=wm5gMKCORLk';
      pracUrl = 'https://nextjs.org/learn/';
    } else if (text.includes('aws') || text.includes('amazon')) {
      docUrl = 'https://docs.aws.amazon.com/';
      tutUrl = 'https://www.youtube.com/watch?v=ulprqHHWlng';
      pracUrl = 'https://aws.amazon.com/getting-started/hands-on/';
    } else {
      const topic = encodeURIComponent(title.replace(/^learn\s+/i, '').replace(/\s+fundamentals$/i, '').trim());
      docUrl = `https://devdocs.io/#q=${topic}`;
      tutUrl = `https://www.youtube.com/results?search_query=${topic}+tutorial+freecodecamp`;
      pracUrl = `https://scrimba.com/search?q=${topic}`;
    }

    return [
      { name: 'Documentation', url: docUrl },
      { name: 'Tutorial', url: tutUrl },
      { name: 'Practice', url: pracUrl }
    ];
  };

  const defaultRoadmapTasks = [
    {
      id: 'task-typescript',
      title: 'Learn TypeScript Fundamentals',
      description: 'Master static typing, interfaces, generics, type guards, and strict compiler configurations for production web applications.',
      estimatedHours: 8,
      estimatedTime: '6–8 hours',
      difficulty: 'Beginner'
    },
    {
      id: 'task-docker',
      title: 'Learn Docker Fundamentals',
      description: 'Containerize backend APIs and frontend applications using multi-stage Dockerfiles, Docker Compose networks, and registry publishing.',
      estimatedHours: 6,
      estimatedTime: '4–6 hours',
      difficulty: 'Intermediate'
    },
    {
      id: 'task-kubernetes',
      title: 'Learn Kubernetes Orchestration',
      description: 'Deploy, auto-scale, and manage container workloads using Pods, StatefulSets, Ingress Controllers, and Helm chart configurations.',
      estimatedHours: 12,
      estimatedTime: '10–12 hours',
      difficulty: 'Advanced'
    },
    {
      id: 'task-postgresql',
      title: 'Learn PostgreSQL Performance Tuning',
      description: 'Optimize complex relational database queries using B-tree/GIN indexes, EXPLAIN ANALYZE execution plans, and PgBouncer connection pooling.',
      estimatedHours: 7,
      estimatedTime: '5–7 hours',
      difficulty: 'Intermediate'
    }
  ];

  // Queries
  const { data: brief, isLoading: isBriefLoading } = useQuery({
    queryKey: ['copilot-brief'],
    queryFn: async () => {
      const res = await fetch('/api/copilot/daily-brief');
      if (!res.ok) throw new Error('Failed to load daily brief');
      return res.json();
    }
  });

  const { data: gap, isLoading: isGapLoading } = useQuery({
    queryKey: ['copilot-gap'],
    queryFn: async () => {
      const res = await fetch('/api/copilot/skill-gap');
      if (!res.ok) throw new Error('Failed to load skill gap');
      return res.json();
    }
  });

  const { refetch: refetchBrief } = useQuery({
    queryKey: ['copilot-brief'],
    queryFn: async () => {
      const res = await fetch('/api/copilot/daily-brief');
      if (!res.ok) throw new Error('Failed to load daily brief');
      return res.json();
    }
  });

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <PageHeader
        themeKey="careerCopilot"
        title="Career Copilot"
        description="Daily action items, skill gap analysis, and intelligent career recommendations."
        icon={Sparkles}
      />

      {/* Tabs */}
      <div className="flex border-b border-[#232d3f] gap-4">
        {[
          { id: 'brief', label: 'Daily Brief', icon: Calendar },
          { id: 'gap', label: 'Skill Gap Analysis', icon: BookOpen }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 pb-3 px-1 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === t.id
                ? 'border-indigo-600 text-white'
                : 'border-transparent text-[#94a3b8] hover:text-white'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Panel Body */}
      <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 min-h-[500px]">
        {activeTab === 'brief' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Your AI Daily Briefing</h2>
              <button
                onClick={() => refetchBrief()}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-semibold text-white transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Refresh Brief
              </button>
            </div>
            {isBriefLoading ? (
              <div className="animate-pulse space-y-2 text-[#94a3b8]">Compiling opportunities...</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* New Matching Jobs */}
                <div className="space-y-4">
                  <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-400" /> New Matching Jobs ({brief?.newJobsCount || 0})
                  </span>
                  <div className="space-y-3">
                    {brief?.bestOpportunities?.map((o: any, idx: number) => (
                      <div key={idx} className="p-4 bg-[#1b2535] border border-[#232d3f] rounded-xl flex justify-between items-center">
                        <div>
                          <span className="text-xs font-bold text-white block">{o.title}</span>
                          <span className="text-[10px] text-[#94a3b8]">{o.company}</span>
                        </div>
                        <span className="text-xs bg-indigo-600/10 text-indigo-400 font-bold px-2 py-1 rounded-lg">
                          {o.score}% Match
                        </span>
                      </div>
                    )) || <p className="text-xs text-[#6b7280]">No new matching jobs today.</p>}
                  </div>
                </div>

                {/* Jobs Expiring Today */}
                <div className="space-y-4">
                  <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400" /> Jobs Expiring Today ({brief?.expiringJobsCount || 0})
                  </span>
                  <div className="space-y-3">
                    {brief?.expiringJobs?.map((job: any, idx: number) => (
                      <div key={idx} className="p-4 bg-[#1b2535] border border-red-500/20 rounded-xl">
                        <span className="text-xs font-bold text-white block">{job.title}</span>
                        <span className="text-[10px] text-red-400">{job.company} - Expires today</span>
                      </div>
                    )) || <p className="text-xs text-[#6b7280]">No jobs expiring today.</p>}
                  </div>
                </div>

                {/* Applications Needing Follow-up */}
                <div className="space-y-4">
                  <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" /> Follow-up Needed ({brief?.applicationsToFollowUp?.length || 0})
                  </span>
                  <div className="space-y-3">
                    {brief?.applicationsToFollowUp?.length === 0 ? (
                      <p className="text-xs text-[#6b7280]">All application follow-ups are up to date.</p>
                    ) : (
                      brief?.applicationsToFollowUp?.map((a: any, idx: number) => (
                        <div key={idx} className="p-4 bg-[#1b2535] border border-[#232d3f] rounded-xl space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-white">{a.company}</span>
                            <span className="text-[10px] text-amber-400 font-semibold">{a.daysSinceApplied} days ago</span>
                          </div>
                          <p className="text-[10px] text-[#94a3b8]">Send recruiter check-in email.</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Upcoming Interviews */}
                <div className="space-y-4">
                  <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-400" /> Upcoming Interviews ({brief?.upcomingInterviews?.length || 0})
                  </span>
                  <div className="space-y-3">
                    {brief?.upcomingInterviews?.map((int: any, idx: number) => (
                      <div key={idx} className="p-4 bg-[#1b2535] border border-purple-500/20 rounded-xl">
                        <span className="text-xs font-bold text-white block">{int.company}</span>
                        <span className="text-[10px] text-purple-400">{int.date} at {int.time}</span>
                      </div>
                    )) || <p className="text-xs text-[#6b7280]">No upcoming interviews scheduled.</p>}
                  </div>
                </div>

                {/* OA Deadlines */}
                <div className="space-y-4">
                  <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400" /> OA Deadlines ({brief?.oaDeadlines?.length || 0})
                  </span>
                  <div className="space-y-3">
                    {brief?.oaDeadlines?.map((oa: any, idx: number) => (
                      <div key={idx} className="p-4 bg-[#1b2535] border border-amber-500/20 rounded-xl">
                        <span className="text-xs font-bold text-white block">{oa.company}</span>
                        <span className="text-[10px] text-amber-400">{oa.deadline}</span>
                      </div>
                    )) || <p className="text-xs text-[#6b7280]">No OA deadlines approaching.</p>}
                  </div>
                </div>

                {/* Referral Reminders */}
                <div className="space-y-4">
                  <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Referral Reminders ({brief?.referralReminders?.length || 0})
                  </span>
                  <div className="space-y-3">
                    {brief?.referralReminders?.map((ref: any, idx: number) => (
                      <div key={idx} className="p-4 bg-[#1b2535] border border-emerald-500/20 rounded-xl">
                        <span className="text-xs font-bold text-white block">{ref.contact}</span>
                        <span className="text-[10px] text-emerald-400">{ref.company} - {ref.action}</span>
                      </div>
                    )) || <p className="text-xs text-[#6b7280]">No referral reminders pending.</p>}
                  </div>
                </div>

                {/* Resume Recommendations */}
                <div className="space-y-4">
                  <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" /> Resume Recommendations
                  </span>
                  <div className="space-y-3">
                    {brief?.resumeRecommendations?.map((rec: any, idx: number) => (
                      <div key={idx} className="p-4 bg-[#1b2535] border border-cyan-500/20 rounded-xl">
                        <span className="text-xs font-bold text-white block">{rec.resume}</span>
                        <span className="text-[10px] text-cyan-400">{rec.reason}</span>
                      </div>
                    )) || <p className="text-xs text-[#6b7280]">No resume recommendations at this time.</p>}
                  </div>
                </div>

                {/* AI Insights */}
                <div className="space-y-4">
                  <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-400" /> AI Insights
                  </span>
                  <div className="space-y-3">
                    {brief?.careerInsights?.map((insight: string, idx: number) => (
                      <div key={idx} className="p-4 bg-[#1b2535] border border-indigo-500/10 rounded-xl flex gap-3">
                        <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0" />
                        <p className="text-xs text-[#94a3b8]">{insight}</p>
                      </div>
                    )) || <p className="text-xs text-[#6b7280]">No insights available.</p>}
                  </div>
                </div>

                {/* Daily Action Checklist */}
                <div className="space-y-4">
                  <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Daily Action Checklist
                  </span>
                  <div className="space-y-3">
                    {brief?.actionChecklist?.map((action: any, idx: number) => (
                      <div key={idx} className="p-4 bg-[#1b2535] border border-[#232d3f] rounded-xl flex items-center gap-3">
                        <input type="checkbox" className="rounded" />
                        <span className="text-xs text-white">{action.task}</span>
                      </div>
                    )) || <p className="text-xs text-[#6b7280]">No actions pending.</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'gap' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white">Skill Gap Analysis</h2>
            {isGapLoading ? (
              <div className="animate-pulse text-[#94a3b8]">Analyzing resume alignment...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Missing Skills */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Missing Skills</h3>
                  <div className="space-y-3">
                    {gap?.missingSkills?.map((item: any, idx: number) => (
                      <div key={idx} className="p-4 bg-[#1b2535] border border-[#232d3f] rounded-xl flex justify-between items-center">
                        <div>
                          <span className="text-xs font-bold text-white block">{item.skill}</span>
                          <span className="text-[10px] text-[#94a3b8]">Estimated Effort: {item.effortWeeks} weeks</span>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          item.priority === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {item.priority} Priority
                        </span>
                      </div>
                    )) || <p className="text-xs text-[#6b7280]">No missing skills identified.</p>}
                  </div>
                </div>

                {/* Weak Skills */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Weak Skills</h3>
                  <div className="space-y-3">
                    {gap?.weakSkills?.map((item: any, idx: number) => (
                      <div key={idx} className="p-4 bg-[#1b2535] border border-[#232d3f] rounded-xl flex justify-between items-center">
                        <div>
                          <span className="text-xs font-bold text-white block">{item.skill}</span>
                          <span className="text-[10px] text-[#94a3b8]">Current Level: {item.currentLevel}</span>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Needs Improvement
                        </span>
                      </div>
                    )) || <p className="text-xs text-[#6b7280]">No weak skills identified.</p>}
                  </div>
                </div>

                {/* Frequently Requested Skills */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Frequently Requested Skills</h3>
                  <div className="space-y-3">
                    {gap?.frequentlyRequestedSkills?.map((item: any, idx: number) => (
                      <div key={idx} className="p-4 bg-[#1b2535] border border-[#232d3f] rounded-xl flex justify-between items-center">
                        <div>
                          <span className="text-xs font-bold text-white block">{item.skill}</span>
                          <span className="text-[10px] text-[#94a3b8]">Found in {item.jobCount} job postings</span>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          High Demand
                        </span>
                      </div>
                    )) || <p className="text-xs text-[#6b7280]">No skill frequency data available.</p>}
                  </div>
                </div>

                {/* Recommended Learning Order */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Recommended Learning Order</h3>
                  <div className="space-y-3">
                    {gap?.learningOrder?.map((item: any, idx: number) => (
                      <div key={idx} className="p-4 bg-[#1b2535] border border-[#232d3f] rounded-xl flex items-center gap-3">
                        <span className="text-xs font-bold text-indigo-400">#{idx + 1}</span>
                        <div className="flex-1">
                          <span className="text-xs font-bold text-white block">{item.skill}</span>
                          <span className="text-[10px] text-[#94a3b8]">{item.reason}</span>
                        </div>
                      </div>
                    )) || <p className="text-xs text-[#6b7280]">No learning order recommendations available.</p>}
                  </div>
                </div>

                {/* Learning Roadmap */}
                <div className="space-y-4 md:col-span-2">
                  {(() => {
                    const rawTasks = gap?.roadmapTasks && gap.roadmapTasks.length > 0 ? gap.roadmapTasks : defaultRoadmapTasks;
                    const tasks = rawTasks.map((t: any) => ({
                      ...t,
                      estimatedTime: t.estimatedTime || (t.estimatedHours ? `${Math.max(1, Math.round(t.estimatedHours * 0.7))}–${t.estimatedHours} hours` : '6–8 hours'),
                      difficulty: t.difficulty || (t.estimatedHours > 10 ? 'Advanced' : t.estimatedHours > 5 ? 'Intermediate' : 'Beginner'),
                      resources: getTechnologyResources(t.title, t.description)
                    }));

                    const completedTasks = tasks.filter((t: any) => (roadmapProgress[t.id] ?? (t.completed ? 100 : 0)) === 100).length;
                    const overallPercentage = Math.round((completedTasks / tasks.length) * 100);

                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-2">
                            <Target className="w-4 h-4 text-indigo-400" /> Learning Roadmap
                          </h3>
                          <div className="flex items-center gap-3 text-xs font-semibold">
                            <span className="text-[#94a3b8]">Roadmap Completion:</span>
                            <span className="text-emerald-400 font-mono font-bold">{completedTasks} / {tasks.length} ({overallPercentage}%)</span>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {tasks.map((t: any) => {
                            const currentProgress = roadmapProgress[t.id] ?? (t.completed ? 100 : 0);
                            const isComplete = currentProgress === 100;

                            return (
                              <div
                                key={t.id}
                                className={`p-5 bg-[#1b2535] border rounded-xl space-y-4 transition-all duration-200 ${
                                  isComplete
                                    ? 'border-emerald-500/40 bg-emerald-950/10 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                                    : 'border-[#232d3f] hover:border-indigo-600/30'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-3">
                                    {isComplete ? (
                                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                    ) : (
                                      <div className="w-5 h-5 rounded-full border-2 border-slate-600 shrink-0 mt-0.5" />
                                    )}
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2.5 flex-wrap">
                                        <span className={`text-sm font-bold ${isComplete ? 'text-emerald-300 line-through opacity-90' : 'text-white'}`}>
                                          {t.title}
                                        </span>
                                        {isComplete && (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                            ✓ Completed
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-[#94a3b8] leading-relaxed">{t.description}</p>
                                    </div>
                                  </div>

                                  {/* Mark Complete Action Button */}
                                  <button
                                    onClick={() => handleProgressChange(t.id, isComplete ? 0 : 100)}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                                      isComplete
                                        ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-rose-500/20 hover:border-rose-500/30 hover:text-rose-300'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                                    }`}
                                  >
                                    {isComplete ? 'Completed ✓' : 'Mark Complete'}
                                  </button>
                                </div>

                                {/* 1. Estimated Time & Difficulty */}
                                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#232d3f]/60 text-xs">
                                  <div className="flex items-center gap-4 flex-wrap">
                                    <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                      <span className="text-[#94a3b8]">Estimated Time:</span>
                                      <strong className="text-white font-mono">{t.estimatedTime}</strong>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[#94a3b8]">Difficulty:</span>
                                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${getDifficultyBadge(t.difficulty)}`}>
                                        {t.difficulty}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Resources Links */}
                                  <div className="flex items-center gap-2">
                                    {t.resources.map((res: any, idx: number) => (
                                      <a
                                        key={idx}
                                        href={res.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] font-semibold px-2 py-1 rounded bg-[#131a26] border border-[#232d3f] text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors flex items-center gap-1"
                                      >
                                        <BookOpen className="w-2.5 h-2.5" />
                                        {res.name}
                                      </a>
                                    ))}
                                  </div>
                                </div>

                                {/* 2. Visual Progress Bar & Percentage */}
                                <div className="space-y-1.5 pt-1">
                                  <div className="flex justify-between items-center text-[11px] font-semibold">
                                    <span className="text-[#94a3b8]">Progress</span>
                                    <span className={`font-mono font-bold ${isComplete ? 'text-emerald-400' : 'text-indigo-400'}`}>
                                      {currentProgress}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-[#0d131f] border border-[#232d3f] h-2 rounded-full overflow-hidden p-0.5">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        isComplete
                                          ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]'
                                          : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                                      }`}
                                      style={{ width: `${currentProgress}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Suggested Courses */}
                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Suggested Courses</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {gap?.suggestedCourses?.map((course: any, idx: number) => (
                      <div key={idx} className="p-4 bg-[#1b2535] border border-[#232d3f] rounded-xl">
                        <span className="text-xs font-bold text-white block">{course.name}</span>
                        <span className="text-[10px] text-[#94a3b8]">{course.platform}</span>
                        <span className="text-[9px] text-emerald-400 mt-2 block font-semibold">{course.duration}</span>
                      </div>
                    )) || <p className="text-xs text-[#6b7280]">No course suggestions available.</p>}
                  </div>
                </div>

                {/* Practice Projects */}
                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Practice Projects</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {gap?.practiceProjects?.map((project: any, idx: number) => (
                      <div key={idx} className="p-4 bg-[#1b2535] border border-[#232d3f] rounded-xl">
                        <span className="text-xs font-bold text-white block">{project.name}</span>
                        <p className="text-[10px] text-[#94a3b8] mt-1">{project.description}</p>
                        <span className="text-[9px] text-purple-400 mt-2 block font-semibold">Difficulty: {project.difficulty}</span>
                      </div>
                    )) || <p className="text-xs text-[#6b7280]">No project suggestions available.</p>}
                  </div>
                </div>

                {/* Certifications */}
                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Recommended Certifications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {gap?.certifications?.map((cert: any, idx: number) => (
                      <div key={idx} className="p-4 bg-[#1b2535] border border-[#232d3f] rounded-xl">
                        <span className="text-xs font-bold text-white block">{cert.name}</span>
                        <span className="text-[10px] text-[#94a3b8]">{cert.provider}</span>
                        <span className="text-[9px] text-amber-400 mt-2 block font-semibold">{cert.duration}</span>
                      </div>
                    )) || <p className="text-xs text-[#6b7280]">No certification recommendations available.</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default CopilotDashboard;
