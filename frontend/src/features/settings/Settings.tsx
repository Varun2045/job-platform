import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Save, Settings as SettingsIcon, Heart, User, Search, Trash2, Plus } from 'lucide-react';

export const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'searches'>('profile');
  const { register: registerProfile, handleSubmit: handleSubmitProfile, reset: resetProfile } = useForm();
  const { register: registerExt, handleSubmit: handleSubmitExt, reset: resetExt } = useForm();
  const [newSearch, setNewSearch] = useState({ name: '', company: '', tech: '', location: '', remote: 'all' });
  const [newWatch, setNewWatch] = useState({ name: '', company: '', tech: '', location: '', remote: 'all' });

  // 1. Fetch Profile
  const { isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('/api/profile');
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json();
      resetProfile({
        name: data.name || '',
        photo_url: data.photo_url || '',
        experience_level: data.experience_level || 'Mid Level',
        preferred_roles: (data.preferred_roles || []).join(', '),
        preferred_cities: (data.preferred_cities || []).join(', '),
        tech_stack: (data.tech_stack || []).join(', '),
        linkedin: data.linkedin || '',
        github: data.github || '',
        portfolio: data.portfolio || ''
      });
      return data;
    }
  });

  // 2. Fetch Extended settings
  const { isLoading: isExtLoading } = useQuery({
    queryKey: ['settings-extended'],
    queryFn: async () => {
      const res = await fetch('/api/settings/extended');
      if (!res.ok) throw new Error('Failed to load settings');
      const data = await res.json();
      resetExt({
        preferredCompanies: (data.preferredCompanies || []).join(', '),
        preferredTechnologies: (data.preferredTechnologies || []).join(', '),
        preferredCities: (data.preferredCities || []).join(', '),
        remotePreference: data.remotePreference || 'all',
        notificationFrequency: data.notificationFrequency || 'daily',
        digestFormat: data.digestFormat || 'markdown'
      });
      return data;
    }
  });

  // 3. Fetch Saved Searches & Watchlists
  const { data: savedSearches = [], refetch: refetchSearches } = useQuery({
    queryKey: ['saved-searches'],
    queryFn: async () => {
      const res = await fetch('/api/saved-searches');
      if (!res.ok) throw new Error('Failed to load saved searches');
      return res.json();
    }
  });

  const { data: watchlists = [], refetch: refetchWatch } = useQuery({
    queryKey: ['watchlists'],
    queryFn: async () => {
      const res = await fetch('/api/watchlists');
      if (!res.ok) throw new Error('Failed to load watchlists');
      return res.json();
    }
  });

  // Mutations
  const saveProfileMutation = useMutation({
    mutationFn: async (formData: any) => {
      const body = {
        name: formData.name,
        photo_url: formData.photo_url,
        experience_level: formData.experience_level,
        preferred_roles: formData.preferred_roles.split(',').map((s: string) => s.trim()).filter(Boolean),
        preferred_cities: formData.preferred_cities.split(',').map((s: string) => s.trim()).filter(Boolean),
        tech_stack: formData.tech_stack.split(',').map((s: string) => s.trim()).filter(Boolean),
        linkedin: formData.linkedin,
        github: formData.github,
        portfolio: formData.portfolio
      };
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Failed to save profile');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      alert('Profile updated successfully!');
    }
  });

  const saveExtMutation = useMutation({
    mutationFn: async (formData: any) => {
      const body = {
        preferredCompanies: formData.preferredCompanies.split(',').map((s: string) => s.trim()).filter(Boolean),
        preferredTechnologies: formData.preferredTechnologies.split(',').map((s: string) => s.trim()).filter(Boolean),
        preferredCities: formData.preferredCities.split(',').map((s: string) => s.trim()).filter(Boolean),
        remotePreference: formData.remotePreference,
        notificationFrequency: formData.notificationFrequency,
        digestFormat: formData.digestFormat
      };
      const res = await fetch('/api/settings/extended', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Failed to save preferences');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-extended'] });
      alert('Career preferences updated successfully!');
    }
  });

  const addSearchMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Failed to add saved search');
      return res.json();
    },
    onSuccess: () => {
      refetchSearches();
      setNewSearch({ name: '', company: '', tech: '', location: '', remote: 'all' });
    }
  });

  const deleteSearchMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/saved-searches/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete saved search');
      return res.json();
    },
    onSuccess: () => refetchSearches()
  });

  const addWatchMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch('/api/watchlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Failed to add watchlist');
      return res.json();
    },
    onSuccess: () => {
      refetchWatch();
      setNewWatch({ name: '', company: '', tech: '', location: '', remote: 'all' });
    }
  });

  const deleteWatchMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/watchlists/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete watchlist');
      return res.json();
    },
    onSuccess: () => refetchWatch()
  });

  if (isProfileLoading || isExtLoading) {
    return <div className="p-8 text-[#94a3b8] animate-pulse">Loading Account Settings...</div>;
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-indigo-400" /> Account Settings
        </h1>
        <p className="text-sm text-[#94a3b8]">Manage your profile, career match priorities, and search watchlists</p>
      </div>

      <div className="flex border-b border-[#232d3f] gap-4">
        {[
          { id: 'profile', label: 'User Profile', icon: User },
          { id: 'preferences', label: 'Match Preferences', icon: Heart },
          { id: 'searches', label: 'Saved Filters & Watchlists', icon: Search },
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

      <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6">
        {activeTab === 'profile' && (
          <form onSubmit={handleSubmitProfile(formData => saveProfileMutation.mutate(formData))} className="space-y-4 max-w-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider block mb-2">User Profile Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  {...registerProfile('name')}
                  className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Photo URL</label>
                <input
                  type="text"
                  placeholder="https://example.com/photo.jpg"
                  {...registerProfile('photo_url')}
                  className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Preferred Roles</label>
                <input
                  type="text"
                  placeholder="Backend Engineer, Tech Lead"
                  {...registerProfile('preferred_roles')}
                  className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Preferred Cities</label>
                <input
                  type="text"
                  placeholder="San Francisco, London"
                  {...registerProfile('preferred_cities')}
                  className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Experience Level</label>
                <select
                  {...registerProfile('experience_level')}
                  className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-600"
                >
                  <option value="Early Career">Early Career</option>
                  <option value="Mid Level">Mid Level</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Tech Stack</label>
                <input
                  type="text"
                  placeholder="Node.js, Go, React"
                  {...registerProfile('tech_stack')}
                  className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="border-t border-[#232d3f] pt-4 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Social profiles links</h4>
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="LinkedIn Profile URL"
                  {...registerProfile('linkedin')}
                  className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="GitHub Username"
                  {...registerProfile('github')}
                  className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Portfolio Website"
                  {...registerProfile('portfolio')}
                  className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition duration-200 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save Profile Details
            </button>
          </form>
        )}

        {activeTab === 'preferences' && (
          <form onSubmit={handleSubmitExt(formData => saveExtMutation.mutate(formData))} className="space-y-4 max-w-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider block mb-2">Extended Scraper Preferences</h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Preferred Companies</label>
              <input
                type="text"
                placeholder="Google, Stripe, Microsoft (comma separated)"
                {...registerExt('preferredCompanies')}
                className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2.5 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Preferred Technologies</label>
              <input
                type="text"
                placeholder="Typescript, Go, Golang (comma separated)"
                {...registerExt('preferredTechnologies')}
                className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2.5 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Preferred Cities</label>
              <input
                type="text"
                placeholder="Bangalore, Hyderabad, London (comma separated)"
                {...registerExt('preferredCities')}
                className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2.5 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Remote Preference</label>
                <select
                  {...registerExt('remotePreference')}
                  className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-600"
                >
                  <option value="all">No Preference</option>
                  <option value="remote">Remote Only</option>
                  <option value="onsite">Onsite Only</option>
                  <option value="hybrid">Hybrid Only</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Notification Frequency</label>
                <select
                  {...registerExt('notificationFrequency')}
                  className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-600"
                >
                  <option value="daily">Daily Digest</option>
                  <option value="weekly">Weekly Digest</option>
                  <option value="monthly">Monthly Digest</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Digest Format</label>
                <select
                  {...registerExt('digestFormat')}
                  className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-600"
                >
                  <option value="markdown">Markdown Summary</option>
                  <option value="html">HTML Styled Email</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition duration-200 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save Career Preferences
            </button>
          </form>
        )}

        {activeTab === 'searches' && (
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Saved Search Filters</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedSearches.length === 0 ? (
                  <p className="text-xs text-[#6b7280]">No saved search filters yet.</p>
                ) : (
                  savedSearches.map((s: any) => (
                    <div key={s.id} className="bg-[#1b2535] border border-[#232d3f] p-4 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-white block">{s.name}</span>
                        <span className="text-[10px] text-[#94a3b8]">
                          {s.filters.tech ? `Tech: ${s.filters.tech} | ` : ''}
                          {s.filters.location ? `Loc: ${s.filters.location} | ` : ''}
                          {s.filters.remote !== 'all' ? `Remote: ${s.filters.remote}` : ''}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteSearchMutation.mutate(s.id)}
                        className="text-red-400 hover:text-red-300 p-2 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="bg-[#1b2535] border border-[#232d3f] p-4 rounded-xl space-y-4 max-w-xl">
                <span className="text-xs font-bold text-white block uppercase">Add New Saved Filter</span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <input
                    type="text"
                    placeholder="Filter Name (e.g. London Backend)"
                    value={newSearch.name}
                    onChange={e => setNewSearch(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-[#131a26] border border-[#232d3f] rounded-lg p-2 text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Technology"
                    value={newSearch.tech}
                    onChange={e => setNewSearch(prev => ({ ...prev, tech: e.target.value }))}
                    className="w-full bg-[#131a26] border border-[#232d3f] rounded-lg p-2 text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={newSearch.location}
                    onChange={e => setNewSearch(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full bg-[#131a26] border border-[#232d3f] rounded-lg p-2 text-white focus:outline-none"
                  />
                  <select
                    value={newSearch.remote}
                    onChange={e => setNewSearch(prev => ({ ...prev, remote: e.target.value }))}
                    className="w-full bg-[#131a26] border border-[#232d3f] rounded-lg p-2 text-white focus:outline-none"
                  >
                    <option value="all">All Remote Modes</option>
                    <option value="remote">Remote Only</option>
                    <option value="onsite">Onsite Only</option>
                  </select>
                </div>
                <button
                  disabled={!newSearch.name}
                  onClick={() => addSearchMutation.mutate(newSearch)}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" /> Save Search Criteria
                </button>
              </div>
            </div>

            <div className="space-y-4 border-t border-[#232d3f] pt-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Dream Company Watchlists</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {watchlists.length === 0 ? (
                  <p className="text-xs text-[#6b7280]">No watchlists created yet.</p>
                ) : (
                  watchlists.map((w: any) => (
                    <div key={w.id} className="bg-[#1b2535] border border-[#232d3f] p-4 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-white block">{w.name}</span>
                        <span className="text-[10px] text-[#94a3b8]">
                          Alerts when new matching jobs appear at {w.filters.company || 'any company'}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteWatchMutation.mutate(w.id)}
                        className="text-red-400 hover:text-red-300 p-2 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="bg-[#1b2535] border border-[#232d3f] p-4 rounded-xl space-y-4 max-w-xl">
                <span className="text-xs font-bold text-white block uppercase">Create Watchlist Trigger</span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <input
                    type="text"
                    placeholder="Watchlist Name (e.g. Dream Companies)"
                    value={newWatch.name}
                    onChange={e => setNewWatch(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-[#131a26] border border-[#232d3f] rounded-lg p-2 text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Target Company Name"
                    value={newWatch.company}
                    onChange={e => setNewWatch(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full bg-[#131a26] border border-[#232d3f] rounded-lg p-2 text-white focus:outline-none"
                  />
                </div>
                <button
                  disabled={!newWatch.name || !newWatch.company}
                  onClick={() => addWatchMutation.mutate(newWatch)}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" /> Setup Watchlist Trigger
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Settings;
