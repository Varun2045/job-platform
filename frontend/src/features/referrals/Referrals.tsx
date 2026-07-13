import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Users, MessageSquare, Clock, BarChart3, Search, Copy, ExternalLink, Plus, Trash2, Tag, Mail, Download, Star, X } from 'lucide-react';

type Tab = 'contacts' | 'pipeline' | 'messages' | 'followup' | 'analytics';

type ReferralContact = {
  id: string;
  userId: string;
  name: string;
  role: string;
  category: 'Recruiter' | 'Hiring Manager' | 'Engineering Manager' | 'University Alumni' | 'Employee' | 'Talent Acquisition' | 'HR';
  company: string;
  linkedInUrl?: string;
  email?: string;
  location?: string;
  notes?: string;
  tags: string[];
  connectionStatus: 'Potential Contact' | 'LinkedIn Opened' | 'Connection Sent' | 'Connected' | 'Referral Requested' | 'Referral Submitted' | 'Applied' | 'Interview' | 'Offer';
  referralStatus: string;
  lastContacted?: string;
  nextFollowUp?: string;
  reminder?: string;
  outcome?: string;
  createdAt: string;
  updatedAt: string;
};

const CATEGORIES = ['Recruiter', 'Hiring Manager', 'Engineering Manager', 'University Alumni', 'Employee', 'Talent Acquisition', 'HR'] as const;
const PIPELINE_STAGES = ['Potential Contact', 'LinkedIn Opened', 'Connection Sent', 'Connected', 'Referral Requested', 'Referral Submitted', 'Applied', 'Interview', 'Offer'] as const;

export const Referrals: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('contacts');

  const tabs = [
    { id: 'contacts' as Tab, name: 'Company Contacts', icon: Users },
    { id: 'pipeline' as Tab, name: 'Referral Pipeline', icon: Users },
    { id: 'messages' as Tab, name: 'AI Message Generator', icon: MessageSquare },
    { id: 'followup' as Tab, name: 'Follow-up Manager', icon: Clock },
    { id: 'analytics' as Tab, name: 'Referral Analytics', icon: BarChart3 },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">LinkedIn Referral Assistant</h1>
        <p className="text-sm text-[#94a3b8]">Manage networking, LinkedIn outreach, and referral pipeline</p>
      </div>

      <div className="flex gap-2 border-b border-[#232d3f] pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-indigo-600/10 border border-indigo-600/30 text-indigo-400'
                : 'text-[#94a3b8] hover:bg-[#1b2535] hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 min-h-[500px]">
        {activeTab === 'contacts' && <CompanyContacts />}
        {activeTab === 'pipeline' && <ReferralPipeline />}
        {activeTab === 'messages' && <AIMessageGenerator />}
        {activeTab === 'followup' && <FollowUpManager />}
        {activeTab === 'analytics' && <ReferralAnalytics />}
      </div>
    </div>
  );
};

const CompanyContacts: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    category: 'Recruiter' as const,
    company: '',
    linkedInUrl: '',
    email: '',
    location: '',
    notes: '',
    tags: ''
  });

  const openGmailCompose = (contact: ReferralContact) => {
    const subject = `Inquiry about opportunities at ${contact.company}`;
    const body = `Hi ${contact.name},\n\nI hope this email finds you well. I'm writing to express my interest in opportunities at ${contact.company}. Given your role as ${contact.role}, I would value any insights you might share about the team culture or potential openings.\n\nBest regards`;
    
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contact.email || '')}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
  };

  const downloadEML = (contact: ReferralContact) => {
    const subject = `Inquiry about opportunities at ${contact.company}`;
    const body = `Hi ${contact.name},\n\nI hope this email finds you well. I'm writing to express my interest in opportunities at ${contact.company}. Given your role as ${contact.role}, I would value any insights you might share about the team culture or potential openings.\n\nBest regards`;
    
    const emlContent = `From: <>
To: <${contact.email}>
Subject: ${subject}
Date: ${new Date().toISOString().replace(/T/, ' ').replace(/\.\d+Z/, '')}
MIME-Version: 1.0
Content-Type: text/plain; charset=utf-8

${body}`;
    
    const blob = new Blob([emlContent], { type: 'message/rfc822' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email_${contact.name.replace(/\s+/g, '_')}.eml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const { data: referrals, isLoading, refetch } = useQuery({
    queryKey: ['referrals'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/referrals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch referrals');
      return res.json() as Promise<ReferralContact[]>;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...data,
          tags: data.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t),
          connectionStatus: 'Potential Contact'
        })
      });
      if (!res.ok) throw new Error('Failed to save referral');
      return res.json();
    },
    onSuccess: () => {
      refetch();
      setShowAddForm(false);
      setFormData({
        name: '',
        role: '',
        category: 'Recruiter',
        company: '',
        linkedInUrl: '',
        email: '',
        location: '',
        notes: '',
        tags: ''
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/referrals/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete referral');
    },
    onSuccess: () => refetch()
  });

  const generateLinkedInSearchUrl = (name: string, company: string) => {
    const query = encodeURIComponent(`${name} ${company} LinkedIn`);
    return `https://www.google.com/search?q=${query}`;
  };

  const generateCompanyLinkedInUrl = (company: string) => {
    const query = encodeURIComponent(`${company} LinkedIn company`);
    return `https://www.google.com/search?q=${query}`;
  };

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch('/api/linkedin/import-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ csvData: text })
      });

      if (!res.ok) throw new Error('Failed to import CSV');
      
      const result = await res.json();
      alert(`Successfully imported ${result.imported} contacts (${result.saved} saved)`);
      refetch();
    } catch (err) {
      alert('Failed to import CSV: ' + (err as Error).message);
    }

    event.target.value = '';
  };

  const filteredContacts = referrals?.filter(r => 
    selectedCategory === 'All' || r.category === selectedCategory
  ) || [];

  const groupedByCompany = filteredContacts.reduce((acc, contact) => {
    if (!acc[contact.company]) {
      acc[contact.company] = [];
    }
    acc[contact.company].push(contact);
    return acc;
  }, {} as Record<string, ReferralContact[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Company Contacts</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-semibold text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </button>
          <button
            onClick={() => document.getElementById('csv-upload')?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-[#0077b5] hover:bg-[#006097] rounded-lg text-sm font-semibold text-white transition-colors"
          >
            <Download className="w-4 h-4" />
            Import CSV
          </button>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCSVImport}
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
            selectedCategory === 'All'
              ? 'bg-indigo-600 text-white'
              : 'bg-[#1b2535] text-[#94a3b8] hover:text-white'
          }`}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-[#1b2535] text-[#94a3b8] hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {showAddForm && (
        <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Add New Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Name *"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
            />
            <input
              type="text"
              placeholder="Role"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              className="px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
            />
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value as any })}
              className="px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Company *"
              value={formData.company}
              onChange={e => setFormData({ ...formData, company: e.target.value })}
              className="px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
            />
            <input
              type="text"
              placeholder="LinkedIn URL"
              value={formData.linkedInUrl}
              onChange={e => setFormData({ ...formData, linkedInUrl: e.target.value })}
              className="px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
            />
            <input
              type="text"
              placeholder="Location"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              className="px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
            />
            <input
              type="text"
              placeholder="Tags (comma-separated)"
              value={formData.tags}
              onChange={e => setFormData({ ...formData, tags: e.target.value })}
              className="px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
            />
          </div>
          <textarea
            placeholder="Notes"
            rows={3}
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
          />
          <div className="flex gap-2">
            <button
              onClick={() => saveMutation.mutate(formData)}
              disabled={saveMutation.isPending || !formData.name || !formData.company}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-[#232d3f] disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-white"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Contact'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-[#232d3f] hover:bg-[#1f2937] rounded-lg text-sm font-semibold text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-[#94a3b8]">Loading contacts...</div>
      ) : Object.keys(groupedByCompany).length === 0 ? (
        <div className="text-center py-12 text-[#94a3b8] border border-dashed border-[#232d3f] rounded-xl">
          No contacts added yet. Click "Add Contact" to get started.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByCompany).map(([company, contacts]) => (
            <div key={company} className="bg-[#1b2535] border border-[#232d3f] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-[#131a26] border-b border-[#232d3f]">
                <h3 className="text-lg font-bold text-white">{company}</h3>
                <div className="flex gap-2">
                  <a
                    href={generateCompanyLinkedInUrl(company)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#0077b5] hover:bg-[#006097] rounded-lg text-xs font-semibold text-white transition-colors"
                  >
                    <span className="font-bold">in</span>
                    Company LinkedIn
                  </a>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {contacts.map(contact => (
                  <div key={contact.id} className="bg-[#131a26] border border-[#232d3f] rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-white">{contact.name}</h4>
                          {contact.tags?.includes('LinkedIn Import') && (
                            <span className="px-2 py-0.5 bg-[#0077b5]/10 border border-[#0077b5]/20 text-[#0077b5] text-xs font-semibold rounded-full">
                              LinkedIn
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#94a3b8]">{contact.role}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-block px-2 py-0.5 bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 text-xs font-semibold rounded-full">
                            {contact.category}
                          </span>
                          {contact.connectionStatus && (
                            <span className="inline-block px-2 py-0.5 bg-emerald-600/10 border border-emerald-600/20 text-emerald-400 text-xs font-semibold rounded-full">
                              {contact.connectionStatus}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteMutation.mutate(contact.id)}
                        className="text-red-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Confidence Score and Recommendation */}
                    {contact.tags?.includes('LinkedIn Import') && contact.notes && (
                      <div className="mb-3 p-3 bg-[#1b2535] rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Star className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-semibold text-white">Recommendation</span>
                        </div>
                        <p className="text-xs text-[#94a3b8]">{contact.notes}</p>
                      </div>
                    )}

                    {/* LinkedIn Section */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {contact.linkedInUrl ? (
                        <>
                          <a
                            href={contact.linkedInUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#0077b5] hover:bg-[#006097] rounded-lg text-xs font-semibold text-white transition-colors"
                          >
                            <span className="font-bold">in</span>
                            Open LinkedIn
                          </a>
                          <button
                            onClick={() => copyToClipboard(contact.linkedInUrl!)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#232d3f] hover:bg-[#1f2937] rounded-lg text-xs font-semibold text-white transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Copy URL
                          </button>
                        </>
                      ) : (
                        <a
                          href={generateLinkedInSearchUrl(contact.name, contact.company)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#0077b5] hover:bg-[#006097] rounded-lg text-xs font-semibold text-white transition-colors"
                        >
                          <Search className="w-3.5 h-3.5" />
                          LinkedIn Search
                        </a>
                      )}
                      <a
                        href={generateCompanyLinkedInUrl(contact.company)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#232d3f] hover:bg-[#1f2937] rounded-lg text-xs font-semibold text-white transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Company Profile
                      </a>
                    </div>

                    {/* Contact Details */}
                    {contact.email && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-[#94a3b8]">Email:</span>
                        <a href={`mailto:${contact.email}`} className="text-xs text-indigo-400 hover:underline">
                          {contact.email}
                        </a>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openGmailCompose(contact)}
                            className="flex items-center gap-1 px-2 py-0.5 bg-[#ea4335]/10 border border-[#ea4335]/20 text-[#ea4335] text-xs font-semibold rounded-full hover:bg-[#ea4335]/20 transition-colors"
                            title="Open in Gmail"
                          >
                            <Mail className="w-3 h-3" />
                            Gmail
                          </button>
                          <button
                            onClick={() => downloadEML(contact)}
                            className="flex items-center gap-1 px-2 py-0.5 bg-[#1b2535] border border-[#232d3f] text-[#94a3b8] text-xs font-semibold rounded-full hover:bg-[#232d3f] hover:text-white transition-colors"
                            title="Download .eml file"
                          >
                            <Download className="w-3 h-3" />
                            .eml
                          </button>
                        </div>
                      </div>
                    )}
                    {contact.location && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-[#94a3b8]">Location:</span>
                        <span className="text-xs text-white">{contact.location}</span>
                      </div>
                    )}

                    {/* Tags */}
                    {contact.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {contact.tags.map(tag => (
                          <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-[#232d3f] text-[#94a3b8] text-xs rounded-full">
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Status */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#232d3f]">
                      <span className="text-xs text-[#94a3b8]">Status:</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        contact.connectionStatus === 'Connected' ? 'bg-emerald-500/10 text-emerald-400' :
                        contact.connectionStatus === 'Connection Sent' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-indigo-500/10 text-indigo-400'
                      }`}>
                        {contact.connectionStatus}
                      </span>
                    </div>

                    {contact.notes && (
                      <div className="mt-2 pt-2 border-t border-[#232d3f]">
                        <p className="text-xs text-[#94a3b8]">{contact.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ReferralPipeline: React.FC = () => {
  // Filter states
  const [filterCompany, setFilterCompany] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [filterRole, setFilterRole] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'company' | 'priority'>('newest');

  const { data: referrals, isLoading, refetch } = useQuery({
    queryKey: ['referrals'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/referrals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch referrals');
      return res.json() as Promise<ReferralContact[]>;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/referrals/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => refetch()
  });

  const resetFilters = () => {
    setFilterCompany('');
    setFilterStage('all');
    setFilterRole('');
    setSearchQuery('');
    setSortBy('newest');
  };

  const hasActiveFilters = filterCompany || filterStage !== 'all' || filterRole || searchQuery;

  // Filter and sort referrals
  const filteredReferrals = (referrals || []).filter((contact: ReferralContact) => {
    if (filterCompany && !contact.company?.toLowerCase().includes(filterCompany.toLowerCase())) return false;
    if (filterStage !== 'all' && contact.connectionStatus !== filterStage) return false;
    if (filterRole && !contact.role?.toLowerCase().includes(filterRole.toLowerCase())) return false;
    if (searchQuery && !contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) && !contact.company?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).sort((a: any, b: any) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'company':
        return a.company?.localeCompare(b.company);
      case 'priority':
        // Sort by pipeline stage priority (later stages = higher priority)
        const stagePriority: Record<string, number> = {
          'Offer': 1,
          'Interview': 2,
          'Applied': 3,
          'Referral Submitted': 4,
          'Referral Requested': 5,
          'Connected': 6,
          'Connection Sent': 7,
          'LinkedIn Opened': 8,
          'Potential Contact': 9
        };
        const aPriority = stagePriority[a.connectionStatus] || 99;
        const bPriority = stagePriority[b.connectionStatus] || 99;
        return aPriority - bPriority;
      default:
        return 0;
    }
  });

  const groupedByStage = filteredReferrals?.reduce((acc, contact) => {
    if (!acc[contact.connectionStatus]) {
      acc[contact.connectionStatus] = [];
    }
    acc[contact.connectionStatus].push(contact);
    return acc;
  }, {} as Record<string, ReferralContact[]>) || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Referral Pipeline</h2>
      </div>

      {/* Filters */}
      <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Search Contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
            />
          </div>
          <input
            type="text"
            placeholder="Company"
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
          />
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-600"
          >
            <option value="all">All Stages</option>
            {PIPELINE_STAGES.map(stage => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Contact Role"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-600"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="company">Company</option>
            <option value="priority">Highest Priority</option>
          </select>
        </div>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="mt-3 flex items-center gap-2 text-xs text-[#94a3b8] hover:text-white transition-colors"
          >
            <X className="w-3 h-3" />
            Reset Filters
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[#94a3b8]">Loading pipeline...</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage) => (
            <div key={stage} className="w-72 shrink-0 bg-[#131a26] border border-[#232d3f] rounded-xl flex flex-col">
              <div className="p-4 border-b border-[#232d3f] bg-[#1b2535] rounded-t-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{stage}</span>
                  <span className="bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 text-xs font-bold px-2 py-0.5 rounded-full">
                    {groupedByStage[stage]?.length || 0}
                  </span>
                </div>
              </div>
              <div className="p-4 min-h-[200px] space-y-3">
                {groupedByStage[stage]?.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[#94a3b8] border border-dashed border-[#232d3f] rounded-lg">
                    No contacts
                  </div>
                ) : (
                  groupedByStage[stage]?.map((contact) => (
                    <div key={contact.id} className="bg-[#1b2535] border border-[#232d3f] rounded-lg p-3 cursor-pointer hover:border-indigo-600/50 transition-colors">
                      <h4 className="font-bold text-white text-sm">{contact.name}</h4>
                      <p className="text-xs text-[#94a3b8]">{contact.company}</p>
                      <p className="text-xs text-[#94a3b8]">{contact.role}</p>
                      <div className="mt-2 flex gap-1">
                        {PIPELINE_STAGES.indexOf(stage) > 0 && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: contact.id, status: PIPELINE_STAGES[PIPELINE_STAGES.indexOf(stage) - 1] })}
                            className="flex-1 px-2 py-1 bg-[#232d3f] hover:bg-[#1f2937] rounded text-xs text-white"
                          >
                            ← Back
                          </button>
                        )}
                        {PIPELINE_STAGES.indexOf(stage) < PIPELINE_STAGES.length - 1 && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: contact.id, status: PIPELINE_STAGES[PIPELINE_STAGES.indexOf(stage) + 1] })}
                            className="flex-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-xs text-white"
                          >
                            Next →
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AIMessageGenerator: React.FC = () => {
  const [messageType, setMessageType] = useState('connection');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [generatedSubject, setGeneratedSubject] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState({
    bestResume: '',
    bestTime: '',
    responseProbability: 0,
    tone: ''
  });

  const [context, setContext] = useState({
    // Common fields
    contactName: '',
    company: '',
    
    // LinkedIn Connection
    currentRole: '',
    linkedInProfile: '',
    mutualInterests: '',
    reasonForConnecting: '',
    
    // Referral Request
    jobTitle: '',
    jobUrl: '',
    resumeVersion: '',
    whyInterested: '',
    additionalContext: '',
    
    // Cold Email
    recipientEmail: '',
    recipientName: '',
    subject: '',
    portfolioUrl: '',
    githubUrl: '',
    
    // Follow-up Email
    lastContactDate: '',
    previousConversation: '',
    
    // Thank You Email
    interviewerName: '',
    interviewerEmail: '',
    interviewDate: '',
    position: '',
    topicsDiscussed: '',
    additionalNotes: '',
    
    // Networking Message
    role: '',
    reasonForNetworking: '',
    
    // Recruiter Outreach
    recruiterName: '',
    recruiterEmail: '',
    whyGoodFit: '',
    
    // Interview Follow-up
    interviewerEmailFollowup: '',
    interviewerNameFollowup: '',
    interviewDateFollowup: '',
    interviewRound: '',
    
    // Legacy
    jobDescription: '',
    yourName: '',
  });

  const messageTypes = [
    { id: 'connection', name: 'LinkedIn Connection Request' },
    { id: 'referral', name: 'Referral Request' },
    { id: 'cold-email', name: 'Cold Email' },
    { id: 'followup', name: 'Follow-up Email' },
    { id: 'thankyou', name: 'Thank You Email' },
    { id: 'networking', name: 'Networking Message' },
    { id: 'recruiter', name: 'Recruiter Outreach' },
    { id: 'interview-followup', name: 'Interview Follow-up' },
  ];

  const generateMessage = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation (in production, this would call an AI API)
    setTimeout(() => {
      let message = '';
      let subject = '';
      let tone = 'Professional';
      let bestTime = 'Tuesday-Thursday, 10 AM - 2 PM';
      let responseProb = 65;
      
      switch (messageType) {
        case 'connection':
          tone = 'Professional';
          bestTime = 'Tuesday-Thursday, 9 AM - 11 AM';
          responseProb = 75;
          message = `Hi ${context.contactName || '[Name]'},\n\nI noticed you work at ${context.company || '[Company]'} as a ${context.currentRole || '[Role]'}. ${context.mutualInterests ? `I see we share an interest in ${context.mutualInterests}.` : ''} ${context.reasonForConnecting ? `I'd love to connect because ${context.reasonForConnecting}.` : 'I would appreciate connecting to learn more about your work.'}\n\nBest regards`;
          break;
        case 'referral':
          tone = 'Professional';
          bestTime = 'Wednesday-Friday, 10 AM - 12 PM';
          responseProb = 60;
          message = `Hi ${context.contactName || '[Name]'},\n\nI hope you're doing well. I recently applied for the ${context.jobTitle || '[Role]'} position at ${context.company || '[Company]'}${context.jobUrl ? ` (${context.jobUrl})` : ''}.\n\n${context.whyInterested ? `I'm particularly interested in this role because ${context.whyInterested}.` : 'I believe my background would be a great fit for the team.'} ${context.additionalContext ? context.additionalContext : ''}\n\nWould you be willing to provide a referral? I'd be happy to share my resume and discuss further.\n\nBest regards`;
          break;
        case 'cold-email':
          tone = 'Professional';
          bestTime = 'Tuesday-Thursday, 10 AM - 2 PM';
          responseProb = 45;
          subject = context.subject || `Application for ${context.jobTitle || 'Software Engineer'} - ${context.yourName || 'Your Name'}`;
          message = `Dear ${context.recipientName || context.contactName || '[Name]'},\n\nI hope this email finds you well. I'm writing to express my interest in the ${context.jobTitle || '[Role]'} position at ${context.company || '[Company]'}.\n\n${context.portfolioUrl ? `You can view my portfolio at ${context.portfolioUrl}.` : ''} ${context.githubUrl ? `My GitHub profile: ${context.githubUrl}.` : ''} ${context.additionalContext ? context.additionalContext : ''}\n\nI believe my experience and skills would be a strong match for this role. I've attached my resume for your review.\n\nThank you for your time and consideration.\n\nBest regards,\n${context.yourName || '[Your Name]'}`;
          break;
        case 'followup':
          tone = 'Professional';
          bestTime = 'Wednesday-Friday, 10 AM - 12 PM';
          responseProb = 55;
          message = `Hi ${context.recipientName || context.contactName || '[Name]'},\n\nI hope you're doing well. I wanted to follow up on my previous message regarding opportunities at ${context.company || '[Company]'}${context.lastContactDate ? ` since our last contact on ${context.lastContactDate}` : ''}.\n\n${context.previousConversation ? `Regarding our previous conversation: ${context.previousConversation}` : ''} ${context.additionalContext ? context.additionalContext : ''}\n\nI remain very interested in potential roles on your team. Please let me know if there might be a good time to discuss this further.\n\nBest regards,\n${context.yourName || '[Your Name]'}`;
          break;
        case 'thankyou':
          tone = 'Professional';
          bestTime = 'Within 24 hours of interview';
          responseProb = 85;
          message = `Dear ${context.interviewerName || '[Name]'},\n\nThank you so much for taking the time to interview me for the ${context.position || '[Position]'} role at ${context.company || '[Company]'}${context.interviewDate ? ` on ${context.interviewDate}` : ''}.\n\n${context.topicsDiscussed ? `I particularly enjoyed our discussion about ${context.topicsDiscussed}.` : 'I truly enjoyed our conversation and learning more about the team.'} ${context.additionalNotes ? context.additionalNotes : ''}\n\nI remain very excited about the opportunity to contribute to your team and look forward to hearing from you.\n\nBest regards,\n${context.yourName || '[Your Name]'}`;
          break;
        case 'networking':
          tone = 'Friendly';
          bestTime = 'Tuesday-Thursday, 10 AM - 12 PM';
          responseProb = 70;
          message = `Hi ${context.contactName || '[Name]'},\n\nI came across your profile and noticed you work at ${context.company || '[Company]'} as a ${context.role || '[Role]'}. ${context.mutualInterests ? `I see we share interests in ${context.mutualInterests}.` : ''} ${context.reasonForNetworking ? `I'd love to connect because ${context.reasonForNetworking}.` : 'I would appreciate connecting to learn more about your work.'}\n\nBest regards`;
          break;
        case 'recruiter':
          tone = 'Professional';
          bestTime = 'Tuesday-Thursday, 10 AM - 2 PM';
          responseProb = 50;
          message = `Hi ${context.recruiterName || context.contactName || '[Name]'},\n\nI hope you're doing well. I'm reaching out regarding the ${context.jobTitle || 'open positions'} at ${context.company || '[Company]'}.\n\n${context.whyGoodFit ? `I believe I would be a strong fit because ${context.whyGoodFit}.` : 'I have experience in software engineering and would be excited to contribute to your team.'} ${context.portfolioUrl ? `You can view my work at ${context.portfolioUrl}.` : ''} ${context.additionalContext ? context.additionalContext : ''}\n\nI would appreciate the opportunity to discuss how I can contribute to your team's success.\n\nBest regards,\n${context.yourName || '[Your Name]'}`;
          break;
        case 'interview-followup':
          tone = 'Professional';
          bestTime = '3-5 business days after interview';
          responseProb = 65;
          message = `Dear ${context.interviewerNameFollowup || context.contactName || '[Name]'},\n\nThank you again for the opportunity to interview for the position at ${context.company || '[Company]'}${context.interviewDateFollowup ? ` on ${context.interviewDateFollowup}` : ''}${context.interviewRound ? ` (${context.interviewRound})` : ''}.\n\nI remain very interested in the role and excited about the possibility of joining your team. ${context.additionalContext ? context.additionalContext : ''}\n\nI wanted to politely inquire about the next steps in the process and when I might expect to hear back.\n\nBest regards,\n${context.yourName || '[Your Name]'}`;
          break;
      }
      
      setGeneratedMessage(message);
      setGeneratedSubject(subject);
      setAiSuggestions({
        bestResume: context.resumeVersion || 'Standard Resume',
        bestTime,
        responseProbability: responseProb,
        tone
      });
      setIsGenerating(false);
    }, 1200);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMessage);
  };

  const openGmail = () => {
    const email = context.recipientEmail || context.recruiterEmail || context.interviewerEmail || context.interviewerEmailFollowup;
    const subject = generatedSubject || `Regarding ${context.jobTitle || 'opportunity'} at ${context.company}`;
    const body = encodeURIComponent(generatedMessage);
    window.open(`https://mail.google.com/mail/?view=cm&to=${email}&su=${encodeURIComponent(subject)}&body=${body}`, '_blank');
  };

  const openLinkedIn = () => {
    const profile = context.linkedInProfile || `https://linkedin.com`;
    window.open(profile, '_blank');
  };

  const downloadEml = () => {
    const email = context.recipientEmail || context.recruiterEmail || context.interviewerEmail || context.interviewerEmailFollowup;
    const subject = generatedSubject || 'Subject';
    const body = generatedMessage;
    const emlContent = `To: ${email}\nSubject: ${subject}\n\n${body}`;
    const blob = new Blob([emlContent], { type: 'message/rfc822' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${subject.replace(/[^a-z0-9]/gi, '_')}.eml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderDynamicFields = () => {
    switch (messageType) {
      case 'connection':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Contact Name *</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={context.contactName}
                  onChange={e => setContext({ ...context, contactName: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Company *</label>
                <input
                  type="text"
                  placeholder="Google"
                  value={context.company}
                  onChange={e => setContext({ ...context, company: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Current Role</label>
                <input
                  type="text"
                  placeholder="Software Engineer"
                  value={context.currentRole}
                  onChange={e => setContext({ ...context, currentRole: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">LinkedIn Profile URL</label>
                <input
                  type="text"
                  placeholder="https://linkedin.com/in/johndoe"
                  value={context.linkedInProfile}
                  onChange={e => setContext({ ...context, linkedInProfile: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Mutual Interests</label>
              <textarea
                rows={2}
                placeholder="e.g., React, machine learning, open source..."
                value={context.mutualInterests}
                onChange={e => setContext({ ...context, mutualInterests: e.target.value })}
                className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Reason for Connecting</label>
              <textarea
                rows={2}
                placeholder="Why do you want to connect with this person?"
                value={context.reasonForConnecting}
                onChange={e => setContext({ ...context, reasonForConnecting: e.target.value })}
                className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
              />
            </div>
          </>
        );
      case 'referral':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Contact Name *</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={context.contactName}
                  onChange={e => setContext({ ...context, contactName: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Company *</label>
                <input
                  type="text"
                  placeholder="Google"
                  value={context.company}
                  onChange={e => setContext({ ...context, company: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Job Title *</label>
                <input
                  type="text"
                  placeholder="Software Engineer"
                  value={context.jobTitle}
                  onChange={e => setContext({ ...context, jobTitle: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Job URL</label>
                <input
                  type="text"
                  placeholder="https://company.com/job/123"
                  value={context.jobUrl}
                  onChange={e => setContext({ ...context, jobUrl: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Resume Version</label>
                <input
                  type="text"
                  placeholder="e.g., Standard Resume, Technical Resume"
                  value={context.resumeVersion}
                  onChange={e => setContext({ ...context, resumeVersion: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Why are you interested?</label>
              <textarea
                rows={3}
                placeholder="Why do you want this role at this company?"
                value={context.whyInterested}
                onChange={e => setContext({ ...context, whyInterested: e.target.value })}
                className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Additional Context</label>
              <textarea
                rows={2}
                placeholder="Any additional information to include..."
                value={context.additionalContext}
                onChange={e => setContext({ ...context, additionalContext: e.target.value })}
                className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
              />
            </div>
          </>
        );
      case 'cold-email':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Recipient Email *</label>
                <input
                  type="email"
                  placeholder="john@company.com"
                  value={context.recipientEmail}
                  onChange={e => setContext({ ...context, recipientEmail: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Recipient Name *</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={context.recipientName}
                  onChange={e => setContext({ ...context, recipientName: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Company *</label>
                <input
                  type="text"
                  placeholder="Google"
                  value={context.company}
                  onChange={e => setContext({ ...context, company: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Job Title *</label>
                <input
                  type="text"
                  placeholder="Software Engineer"
                  value={context.jobTitle}
                  onChange={e => setContext({ ...context, jobTitle: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-[#94a3b8] block mb-2">
                Subject * 
                <span className="ml-2 text-xs text-[#6b7280]">{context.subject.length} / 70</span>
              </label>
              <input
                type="text"
                placeholder="Application for Software Engineer - Your Name"
                value={context.subject}
                onChange={e => setContext({ ...context, subject: e.target.value.slice(0, 70) })}
                className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                maxLength={70}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Resume Version</label>
                <input
                  type="text"
                  placeholder="Standard Resume"
                  value={context.resumeVersion}
                  onChange={e => setContext({ ...context, resumeVersion: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Portfolio URL</label>
                <input
                  type="text"
                  placeholder="https://portfolio.com"
                  value={context.portfolioUrl}
                  onChange={e => setContext({ ...context, portfolioUrl: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">GitHub URL</label>
                <input
                  type="text"
                  placeholder="https://github.com/username"
                  value={context.githubUrl}
                  onChange={e => setContext({ ...context, githubUrl: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Additional Context</label>
              <textarea
                rows={2}
                placeholder="Any additional information to include..."
                value={context.additionalContext}
                onChange={e => setContext({ ...context, additionalContext: e.target.value })}
                className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Your Name *</label>
              <input
                type="text"
                placeholder="Your Name"
                value={context.yourName}
                onChange={e => setContext({ ...context, yourName: e.target.value })}
                className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
              />
            </div>
          </>
        );
      case 'followup':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Recipient Email *</label>
                <input
                  type="email"
                  placeholder="john@company.com"
                  value={context.recipientEmail}
                  onChange={e => setContext({ ...context, recipientEmail: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Recipient Name *</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={context.recipientName}
                  onChange={e => setContext({ ...context, recipientName: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Company *</label>
                <input
                  type="text"
                  placeholder="Google"
                  value={context.company}
                  onChange={e => setContext({ ...context, company: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Last Contact Date</label>
                <input
                  type="date"
                  value={context.lastContactDate}
                  onChange={e => setContext({ ...context, lastContactDate: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Previous Conversation</label>
              <textarea
                rows={3}
                placeholder="What was discussed in your previous conversation?"
                value={context.previousConversation}
                onChange={e => setContext({ ...context, previousConversation: e.target.value })}
                className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Additional Context</label>
              <textarea
                rows={2}
                placeholder="Any additional information..."
                value={context.additionalContext}
                onChange={e => setContext({ ...context, additionalContext: e.target.value })}
                className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Your Name *</label>
              <input
                type="text"
                placeholder="Your Name"
                value={context.yourName}
                onChange={e => setContext({ ...context, yourName: e.target.value })}
                className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
              />
            </div>
          </>
        );
      case 'thankyou':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Interviewer Name *</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={context.interviewerName}
                  onChange={e => setContext({ ...context, interviewerName: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Interviewer Email</label>
                <input
                  type="email"
                  placeholder="john@company.com"
                  value={context.interviewerEmail}
                  onChange={e => setContext({ ...context, interviewerEmail: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Company *</label>
                <input
                  type="text"
                  placeholder="Google"
                  value={context.company}
                  onChange={e => setContext({ ...context, company: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Interview Date</label>
                <input
                  type="date"
                  value={context.interviewDate}
                  onChange={e => setContext({ ...context, interviewDate: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Position</label>
                <input
                  type="text"
                  placeholder="Software Engineer"
                  value={context.position}
                  onChange={e => setContext({ ...context, position: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Topics Discussed</label>
              <textarea
                rows={2}
                placeholder="What topics were discussed during the interview?"
                value={context.topicsDiscussed}
                onChange={e => setContext({ ...context, topicsDiscussed: e.target.value })}
                className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Additional Notes</label>
              <textarea
                rows={2}
                placeholder="Any additional notes..."
                value={context.additionalNotes}
                onChange={e => setContext({ ...context, additionalNotes: e.target.value })}
                className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Your Name *</label>
              <input
                type="text"
                placeholder="Your Name"
                value={context.yourName}
                onChange={e => setContext({ ...context, yourName: e.target.value })}
                className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
              />
            </div>
          </>
        );
      case 'networking':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Contact Name *</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={context.contactName}
                  onChange={e => setContext({ ...context, contactName: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Company *</label>
                <input
                  type="text"
                  placeholder="Google"
                  value={context.company}
                  onChange={e => setContext({ ...context, company: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Role</label>
                <input
                  type="text"
                  placeholder="Software Engineer"
                  value={context.role}
                  onChange={e => setContext({ ...context, role: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Shared Interests</label>
              <textarea
                rows={2}
                placeholder="e.g., React, machine learning, open source..."
                value={context.mutualInterests}
                onChange={e => setContext({ ...context, mutualInterests: e.target.value })}
                className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Reason for Networking</label>
              <textarea
                rows={2}
                placeholder="Why do you want to network with this person?"
                value={context.reasonForNetworking}
                onChange={e => setContext({ ...context, reasonForNetworking: e.target.value })}
                className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
              />
            </div>
          </>
        );
      case 'recruiter':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Recruiter Name *</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={context.recruiterName}
                  onChange={e => setContext({ ...context, recruiterName: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Recruiter Email *</label>
                <input
                  type="email"
                  placeholder="john@company.com"
                  value={context.recruiterEmail}
                  onChange={e => setContext({ ...context, recruiterEmail: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Company *</label>
                <input
                  type="text"
                  placeholder="Google"
                  value={context.company}
                  onChange={e => setContext({ ...context, company: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Job Title *</label>
                <input
                  type="text"
                  placeholder="Software Engineer"
                  value={context.jobTitle}
                  onChange={e => setContext({ ...context, jobTitle: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Resume Version</label>
                <input
                  type="text"
                  placeholder="Standard Resume"
                  value={context.resumeVersion}
                  onChange={e => setContext({ ...context, resumeVersion: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Portfolio URL</label>
                <input
                  type="text"
                  placeholder="https://portfolio.com"
                  value={context.portfolioUrl}
                  onChange={e => setContext({ ...context, portfolioUrl: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Why are you a good fit?</label>
              <textarea
                rows={3}
                placeholder="Explain why you're a strong candidate for this role..."
                value={context.whyGoodFit}
                onChange={e => setContext({ ...context, whyGoodFit: e.target.value })}
                className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Additional Context</label>
              <textarea
                rows={2}
                placeholder="Any additional information..."
                value={context.additionalContext}
                onChange={e => setContext({ ...context, additionalContext: e.target.value })}
                className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Your Name *</label>
              <input
                type="text"
                placeholder="Your Name"
                value={context.yourName}
                onChange={e => setContext({ ...context, yourName: e.target.value })}
                className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
              />
            </div>
          </>
        );
      case 'interview-followup':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Interviewer Email *</label>
                <input
                  type="email"
                  placeholder="john@company.com"
                  value={context.interviewerEmailFollowup}
                  onChange={e => setContext({ ...context, interviewerEmailFollowup: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Interviewer Name *</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={context.interviewerNameFollowup}
                  onChange={e => setContext({ ...context, interviewerNameFollowup: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Company *</label>
                <input
                  type="text"
                  placeholder="Google"
                  value={context.company}
                  onChange={e => setContext({ ...context, company: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Interview Date</label>
                <input
                  type="date"
                  value={context.interviewDateFollowup}
                  onChange={e => setContext({ ...context, interviewDateFollowup: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Interview Round</label>
                <input
                  type="text"
                  placeholder="e.g., Technical Round, HR Round"
                  value={context.interviewRound}
                  onChange={e => setContext({ ...context, interviewRound: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Additional Context</label>
              <textarea
                rows={2}
                placeholder="Any additional information..."
                value={context.additionalContext}
                onChange={e => setContext({ ...context, additionalContext: e.target.value })}
                className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Your Name *</label>
              <input
                type="text"
                placeholder="Your Name"
                value={context.yourName}
                onChange={e => setContext({ ...context, yourName: e.target.value })}
                className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const getRequiredFields = () => {
    switch (messageType) {
      case 'connection':
        return [context.contactName, context.company];
      case 'referral':
        return [context.contactName, context.company, context.jobTitle];
      case 'cold-email':
        return [context.recipientEmail, context.recipientName, context.company, context.jobTitle, context.subject, context.yourName];
      case 'followup':
        return [context.recipientEmail, context.recipientName, context.company, context.yourName];
      case 'thankyou':
        return [context.interviewerName, context.company, context.yourName];
      case 'networking':
        return [context.contactName, context.company];
      case 'recruiter':
        return [context.recruiterName, context.recruiterEmail, context.company, context.jobTitle, context.yourName];
      case 'interview-followup':
        return [context.interviewerEmailFollowup, context.interviewerNameFollowup, context.company, context.yourName];
      default:
        return [];
    }
  };

  const isFormValid = getRequiredFields().every(field => field.trim().length > 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">AI Message Generator</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Message Type</label>
          <select
            value={messageType}
            onChange={(e) => setMessageType(e.target.value)}
            className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white"
          >
            {messageTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        {renderDynamicFields()}

        <button
          onClick={generateMessage}
          disabled={isGenerating || !isFormValid}
          className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-[#232d3f] disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-white transition-colors"
        >
          {isGenerating ? 'Generating...' : 'Generate Message'}
        </button>

        {generatedMessage && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-[#94a3b8]">Generated Message</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setGeneratedMessage('')}
                  className="px-3 py-1.5 bg-[#232d3f] hover:bg-[#1f2937] rounded-lg text-xs font-semibold text-white transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={generateMessage}
                  className="px-3 py-1.5 bg-[#232d3f] hover:bg-[#1f2937] rounded-lg text-xs font-semibold text-white transition-colors"
                >
                  Regenerate
                </button>
              </div>
            </div>

            {/* AI Suggestions Panel */}
            <div className="bg-[#131a26] border border-[#232d3f] rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-[#94a3b8] mb-1">Tone</div>
                  <div className="text-white font-semibold">{aiSuggestions.tone}</div>
                </div>
                <div>
                  <div className="text-[#94a3b8] mb-1">Best Resume</div>
                  <div className="text-white font-semibold">{aiSuggestions.bestResume}</div>
                </div>
                <div>
                  <div className="text-[#94a3b8] mb-1">Best Time to Send</div>
                  <div className="text-white font-semibold">{aiSuggestions.bestTime}</div>
                </div>
                <div>
                  <div className="text-[#94a3b8] mb-1">Response Probability</div>
                  <div className="text-white font-semibold">{aiSuggestions.responseProbability}%</div>
                </div>
              </div>
            </div>

            {/* Subject for email types */}
            {generatedSubject && (
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Subject</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={generatedSubject}
                    onChange={(e) => setGeneratedSubject(e.target.value)}
                    className="flex-1 px-4 py-2 bg-[#1b2535] border border-[#232d3f] rounded-lg text-white"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedSubject)}
                    className="px-3 py-2 bg-[#232d3f] hover:bg-[#1f2937] rounded-lg text-xs font-semibold text-white transition-colors"
                  >
                    Copy Subject
                  </button>
                </div>
              </div>
            )}

            {/* Message with character count */}
            <div>
              <label className="text-sm font-semibold text-[#94a3b8] block mb-2">
                Message
                <span className="ml-2 text-xs text-[#6b7280]">{generatedMessage.length} {messageType === 'connection' ? '/ 300' : messageType === 'networking' ? '/ 500' : 'characters'}</span>
              </label>
              <textarea
                value={generatedMessage}
                onChange={(e) => setGeneratedMessage(e.target.value)}
                rows={8}
                className="w-full px-4 py-2 bg-[#1b2535] border border-[#232d3f] rounded-lg text-white"
                maxLength={messageType === 'connection' ? 300 : messageType === 'networking' ? 500 : undefined}
              />
            </div>

            {/* Type-specific action buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={copyToClipboard}
                className="flex-1 min-w-[120px] px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-semibold text-white transition-colors"
              >
                Copy
              </button>

              {(messageType === 'cold-email' || messageType === 'followup' || messageType === 'thankyou' || messageType === 'recruiter' || messageType === 'interview-followup') && (
                <button
                  onClick={openGmail}
                  className="flex-1 min-w-[120px] px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold text-white transition-colors"
                >
                  Open Gmail
                </button>
              )}

              {(messageType === 'connection' || messageType === 'referral' || messageType === 'networking') && (
                <button
                  onClick={openLinkedIn}
                  className="flex-1 min-w-[120px] px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold text-white transition-colors"
                >
                  Open LinkedIn
                </button>
              )}

              {messageType === 'cold-email' && (
                <button
                  onClick={downloadEml}
                  className="flex-1 min-w-[120px] px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-semibold text-white transition-colors"
                >
                  Download .eml
                </button>
              )}
            </div>

            {/* Resume attachment reminder for cold email */}
            {messageType === 'cold-email' && (
              <div className="bg-yellow-600/10 border border-yellow-600/20 rounded-lg p-3 text-xs text-yellow-400">
                ⚠️ Remember to attach your resume before sending.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const FollowUpManager: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Follow-up Manager</h2>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-semibold text-white">
          Add Follow-up
        </button>
      </div>

      <div className="text-center py-12 text-[#94a3b8] border border-dashed border-[#232d3f] rounded-xl">
        No follow-ups scheduled yet.
      </div>
    </div>
  );
};

const ReferralAnalytics: React.FC = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['referral-analytics'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/referrals/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    }
  });

  const stats = [
    { label: 'Total Contacts', value: analytics?.totalContacts || 0, color: 'text-indigo-400' },
    { label: 'Connections Sent', value: analytics?.connectionsSent || 0, color: 'text-amber-400' },
    { label: 'Accepted Connections', value: analytics?.acceptedConnections || 0, color: 'text-emerald-400' },
    { label: 'Referral Requests', value: analytics?.referralRequests || 0, color: 'text-purple-400' },
    { label: 'Referrals Received', value: analytics?.referralsReceived || 0, color: 'text-cyan-400' },
    { label: 'Interviews via Referrals', value: analytics?.interviewsViaReferrals || 0, color: 'text-pink-400' },
    { label: 'Offers via Referrals', value: analytics?.offersViaReferrals || 0, color: 'text-green-400' },
    { label: 'Success Rate', value: `${analytics?.successRate?.toFixed(1) || 0}%`, color: 'text-yellow-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Referral Analytics</h2>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[#94a3b8]">Loading analytics...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-4">
                <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">{stat.label}</span>
                <h3 className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</h3>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Top Companies by Referral Activity</h3>
              {analytics?.topCompanies?.length === 0 ? (
                <p className="text-sm text-[#94a3b8]">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {analytics?.topCompanies?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-sm text-white">{item.company}</span>
                      <span className="text-sm text-indigo-400 font-semibold">{item.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Contacts by Category</h3>
              {Object.keys(analytics?.contactsByCategory || {}).length === 0 ? (
                <p className="text-sm text-[#94a3b8]">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(analytics?.contactsByCategory || {}).map(([category, count]: [string, any]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-sm text-white">{category}</span>
                      <span className="text-sm text-indigo-400 font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
