import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, MapPin, Briefcase, Globe, ExternalLink, ArrowRight, X, Sparkles, FileText, CheckSquare, Users, MessageSquare, Star, Mail } from 'lucide-react';
import { CardSkeleton } from '../../components/Skeleton.js';
import { CoverLetterModal } from './CoverLetterModal.js';
import { ResumeTailoringModal } from './ResumeTailoringModal.js';
import { InterviewPrepPanel } from './InterviewPrepPanel.js';
import { useNavigate } from 'react-router-dom';

export const JobExplorer: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [search, setSearch] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [location, setLocation] = useState('');
  const [remote, setRemote] = useState('all');
  const [minScore, setMinScore] = useState('0');
  const [experience, setExperience] = useState('all');
  const [department, setDepartment] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedJobHash, setSelectedJobHash] = useState<string | null>(null);
  const [trackNotes, setTrackNotes] = useState('');
  const [sortBy, setSortBy] = useState<'opportunity' | 'match'>('opportunity');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchQuery);
    }, 200);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Debounce location input
  useEffect(() => {
    const handler = setTimeout(() => {
      setLocation(locationQuery);
    }, 200);
    return () => clearTimeout(handler);
  }, [locationQuery]);

  // Modals visibility state
  const [openCoverLetter, setOpenCoverLetter] = useState(false);
  const [openTailor, setOpenTailor] = useState(false);
  const [openPrep, setOpenPrep] = useState(false);

  // Fetch Jobs List directly from backend search engine (queries 100% of jobs in 100ms)
  const { data: jobsData, isLoading: isJobsLoading } = useQuery({
    queryKey: ['jobs', search, location, remote, minScore, experience, department, sortBy, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        technology: search,
        location,
        remote: remote === 'all' ? '' : String(remote === 'true'),
        minScore: minScore === '0' ? '' : minScore,
        experience: experience === 'all' ? '' : experience,
        department: department === 'all' ? '' : department,
        sort: sortBy,
        page: String(page),
        limit: '6'
      });
      const res = await fetch(`/api/jobs?${params}`);
      if (!res.ok) throw new Error('Failed to fetch job postings');
      return res.json();
    }
  });

  // Fetch Selected Job Detail
  const { data: detailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ['job-details', selectedJobHash],
    queryFn: async () => {
      if (!selectedJobHash) return null;
      const res = await fetch(`/api/jobs/${selectedJobHash}`);
      if (!res.ok) throw new Error('Failed to load job details');
      return res.json();
    },
    enabled: !!selectedJobHash
  });

  // Fetch AI Analysis Detail
  const { data: analysisData, isLoading: isAnalysisLoading } = useQuery({
    queryKey: ['job-analysis', selectedJobHash],
    queryFn: async () => {
      if (!selectedJobHash) return null;
      const res = await fetch(`/api/jobs/${selectedJobHash}/analysis`);
      if (!res.ok) throw new Error('Failed to load job analysis');
      return res.json();
    },
    enabled: !!selectedJobHash
  });

  // Track Application mutation
  const trackMutation = useMutation({
    mutationFn: async (status: string) => {
      if (!detailData) return;
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobHash: selectedJobHash,
          company: detailData.job.company,
          jobId: detailData.job.id,
          status,
          notes: trackNotes
        })
      });
      if (!res.ok) throw new Error('Failed to save application tracker status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setTrackNotes('');
      alert('Application tracked successfully!');
    }
  });

  const handleTrackSubmit = (status: string) => {
    trackMutation.mutate(status);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto flex flex-col min-h-screen relative">
      {/* Page Title */}
      <div>
        <h1 className="text-fluid-title font-extrabold text-white tracking-tight">Job Explorer</h1>
        <p className="text-sm text-[#94a3b8]">Search, rank by Opportunity Score, and tailoring your applications</p>
      </div>

      {/* Advanced Filter Panel */}
      <div className="grid-fluid-stats gap-4 bg-[#131a26] border border-[#232d3f] rounded-2xl p-6">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Search Keyword</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="e.g. React, Node, Go..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Location</label>
          <input
            type="text"
            placeholder="e.g. USA, Pune..."
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Remote Status</label>
          <select
            value={remote}
            onChange={(e) => { setRemote(e.target.value); setPage(1); }}
            className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-600"
          >
            <option value="all">All</option>
            <option value="true">Remote Only</option>
            <option value="false">Onsite / Hybrid</option>
          </select>
        </div>


        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Experience Level</label>
          <select
            value={experience}
            onChange={(e) => { setExperience(e.target.value); setPage(1); }}
            className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-600"
          >
            <option value="all">All Levels</option>
            <option value="Early Career">Early Career</option>
            <option value="Mid Level">Mid Level</option>
            <option value="Senior">Senior / Lead</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Min Score</label>
          <select
            value={minScore}
            onChange={(e) => { setMinScore(e.target.value); setPage(1); }}
            className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-600"
          >
            <option value="0">All Scores</option>
            <option value="70">70% or Higher</option>
            <option value="80">80% or Higher</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Sort Ranking</label>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as any); setPage(1); }}
            className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-600 font-bold text-indigo-400"
          >
            <option value="opportunity">Opportunity Score</option>
            <option value="match">Resume Match Only</option>
          </select>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 cols: Jobs list */}
        <div className="lg:col-span-2 space-y-6">
          {isJobsLoading ? (
            <div className="grid grid-cols-1 gap-6">
              {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
            </div>
          ) : !jobsData || jobsData.jobs.length === 0 ? (
            <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-12 text-center text-[#94a3b8]">
              No matching job listings found. Try relaxing your filter tags.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {jobsData.jobs.map(({ job, score, opportunityScore }: any) => (
                  <div
                    key={job.jobHash}
                    onClick={() => setSelectedJobHash(job.jobHash)}
                    className={`bg-[#131a26] border rounded-2xl p-6 hover:border-indigo-600 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      selectedJobHash === job.jobHash ? 'border-indigo-600 ring-2 ring-indigo-600/20' : 'border-[#232d3f]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">{job.company}</span>
                        <h3 className="text-lg font-bold text-white mt-1">{job.title}</h3>
                      </div>
                      <div className="flex gap-2">
                        <span className="bg-indigo-600/10 border border-indigo-600/20 text-[#818cf8] font-bold px-3 py-1.5 rounded-full text-xs">
                          {opportunityScore}% Opportunity
                        </span>
                        <span className="bg-[#1b2535] border border-[#232d3f] text-[#94a3b8] font-bold px-3 py-1.5 rounded-full text-xs">
                          {score}% Match
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="text-xs bg-[#1b2535] border border-[#232d3f] px-2.5 py-1 rounded-lg text-[#94a3b8] flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {job.location}
                      </span>
                      <span className="text-xs bg-[#1b2535] border border-[#232d3f] px-2.5 py-1 rounded-lg text-[#94a3b8] flex items-center gap-1">
                        <Briefcase className="w-3 h-3" /> {job.experience}
                      </span>
                      {job.isRemote && (
                        <span className="text-xs bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg text-indigo-400 flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Remote
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-[#232d3f]">
                      <span className="text-xs text-[#94a3b8]">Posted: {new Date(job.datePosted).toLocaleDateString()}</span>
                      <div className="flex gap-2">
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition duration-200 cursor-pointer"
                        >
                          Apply <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/referrals`);
                          }}
                          className="flex items-center gap-1.5 bg-[#0077b5] hover:bg-[#006097] text-white font-bold text-xs px-3.5 py-2 rounded-xl transition duration-200 cursor-pointer"
                          title="Find Referrals"
                        >
                          <Users className="w-3 h-3" /> Referrals
                        </button>
                      </div>
                    </div>

                    {/* Referral Quick Actions */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-[#232d3f]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/referrals`);
                        }}
                        className="flex items-center gap-1 text-xs text-[#94a3b8] hover:text-indigo-400 transition-colors"
                      >
                        <Users className="w-3 h-3" /> View Recruiters
                      </button>
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(`${job.company} LinkedIn company`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-[#94a3b8] hover:text-indigo-400 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> Company LinkedIn
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/referrals`);
                        }}
                        className="flex items-center gap-1 text-xs text-[#94a3b8] hover:text-indigo-400 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" /> Generate Message
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {jobsData.pages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-3.5 py-2 bg-[#131a26] border border-[#232d3f] text-[#94a3b8] rounded-xl text-xs font-semibold disabled:opacity-50 hover:bg-[#1b2535] cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-[#94a3b8]">Page {page} of {jobsData.pages}</span>
                  <button
                    disabled={page === jobsData.pages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3.5 py-2 bg-[#131a26] border border-[#232d3f] text-[#94a3b8] rounded-xl text-xs font-semibold disabled:opacity-50 hover:bg-[#1b2535] cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right 1 col: Job details & Department Explorer drawer panel */}
        <div className="space-y-6 sticky top-8">
          <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 h-fit">
          {!selectedJobHash ? (
            <div className="py-12 text-center text-[#94a3b8] space-y-2">
              <ArrowRight className="w-8 h-8 mx-auto text-indigo-500 animate-pulse" />
              <div className="text-sm font-semibold">Select a Job Posting</div>
              <p className="text-xs">Click on any posting card in explorer list to review details and AI tools</p>
            </div>
          ) : isDetailLoading || !detailData ? (
            <div className="animate-pulse space-y-6 py-6">
              <div className="h-6 bg-[#1b2535] rounded w-3/4"></div>
              <div className="h-4 bg-[#1b2535] rounded w-1/3"></div>
              <div className="h-32 bg-[#1b2535] rounded-xl"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b border-[#232d3f] pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">{detailData.job.title}</h2>
                  <span className="text-xs text-[#94a3b8]">{detailData.job.company}</span>
                </div>
                <button onClick={() => setSelectedJobHash(null)} className="text-[#94a3b8] hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* AI Tools Action Bar */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setOpenTailor(true)}
                  className="flex flex-col items-center gap-1.5 p-3 bg-[#1b2535] hover:bg-[#232d3f] border border-[#232d3f] rounded-xl text-white font-bold text-[10px] transition duration-200 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Tailor Resume
                </button>
                <button
                  onClick={() => setOpenCoverLetter(true)}
                  className="flex flex-col items-center gap-1.5 p-3 bg-[#1b2535] hover:bg-[#232d3f] border border-[#232d3f] rounded-xl text-white font-bold text-[10px] transition duration-200 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Cover Letter
                </button>
                <button
                  onClick={() => setOpenPrep(true)}
                  className="flex flex-col items-center gap-1.5 p-3 bg-[#1b2535] hover:bg-[#232d3f] border border-[#232d3f] rounded-xl text-white font-bold text-[10px] transition duration-200 cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4 text-amber-400" />
                  Interview Prep
                </button>
              </div>

              {/* Contact Recommendations */}
              <ContactRecommendations jobData={detailData} />

              {/* Status Update Trigger */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Update Application Status</span>
                <input
                  type="text"
                  placeholder="Add application notes..."
                  value={trackNotes}
                  onChange={(e) => setTrackNotes(e.target.value)}
                  className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600 mb-2"
                />
                <div className="grid grid-cols-3 gap-2">
                  {['Saved', 'Applied', 'Interview'].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleTrackSubmit(st)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] py-1.5 rounded transition duration-200 cursor-pointer"
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI analysis block */}
              {isAnalysisLoading ? (
                <div className="animate-pulse h-24 bg-[#1b2535] rounded-xl"></div>
              ) : analysisData ? (
                <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-4 space-y-4 text-xs text-[#94a3b8]">
                  <div className="flex justify-between items-center border-b border-[#232d3f] pb-2">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">AI Job Analysis</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      analysisData.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400' :
                      analysisData.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {analysisData.difficulty} Difficulty
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-white block">Plain English Summary</span>
                    <p className="leading-relaxed">{analysisData.summary}</p>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-[#232d3f]">
                    <span className="font-bold text-white block">Why it Matches</span>
                    <p className="leading-relaxed">{analysisData.whyMatches}</p>
                  </div>

                  {analysisData.resumeImprovements.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-[#232d3f]">
                      <span className="font-bold text-white block">Resume Improvements</span>
                      <ul className="list-disc list-inside space-y-0.5">
                        {analysisData.resumeImprovements.map((imp: string, idx: number) => (
                          <li key={idx}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysisData.prepTopics.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-[#232d3f]">
                      <span className="font-bold text-white block">Suggested Prep Topics</span>
                      <ul className="list-disc list-inside space-y-0.5">
                        {analysisData.prepTopics.slice(0, 3).map((topic: string, idx: number) => (
                          <li key={idx}>{topic}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Complete Job Description */}
              <div className="space-y-2 border-t border-[#232d3f] pt-4">
                <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Complete Description</span>
                <div className="text-xs text-[#94a3b8] leading-relaxed max-h-48 overflow-y-auto pr-2 whitespace-pre-line">
                  {detailData.job.description}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Department Wise Dropdown Search Panel */}
        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-5 space-y-3 text-center flex flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Department Filter</span>
          </div>

          <div className="w-full">
            <select
              value={department}
              onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
              className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2.5 px-4 text-xs font-semibold text-white text-center focus:outline-none focus:border-indigo-600 cursor-pointer shadow-sm transition-all"
            >
              <option value="all">All Departments</option>
              <option value="engineering">Engineering & Software</option>
              <option value="ai_data">AI, ML & Data Science</option>
              <option value="product">Product & Project Mgmt</option>
              <option value="design">UI/UX & Creative Design</option>
              <option value="marketing_sales">Sales & Marketing</option>
              <option value="operations">Operations, HR & Finance</option>
            </select>
          </div>
        </div>
      </div>
      </div>

      {/* Modals rendering */}
      {openCoverLetter && selectedJobHash && detailData && (
        <CoverLetterModal
          jobHash={selectedJobHash}
          companyName={detailData.job.company}
          jobTitle={detailData.job.title}
          onClose={() => setOpenCoverLetter(false)}
        />
      )}

      {openTailor && selectedJobHash && detailData && (
        <ResumeTailoringModal
          jobHash={selectedJobHash}
          companyName={detailData.job.company}
          jobTitle={detailData.job.title}
          onClose={() => setOpenTailor(false)}
        />
      )}

      {openPrep && selectedJobHash && detailData && (
        <InterviewPrepPanel
          jobHash={selectedJobHash}
          companyName={detailData.job.company}
          jobTitle={detailData.job.title}
          onClose={() => setOpenPrep(false)}
        />
      )}
    </div>
  );
};

// Contact Recommendations Component
const ContactRecommendations: React.FC<{ jobData: any }> = ({ jobData }) => {
  const navigate = useNavigate();
  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['contact-recommendations', jobData?.job?.company, jobData?.job?.title],
    queryFn: async () => {
      if (!jobData?.job?.company || !jobData?.job?.title) return [];

      const token = localStorage.getItem('token');
      const res = await fetch('/api/linkedin/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          company: jobData.job.company,
          jobTitle: jobData.job.title,
          jobDescription: jobData.job.description
        })
      });

      if (!res.ok) throw new Error('Failed to fetch recommendations');
      return res.json();
    },
    enabled: !!jobData?.job?.company && !!jobData?.job?.title
  });

  if (!jobData?.job?.company) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Recommended Contacts</span>
        <button
          onClick={() => navigate('/referrals')}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
        >
          View All →
        </button>
      </div>

      {isLoading ? (
        <div className="text-xs text-[#94a3b8]">Loading recommendations...</div>
      ) : !recommendations || recommendations.length === 0 ? (
        <div className="text-xs text-[#94a3b8] p-3 bg-[#1b2535] rounded-lg">
          No contacts found for {jobData.job.company}. Add contacts to get recommendations.
        </div>
      ) : (
        <div className="space-y-2">
          {recommendations.slice(0, 3).map((rec: any) => (
            <div key={rec.contact.id} className="p-3 bg-[#1b2535] rounded-lg border border-[#232d3f]">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{rec.contact.name}</h4>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold rounded-full">
                      <Star className="w-3 h-3" />
                      {rec.score}%
                    </div>
                  </div>
                  <p className="text-xs text-[#94a3b8]">{rec.contact.currentRole}</p>
                </div>
                <span className="text-xs text-indigo-400">{rec.contact.relationship}</span>
              </div>
              <div className="text-xs text-[#94a3b8] mb-2">
                {rec.reasons.slice(0, 2).join(', ')}
              </div>
              <div className="flex gap-2">
                {rec.contact.linkedInProfile && (
                  <a
                    href={rec.contact.linkedInProfile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1 bg-[#0077b5] hover:bg-[#006097] rounded text-xs font-semibold text-white transition-colors"
                  >
                    <span className="font-bold">in</span>
                    Profile
                  </a>
                )}
                {rec.contact.email && (
                  <a
                    href={`mailto:${rec.contact.email}`}
                    className="flex items-center gap-1 px-2 py-1 bg-[#ea4335]/10 border border-[#ea4335]/20 text-[#ea4335] rounded text-xs font-semibold hover:bg-[#ea4335]/20 transition-colors"
                  >
                    <Mail className="w-3 h-3" />
                    Email
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobExplorer;
