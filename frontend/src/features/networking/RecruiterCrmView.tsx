import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Calendar, Plus, Trash2, ShieldCheck } from 'lucide-react';

export const RecruiterCrmView: React.FC = () => {
  const queryClient = useQueryClient();
  const [appId, setAppId] = useState('');
  const [note, setNote] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [companySearch, setCompanySearch] = useState('');

  // Fetch Follow-Ups
  const { data: followups, isLoading: loadingFollowups } = useQuery({
    queryKey: ['followups'],
    queryFn: async () => {
      const res = await fetch('/api/v1/followups');
      if (!res.ok) throw new Error('Failed to fetch follow-ups');
      const json = await res.json();
      return json.data;
    },
  });

  // Visa Sponsor Search Query
  const { data: visaStats } = useQuery({
    queryKey: ['visa', companySearch],
    queryFn: async () => {
      if (!companySearch.trim()) return null;
      const res = await fetch(`/api/v1/visa/company?name=${encodeURIComponent(companySearch)}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    },
    enabled: Boolean(companySearch.trim()),
  });

  // Create Follow-up Mutation
  const createFollowUpMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: appId,
          scheduledDate: new Date(scheduledDate).toISOString(),
          status: 'Pending',
          note,
        }),
      });
      if (!res.ok) throw new Error('Failed to create follow-up');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followups'] });
      setAppId('');
      setNote('');
    },
  });

  // Delete Follow-up Mutation
  const deleteFollowUpMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/followups/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete follow-up');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followups'] });
    },
  });

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto min-h-screen text-white">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
          <Users className="w-8 h-8 text-blue-400" /> Recruiter CRM & Follow-Ups
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage recruiter outreach, follow-up reminders, and company H1B visa verification.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Follow-Ups Management */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Follow-Up Form */}
          <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-5 shadow-xl">
            <h2 className="font-bold text-base text-slate-100 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" /> Schedule Follow-Up Reminder
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <input
                type="text"
                placeholder="Application ID (e.g. Google-123)"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="bg-[#0b0f19] border border-[#232d3f] rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="bg-[#0b0f19] border border-[#232d3f] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="Note (e.g. Send thank you note)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="bg-[#0b0f19] border border-[#232d3f] rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => createFollowUpMutation.mutate()}
                disabled={!appId || createFollowUpMutation.isPending}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg transition-colors cursor-pointer"
              >
                Save Follow-Up
              </button>
            </div>
          </div>

          {/* Follow-Ups List */}
          <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-5 shadow-xl">
            <h2 className="font-bold text-base text-slate-100 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" /> Upcoming Reminders
            </h2>

            {loadingFollowups && <div className="text-slate-400 text-xs py-4">Loading follow-ups...</div>}

            {followups && followups.length === 0 && (
              <div className="text-slate-500 text-xs py-8 text-center border border-dashed border-[#232d3f] rounded-xl">
                No scheduled follow-up reminders.
              </div>
            )}

            <div className="space-y-3">
              {(followups || []).map((f: any) => (
                <div
                  key={f.id}
                  className="bg-[#0b0f19] border border-[#232d3f] p-4 rounded-xl flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-200">{f.applicationId}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                        {f.status}
                      </span>
                    </div>
                    {f.note && <p className="text-xs text-slate-400 mt-1">{f.note}</p>}
                    <p className="text-[11px] text-slate-500 mt-1">
                      📅 {new Date(f.scheduledDate).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteFollowUpMutation.mutate(f.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Visa Intelligence Verification */}
        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-5 shadow-xl h-fit">
          <h2 className="font-bold text-base text-slate-100 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" /> H1B Visa Sponsor Verification
          </h2>

          <input
            type="text"
            placeholder="Search company (e.g. Google)..."
            value={companySearch}
            onChange={(e) => setCompanySearch(e.target.value)}
            className="w-full bg-[#0b0f19] border border-[#232d3f] rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 mb-4"
          />

          {visaStats ? (
            <div className="bg-[#0b0f19] border border-[#232d3f] p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-200">{visaStats.sponsor?.companyName || companySearch}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    visaStats.isVerifiedSponsor
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {visaStats.approvalRating} Approval
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{visaStats.summary}</p>
              {visaStats.sponsor && (
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#1b2535]">
                  <div>
                    <span className="text-slate-500 block">Total LCAs</span>
                    <span className="font-semibold text-slate-200">{visaStats.sponsor.totalLcas}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Avg Salary</span>
                    <span className="font-semibold text-slate-200">${visaStats.sponsor.avgSalary?.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-500 text-center py-6 border border-dashed border-[#232d3f] rounded-xl">
              Type a company name above to check H1B sponsorship records.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
