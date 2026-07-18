import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Calendar, BookOpen, RefreshCw, CheckCircle2, AlertCircle, Clock, FileText, TrendingUp, Target, Zap } from 'lucide-react';

export const CopilotDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'brief' | 'gap'>('brief');

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
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-indigo-400" /> Career Copilot
        </h1>
        <p className="text-sm text-[#94a3b8]">AI autonomous agent tracking your career milestones, mock interviews, and skill roadmaps</p>
      </div>

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
                  <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Learning Roadmap</h3>
                  <div className="space-y-3">
                    {gap?.roadmapTasks?.map((t: any) => (
                      <div key={t.id} className="p-4 bg-[#1b2535] border border-[#232d3f] rounded-xl flex gap-3">
                        <CheckCircle2 className="w-5 h-5 text-[#6b7280] shrink-0" />
                        <div className="flex-1">
                          <span className="text-xs font-bold text-white block">{t.title}</span>
                          <p className="text-[10px] text-[#94a3b8] mt-1">{t.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-[9px] text-indigo-400 font-semibold">Effort: {t.estimatedHours} study hours</span>
                            <span className="text-[9px] text-cyan-400 font-semibold">Est. Completion: {t.estimatedWeeks} weeks</span>
                          </div>
                        </div>
                      </div>
                    )) || <p className="text-xs text-[#6b7280]">No roadmap tasks available.</p>}
                  </div>
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
