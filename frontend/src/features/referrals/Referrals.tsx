import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, MessageSquare, Clock, BarChart3, Search, Copy, Plus, Trash2, Tag, Mail, Download, Star, X, Edit, Handshake } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader.js';

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
      <PageHeader
        themeKey="referrals"
        title="Recruiter CRM & Referrals"
        description="Request and track employee referral contacts across target companies."
        icon={Handshake}
      />

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
  const [editingContact, setEditingContact] = useState<ReferralContact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    category: 'Recruiter' as ReferralContact['category'],
    company: '',
    linkedInUrl: '',
    email: '',
    location: '',
    notes: '',
    tags: '',
    connectionStatus: 'Potential Contact' as ReferralContact['connectionStatus']
  });

  const extractCleanEmail = (rawEmailStr?: string): string => {
    if (!rawEmailStr) return '';
    const match = rawEmailStr.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (match) return match[1].trim();
    return rawEmailStr.replace(/^[^(<]*[((<]/, '').replace(/[>)]*$/, '').trim();
  };

  const openGmailCompose = (contact: ReferralContact) => {
    const cleanEmail = extractCleanEmail(contact.email || '');
    const subject = `Inquiry about opportunities at ${contact.company}`;
    const body = `Hi ${contact.name},\n\nI hope this email finds you well. I'm writing to express my interest in opportunities at ${contact.company}. Given your role as ${contact.role}, I would value any insights you might share about the team culture or potential openings.\n\nBest regards`;
    
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(cleanEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
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
        tags: '',
        connectionStatus: 'Potential Contact'
      });
    }
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/referrals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...data,
          tags: typeof data.tags === 'string'
            ? data.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
            : data.tags
        })
      });
      if (!res.ok) throw new Error('Failed to update referral');
      return res.json();
    },
    onSuccess: () => {
      refetch();
      setEditingContact(null);
      setFormData({
        name: '',
        role: '',
        category: 'Recruiter',
        company: '',
        linkedInUrl: '',
        email: '',
        location: '',
        notes: '',
        tags: '',
        connectionStatus: 'Potential Contact'
      });
    }
  });

  const handleStartEdit = (contact: ReferralContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      role: contact.role || '',
      category: contact.category,
      company: contact.company,
      linkedInUrl: contact.linkedInUrl || '',
      email: contact.email || '',
      location: contact.location || '',
      notes: contact.notes || '',
      tags: contact.tags ? contact.tags.join(', ') : '',
      connectionStatus: contact.connectionStatus
    });
    setShowAddForm(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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



  const handleCSVExport = () => {
    if (!referrals || referrals.length === 0) {
      alert('No contacts to export.');
      return;
    }

    const headers = ['Name', 'Role', 'Category', 'Company', 'LinkedIn URL', 'Email', 'Location', 'Tags', 'Status', 'Notes'];
    const rows = referrals.map(contact => [
      contact.name,
      contact.role || '',
      contact.category,
      contact.company,
      contact.linkedInUrl || '',
      contact.email || '',
      contact.location || '',
      contact.tags ? contact.tags.join('; ') : '',
      contact.connectionStatus,
      contact.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `referrals_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
            onClick={() => {
              setEditingContact(null);
              setFormData({
                name: '',
                role: '',
                category: 'Recruiter',
                company: '',
                linkedInUrl: '',
                email: '',
                location: '',
                notes: '',
                tags: '',
                connectionStatus: 'Potential Contact'
              });
              setShowAddForm(!showAddForm);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-semibold text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </button>
          <button
            onClick={handleCSVExport}
            className="flex items-center gap-2 px-4 py-2 bg-[#0077b5] hover:bg-[#006097] rounded-lg text-sm font-semibold text-white transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
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

      {(showAddForm || editingContact) && (
        <div className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">
            {editingContact ? 'Edit Contact' : 'Add New Contact'}
          </h3>
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
            {editingContact && (
              <select
                value={formData.connectionStatus}
                onChange={e => setFormData({ ...formData, connectionStatus: e.target.value as any })}
                className="px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white"
              >
                {PIPELINE_STAGES.map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            )}
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
              onClick={() => {
                if (editingContact) {
                  editMutation.mutate({ id: editingContact.id, data: formData });
                } else {
                  saveMutation.mutate(formData);
                }
              }}
              disabled={(editingContact ? editMutation.isPending : saveMutation.isPending) || !formData.name || !formData.company}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-[#232d3f] disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-white"
            >
              {editingContact ? (editMutation.isPending ? 'Saving...' : 'Save Changes') : (saveMutation.isPending ? 'Saving...' : 'Save Contact')}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingContact(null);
                setFormData({
                  name: '',
                  role: '',
                  category: 'Recruiter',
                  company: '',
                  linkedInUrl: '',
                  email: '',
                  location: '',
                  notes: '',
                  tags: '',
                  connectionStatus: 'Potential Contact'
                });
              }}
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
                        <p className="text-sm text-[#94a3b8]">{contact.company} - {contact.role}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-block px-2 py-0.5 bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 text-xs font-semibold rounded-full">
                            {contact.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStartEdit(contact)}
                          className="text-[#94a3b8] hover:text-white transition-colors"
                          title="Edit Contact"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(contact.id)}
                          className="text-red-400 hover:text-red-500 transition-colors"
                          title="Delete Contact"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Confidence Score and Recommendation */}
                    {contact.tags?.includes('LinkedIn Import') && contact.notes && (
                      <div className="mb-3 p-3 bg-[#1b2535] rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Star className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-semibold text-white">Recommendation</span>
                        </div>
                        <p className="text-xs text-[#94a3b8] whitespace-pre-wrap">{contact.notes}</p>
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
                            title="Copy URL"
                          >
                            <Copy className="w-3.5 h-3.5" />
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
                        <p className="text-xs text-[#94a3b8] whitespace-pre-wrap">{contact.notes}</p>
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

interface ResumeSelectorProps {
  value: string;
  onChange: (val: string) => void;
  resumes: { name: string; content: string }[] | undefined;
}

const ResumeSelector: React.FC<ResumeSelectorProps> = ({ value, onChange, resumes }) => {
  const [sourceMode, setSourceMode] = useState<'manager' | 'file'>('manager');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const buffer = await file.arrayBuffer();

      const parseRes = await fetch('/api/resumes/parse', {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream'
        },
        body: buffer
      });
      if (!parseRes.ok) {
        const err = await parseRes.json();
        throw new Error(err.error || 'Server parsing error');
      }
      const parseData = await parseRes.json();
      const parsedText = parseData.text || `${baseName} content`;

      const saveRes = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: baseName, content: parsedText })
      });
      if (!saveRes.ok) {
        throw new Error('Failed to save resume profile to database');
      }

      await queryClient.invalidateQueries({ queryKey: ['resumes'] });
      onChange(baseName);
      setUploadedFileName(file.name);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Error uploading file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-[#94a3b8]">
          Resume
        </label>
        <div className="flex bg-[#131a26] p-1 border border-[#232d3f] rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setSourceMode('manager')}
            className={`px-3 py-1 rounded-md transition-colors ${
              sourceMode === 'manager'
                ? 'bg-violet-600 text-white font-medium'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Resume Manager
          </button>
          <button
            type="button"
            onClick={() => setSourceMode('file')}
            className={`px-3 py-1 rounded-md transition-colors ${
              sourceMode === 'file'
                ? 'bg-violet-600 text-white font-medium'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Upload File
          </button>
        </div>
      </div>

      {sourceMode === 'manager' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white focus:outline-none focus:border-violet-500 transition-colors"
        >
          <option value="">Select Existing Resume</option>
          {resumes?.map((r) => (
            <option key={r.name} value={r.name}>
              {r.name}
            </option>
          ))}
        </select>
      ) : (
        <div className="p-4 bg-[#131a26] border border-dashed border-[#232d3f] rounded-lg flex flex-col gap-2 items-center justify-center transition-all duration-200">
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
            disabled={isUploading}
            className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-500/10 file:text-violet-400 hover:file:bg-violet-500/20 cursor-pointer disabled:opacity-50"
          />
          {uploadedFileName && !isUploading && !uploadError && (
            <span className="text-xs text-emerald-400 font-bold mt-1">
              ✓ Loaded: {uploadedFileName}
            </span>
          )}
          {isUploading && (
            <span className="text-xs text-violet-400 animate-pulse mt-1">
              Parsing and saving file...
            </span>
          )}
          {uploadError && (
            <span className="text-xs text-rose-400 mt-1">
              ⚠️ {uploadError}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const AIMessageGenerator: React.FC = () => {
  const { data: resumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: async () => {
      const res = await fetch('/api/resumes');
      if (!res.ok) throw new Error('Failed to load resumes');
      return res.json() as Promise<{ name: string; content: string }[]>;
    }
  });

  const [messageType, setMessageType] = useState('connection');
  const [isShorter, setIsShorter] = useState(false);
  const [isMorePersonal, setIsMorePersonal] = useState(false);
  const [isFormal, setIsFormal] = useState(false);
  const [isFriendly, setIsFriendly] = useState(false);
  const [isConfident, setIsConfident] = useState(false);
  const [isDetailed, setIsDetailed] = useState(false);
  const [mentionCompany, setMentionCompany] = useState(true);
  const [mentionRole, setMentionRole] = useState(true);
  const [mentionInterest, setMentionInterest] = useState(true);
  const [mentionConnection, setMentionConnection] = useState(false);
  const [mentionAchievement, setMentionAchievement] = useState(false);
  const [showRewriteDropdown, setShowRewriteDropdown] = useState(false);
  const [showPersDropdown, setShowPersDropdown] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [generatedSubject, setGeneratedSubject] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSubjectCopied, setIsSubjectCopied] = useState(false);
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
    mutualConnection: '',
    recentAchievement: '',
    
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
    experienceLevel: '',
    
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
    
    // New fields
    contactInfo: '',
    
    // Legacy
    jobDescription: '',
    yourName: '',
  });

  const messageTypes = [
    { id: 'connection', name: 'LinkedIn Connection Request' },
    { id: 'referral', name: 'Referral Request' },
    { id: 'recruiter', name: 'Recruiter Outreach' },
    { id: 'cold-email', name: 'Cold Email' },
    { id: 'followup', name: 'Follow-up Message' },
    { id: 'thankyou', name: 'Thank You Email' },
  ];

  const generateMessage = async () => {
    if (['referral', 'cold-email', 'recruiter'].includes(messageType) && !context.resumeVersion) {
      alert("Please select or upload a resume before generating a message.");
      return;
    }

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
          tone = isFormal ? 'Formal' : isFriendly ? 'Casual' : isConfident ? 'Confident' : 'Professional';
          bestTime = 'Tuesday-Thursday, 9 AM - 11 AM';
          responseProb = 75;
          
          const stripEmojis = (str: string) => str.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '');

          const fullName = stripEmojis(context.contactName || '[Name]').trim();
          const firstName = fullName.split(' ')[0];
          const company = mentionCompany ? stripEmojis(context.company || '').trim() : '';
          const role = mentionRole ? stripEmojis(context.currentRole || '').trim() : '';
          
          let baseStr = isFormal ? `Dear ${fullName}, ` : isFriendly ? `Hi ${firstName}! ` : `Hi ${firstName}, `;

          // Connection part
          let connPart = '';
          if (mentionConnection && context.mutualConnection) {
            const cleanConn = stripEmojis(context.mutualConnection).trim();
            if (cleanConn) {
              connPart = isFormal 
                ? `Our mutual contact, ${cleanConn}, recommended that I contact you. `
                : `Our mutual connection, ${cleanConn}, suggested I reach out. `;
            }
          }

          // Achievement part
          let achPart = '';
          if (mentionAchievement && context.recentAchievement) {
            const cleanAch = stripEmojis(context.recentAchievement).trim().replace(/\.+$/, '');
            if (cleanAch) {
              achPart = `Congrats on ${cleanAch}! `;
            }
          }

          // Format role journey: e.g. "backend engineer" -> "backend engineering"
          let rolePhrase = role.toLowerCase();
          if (rolePhrase.endsWith(' engineer')) {
            rolePhrase = rolePhrase.replace(' engineer', ' engineering');
          } else if (rolePhrase.endsWith(' developer')) {
            rolePhrase = rolePhrase.replace(' developer', ' development');
          } else if (rolePhrase.endsWith(' manager')) {
            rolePhrase = rolePhrase.replace(' manager', ' management');
          } else if (rolePhrase.endsWith(' analyst')) {
            rolePhrase = rolePhrase.replace(' analyst', ' analytics');
          } else if (!rolePhrase && context.reasonForConnecting) {
            rolePhrase = stripEmojis(context.reasonForConnecting).toLowerCase().replace(/\.+$/, '');
          }

          // Mention interest
          let interestPart = '';
          if (mentionInterest && context.mutualInterests) {
            const cleanInt = stripEmojis(context.mutualInterests).trim();
            const firstInterest = cleanInt.split(',')[0].trim().replace(/\.+$/, '');
            if (firstInterest) {
              interestPart = isFormal 
                ? `I noted our shared interest in ${firstInterest}. `
                : `I saw we share an interest in ${firstInterest}. `;
            }
          }

          // Main body
          let bodyStr = '';
          if (role && company) {
            bodyStr = isFormal 
              ? `I am following your ${rolePhrase} progression at ${company} with great interest. `
              : isConfident 
              ? `I'm very impressed by your ${rolePhrase} achievements at ${company}. `
              : isMorePersonal 
              ? `your work as a ${role} at ${company} really stood out to me. `
              : `your ${rolePhrase} journey at ${company} aligns with my career interests. `;
          } else if (company) {
            bodyStr = `your work at ${company} caught my attention. `;
          } else if (role) {
            bodyStr = `your experience as a ${role} caught my attention. `;
          }

          // Ask / CTA part
          let askStr = '';
          if (isShorter) {
            askStr = isFormal ? `I would love to connect.` : `I'd love to connect.`;
          } else if (isDetailed) {
            askStr = isFormal
              ? `I am currently building my skills in this space and would appreciate the opportunity to connect and follow your work.`
              : `I'm currently building my skills in this space and would love to connect and follow your journey.`;
          } else {
            askStr = isFormal 
              ? `I would appreciate the opportunity to connect and learn from your professional experience.`
              : isConfident 
              ? `I'd love to connect to discuss potential synergy and learn from your work.`
              : isFriendly 
              ? `I'd love to connect and chat sometime!`
              : `I'd love to connect and learn from your experience.`;
          }

          message = `${baseStr}${achPart}${connPart}${bodyStr}${interestPart}${askStr}`;

          // Enforce 180 char limit safely
          if (message.length > 180) {
            const fallbackAsk = "I'd love to connect.";
            const budget = 180 - baseStr.length - fallbackAsk.length - 15;
            let miniBody = '';
            if (company && budget > company.length) {
              miniBody = `your work at ${company} caught my eye. `;
            }
            message = `${baseStr}${miniBody}${fallbackAsk}`;
          }
          break;
        case 'referral':
          tone = 'Professional';
          bestTime = 'Wednesday-Friday, 10 AM - 12 PM';
          responseProb = 60;
          
          const refName = (context.contactName || '[Name]').trim();
          const refCompany = (context.company || '[Company]').trim();
          const refJobTitle = (context.jobTitle || '[Role]').trim();
          const refJobUrl = (context.jobUrl || '').trim();
          const refJobUrlStr = refJobUrl ? ` (${refJobUrl})` : '';

          const refBaseStr = `Hi ${refName}, I'm interested in the ${refJobTitle} role at ${refCompany}${refJobUrlStr}. `;
          const refAskStr = `Could you please consider referring me?`;
          const refTargetLimit = 175;

          const rawRefContext = (context.additionalContext || context.whyInterested || '').trim();
          let cleanRefContext = rawRefContext.replace(/\.+$/, '');
          let refContextPart = cleanRefContext ? `${cleanRefContext}. ` : 'I believe my background would be a great fit for the team. ';

          let refCurrentLen = refBaseStr.length + refContextPart.length + refAskStr.length;

          if (refCurrentLen > refTargetLimit) {
            // Shorten the context part to fit the available space
            const refAvailableSpace = refTargetLimit - refBaseStr.length - refAskStr.length - 2;
            if (refAvailableSpace > 15) {
              let truncated = cleanRefContext.slice(0, refAvailableSpace - 3).trim();
              const lastSpace = truncated.lastIndexOf(' ');
              if (lastSpace > 10) {
                truncated = truncated.slice(0, lastSpace);
              }
              refContextPart = `${truncated}... `;
            } else {
              refContextPart = ''; // omit context part entirely if too tight
            }
          }

          message = `${refBaseStr}${refContextPart}${refAskStr}`;
          break;
        case 'cold-email':
          tone = 'Professional';
          bestTime = 'Tuesday-Thursday, 10 AM - 2 PM';
          responseProb = 45;
          
          const ceRecipient = (context.recipientName || context.contactName || '').trim();
          const ceRecipientFinal = ceRecipient ? ceRecipient : 'Hiring Manager';
          const ceRole = (context.jobTitle || '[Role]').trim();
          const ceCompany = (context.company || '[Company]').trim();
          const ceCompanyClean = ceCompany.endsWith('.') ? ceCompany.slice(0, -1) : ceCompany;
          const cePortfolio = (context.portfolioUrl || '').trim();
          const ceGithub = (context.githubUrl || '').trim();
          const ceLinkedIn = (context.linkedInProfile || '').trim();
          const ceContact = (context.contactInfo || '').trim();
          const ceYourName = (context.yourName || '[Your Name]').trim();
          const ceContext = (context.additionalContext || '').trim();
          
          const defaultSubject = `Application for ${ceRole} - ${ceYourName}`;
          subject = context.subject || defaultSubject;
          if (!context.subject) {
            setContext(prev => ({ ...prev, subject: defaultSubject }));
          }
          
          let ceContactLines = '';
          if (ceContact) ceContactLines += `\n${ceContact}`;
          if (ceLinkedIn) ceContactLines += `\nLinkedIn: ${ceLinkedIn}`;
          if (ceGithub) ceContactLines += `\nGitHub: ${ceGithub}`;
          if (cePortfolio) ceContactLines += `\nPortfolio: ${cePortfolio}`;
          
          const lowerContext = ceContext.toLowerCase();
          const lowerRole = ceRole.toLowerCase();
          
          const hasData = /sql|python|power\s*bi|tableau|pandas|excel|etl|analytics|statistics|data/.test(lowerContext) || /analyst|data|analytics/.test(lowerRole);
          const hasFrontend = /react|javascript|typescript|html|css|tailwind|angular|vue|frontend/.test(lowerContext) || /frontend|front\s*end|web/.test(lowerRole);
          const hasBackend = /java|spring|node|django|flask|c#|c\+\+|go\s*lang|api|rest|backend/.test(lowerContext) || /backend|back\s*end|developer|engineer|software|sde/.test(lowerRole);
          
          let domainsStr = '';
          let techsStr = '';
          let strengthsStr = '';
          
          if (hasData) {
            domainsStr = "data analytics, data visualization, and reporting";
            techsStr = "SQL, Power BI, Python, and Excel";
            strengthsStr = "analytical thinking, attention to detail, and ability to derive actionable insights";
          } else if (hasBackend) {
            domainsStr = "software engineering, backend development, and database systems";
            techsStr = "Java, Spring Boot, REST APIs, JavaScript, Git, and SQL";
            strengthsStr = "software engineering fundamentals, database integration skills, and clean coding practices";
          } else if (hasFrontend) {
            domainsStr = "frontend engineering, interactive web interfaces, and responsive design";
            techsStr = "React, TypeScript, Next.js, and Tailwind CSS";
            strengthsStr = "user experience design, responsive component architecture, and modern styling";
          } else {
            domainsStr = "software engineering, backend development, and database systems";
            techsStr = "Java, Spring Boot, REST APIs, JavaScript, Git, and SQL";
            strengthsStr = "software engineering fundamentals, database integration skills, and clean coding practices";
          }
          
          const isIntern = /intern/i.test(ceRole);
          
          let experienceLevel: 'student-intern' | 'recent-grad' | 'entry-level' | 'experienced' = 'recent-grad';
          if (context.experienceLevel) {
            experienceLevel = context.experienceLevel as 'student-intern' | 'recent-grad' | 'entry-level' | 'experienced';
          } else if (resumes && resumes.length > 0) {
            const selectedRes = resumes.find(r => 
              r.name.toLowerCase().includes((context.resumeVersion || '').toLowerCase().trim())
            ) || resumes[0];
            
            if (selectedRes && selectedRes.content) {
              const resContent = selectedRes.content.toLowerCase();
              const hasTwoPlus = /2\+?\s*years|3\+?\s*years|4\+?\s*years|5\+?\s*years|senior\s+engineer|lead\s+engineer/i.test(resContent);
              const hasZeroToTwo = /1\s*year|2\s*years|0-2\s*years/i.test(resContent);
              
              if (hasTwoPlus || /senior|lead|manager/i.test(ceRole)) {
                experienceLevel = 'experienced';
              } else if (hasZeroToTwo || /sde\s*ii\b|software\s*engineer\s*ii\b/i.test(ceRole)) {
                experienceLevel = 'entry-level';
              } else if (isIntern || /student|pursuing|vit\s*vellore/i.test(resContent)) {
                experienceLevel = 'student-intern';
              }
            }
          }

          let defaultEdu = 'recent B.Tech Computer Science graduate';
          if (experienceLevel === 'student-intern') {
            defaultEdu = 'final-year B.Tech Computer Science student at VIT Vellore';
          } else if (experienceLevel === 'recent-grad') {
            defaultEdu = 'recent B.Tech Computer Science graduate';
          } else if (experienceLevel === 'entry-level') {
            defaultEdu = 'Software Engineer with professional experience';
          } else if (experienceLevel === 'experienced') {
            defaultEdu = 'Software Engineer with a proven track record of delivering scalable systems';
          }
          const eduStr = defaultEdu;
          
          const introOptions = [
            `I'm a ${eduStr} with a strong interest in ${domainsStr}, and I'm writing to express my interest in the ${ceRole} position at ${ceCompanyClean}.`,
            `As a ${eduStr} passionate about ${domainsStr}, I would love to submit my application for the ${ceRole} role at ${ceCompanyClean}.`,
            `I recently came across the ${ceRole} opening at ${ceCompanyClean}. As a ${eduStr} with hands-on experience in ${domainsStr}, I believe my background aligns well with this opportunity.`,
            `I'm writing to express my interest in the ${ceRole} position at ${ceCompanyClean}. I'm a ${eduStr} with a strong foundation in ${domainsStr}.`,
            `I'm reaching out to apply for the ${ceRole} opportunity at ${ceCompanyClean}. With my background as a ${eduStr} focused on ${domainsStr}, I am eager to contribute to your team.`,
            `I would welcome the opportunity to apply for the ${ceRole} position at ${ceCompanyClean}. I'm a ${eduStr} with strong foundations in ${domainsStr}.`
          ];
          const introParagraph = introOptions[Math.floor(Math.random() * introOptions.length)];
          
          let datasetPhrase = '';
          if (hasData) {
            datasetPhrase = "from real-world datasets";
          } else {
            datasetPhrase = "while working with real-world projects";
          }
          
          let roleSolutionsType = '';
          if (hasData) {
            roleSolutionsType = "data analysis, dashboard development, and workflow automation";
          } else if (hasBackend) {
            roleSolutionsType = "backend engineering, API development, and system integration";
          } else if (hasFrontend) {
            roleSolutionsType = "frontend engineering, responsive UI development, and component architecture";
          } else {
            roleSolutionsType = "software engineering, database integration, and workflow automation";
          }
          
          interface ResumeProject {
            name: string;
            content: string;
            score: number;
          }
          
          let candidateProjects: ResumeProject[] = [];
          if (resumes && resumes.length > 0) {
            const selectedRes = resumes.find(r => 
              r.name.toLowerCase().includes((context.resumeVersion || '').toLowerCase().trim())
            ) || resumes[0];
            
            if (selectedRes && selectedRes.content) {
              const resContent = selectedRes.content;
              const projectsSection = resContent.match(/(?:projects|key projects|academic projects)[\s\S]*?(?:experience|work experience|professional experience|education|skills|coding profile|certifications|$)/i);
              if (projectsSection) {
                const lines = projectsSection[0].split('\n');
                let currentProject: ResumeProject | null = null;
                for (const line of lines) {
                  let matchedName = '';
                  const mBullet = line.match(/^\s*[-•*]\s*([A-Z][a-zA-Z0-9\s\-–—]{2,50}?)(?:\s*[—\-–\(\:]|$)/);
                  const mLatex = line.match(/^\s*\\item\s*(?:\\textbf\{)?([A-Z][a-zA-Z0-9\s\-–—]{2,50}?)(?:\}|\s*[—\-–\(\:]|$)/);
                  
                  if (mBullet) {
                    matchedName = mBullet[1].trim();
                  } else if (mLatex) {
                    matchedName = mLatex[1].trim();
                  }
                  
                  if (matchedName && !/project|academic|tech stack/i.test(matchedName)) {
                    if (currentProject && !candidateProjects.some(p => p.name.toLowerCase() === currentProject!.name.toLowerCase())) {
                      candidateProjects.push(currentProject);
                    }
                    currentProject = {
                      name: matchedName,
                      content: line,
                      score: 0
                    };
                  } else if (currentProject) {
                    currentProject.content += '\n' + line;
                  }
                }
                if (currentProject && !candidateProjects.some(p => p.name.toLowerCase() === currentProject.name.toLowerCase())) {
                  candidateProjects.push(currentProject);
                }
              }
            }
          }
          
          candidateProjects.forEach(proj => {
            const projLower = proj.content.toLowerCase();
            if (hasData) {
              if (/sql|query|database/i.test(projLower)) proj.score += 3;
              if (/power\s*bi|tableau|dashboard|visualization|dax/i.test(projLower)) proj.score += 4;
              if (/excel|pandas|analytics|insights/i.test(projLower)) proj.score += 2;
              if (/python|r/i.test(projLower)) proj.score += 1;
            } else if (hasBackend) {
              if (/java|spring|boot|node|javascript/i.test(projLower)) proj.score += 3;
              if (/api|rest|microservices|fastapi|mcp/i.test(projLower)) proj.score += 4;
              if (/sql|postgres|mysql|docker|postgresql|duckdb/i.test(projLower)) proj.score += 3;
            } else if (hasFrontend) {
              if (/react|next\.js|angular/i.test(projLower)) proj.score += 3;
              if (/typescript|javascript|ui|ux/i.test(projLower)) proj.score += 3;
              if (/tailwind|css|html/i.test(projLower)) proj.score += 2;
            } else {
              if (/llm|rag|langchain|vector|faiss/i.test(projLower)) proj.score += 4;
              if (/ai|agent|ml|machine\s*learning|ppo|reinforcement/i.test(projLower)) proj.score += 4;
              if (/python|model/i.test(projLower)) proj.score += 2;
            }
          });
          
          candidateProjects.sort((a, b) => b.score - a.score);
          const topProjects = candidateProjects.slice(0, 2);
          
          let projectsNamePhrase = '';
          if (topProjects.length >= 2) {
            projectsNamePhrase = `projects such as ${topProjects[0].name} and ${topProjects[1].name}`;
          } else if (topProjects.length === 1) {
            projectsNamePhrase = `projects such as ${topProjects[0].name}`;
          } else {
            projectsNamePhrase = hasData 
              ? "projects involving data analytics and dashboard development"
              : (hasBackend ? "projects involving backend architecture and API integration"
              : (hasFrontend ? "projects involving frontend engineering and interactive user interfaces"
              : "projects involving software engineering and application automation"));
          }
          
          // Parse work experience sections from the resume content
          let parsedWorkExperience: string[] = [];
          if (resumes && resumes.length > 0) {
            const selectedRes = resumes.find(r => 
              r.name.toLowerCase().includes((context.resumeVersion || '').toLowerCase().trim())
            ) || resumes[0];
            
            if (selectedRes && selectedRes.content) {
              const resContent = selectedRes.content;
              const expSection = resContent.match(/(?:experience|work experience|professional experience)[\s\S]*?(?:projects|education|skills|$)/i);
              if (expSection) {
                const lines = expSection[0].split('\n');
                let currentExp = '';
                for (const line of lines) {
                  const cleanLine = line.trim();
                  if (/^[-•*]\s*/.test(cleanLine)) {
                    if (currentExp) parsedWorkExperience.push(currentExp);
                    currentExp = cleanLine.replace(/^[-•*]\s*/, '');
                  } else if (currentExp && cleanLine) {
                    currentExp += ' ' + cleanLine;
                  }
                }
                if (currentExp) parsedWorkExperience.push(currentExp);
              }
            }
          }
          

          
          let projectsParagraph = '';
          const primaryExp = parsedWorkExperience.length > 0 ? parsedWorkExperience[0] : `working in ${domainsStr}`;
          
          if (experienceLevel === 'student-intern') {
            // Student / Internship
            if (topProjects.length > 0) {
              projectsParagraph = `Through ${projectsNamePhrase}, along with relevant coursework in computer science, I've gained hands-on experience in ${roleSolutionsType} using ${techsStr}. These projects and academic experiences have strengthened my ${strengthsStr} ${datasetPhrase}.`;
            } else {
              projectsParagraph = `Through my academic coursework and technical certifications, I've built a strong foundation in ${domainsStr} using ${techsStr}, focusing on analytical thinking and problem-solving.`;
            }
          } else if (experienceLevel === 'recent-grad') {
            // Recent Graduate: Prioritize internships (if available), followed by relevant projects and certifications.
            const hasInternship = parsedWorkExperience.some(exp => /intern/i.test(exp));
            const expPrefix = hasInternship ? "my internship experience and" : "academic and personal";
            if (hasData) {
              projectsParagraph = `Through ${expPrefix} projects such as ${projectsNamePhrase}, I've built data analytics pipelines and dashboard solutions using ${techsStr}. These experiences strengthened my analytical thinking, database querying skills, and ability to derive actionable insights from real-world datasets.`;
            } else if (hasFrontend) {
              projectsParagraph = `Through ${expPrefix} projects such as ${projectsNamePhrase}, I've built responsive web applications and interactive interfaces using ${techsStr}. These experiences strengthened my frontend component engineering, modern styling practices, and user experience design skills.`;
            } else {
              projectsParagraph = `Through ${expPrefix} projects such as ${projectsNamePhrase}, I've built backend applications and automation solutions using ${techsStr}. These experiences strengthened my software engineering fundamentals, database integration skills, and ability to develop scalable, real-world applications.`;
            }
          } else if (experienceLevel === 'entry-level') {
            // 0–2 Years Experience: Prioritize professional experience. Include one relevant project only if it strengthens the application.
            const projectPart = topProjects.length > 0 ? `, complemented by personal projects like ${topProjects[0].name}` : '';
            projectsParagraph = `My professional experience includes ${primaryExp}${projectPart}. These hands-on roles have strengthened my expertise in ${roleSolutionsType} and scalable system integrations.`;
          } else {
            // 2+ Years Experience: Focus on professional achievements, business impact, ownership, and measurable results.
            projectsParagraph = `Throughout my professional experience, I have owned the design and implementation of key backend services in ${domainsStr} using ${techsStr}. Collaborating with cross-functional teams, I have delivered high-quality software systems with a focus on ownership and business impact.`;
          }
          
          let whyCompanySentence = '';
          const compLower = ceCompanyClean.toLowerCase();
          if (compLower.includes('gradright')) {
            whyCompanySentence = "GradRight's mission of using data and AI to simplify higher education financing is particularly compelling to me, and I'd be excited to learn from and contribute to your team.";
          } else if (compLower.includes('google')) {
            whyCompanySentence = "Google's mission of organizing the world's information and solving complex engineering challenges is particularly compelling to me, and I'd be excited to learn from and contribute to your team.";
          } else if (compLower.includes('microsoft')) {
            whyCompanySentence = "Microsoft's focus on empowering individuals and organizations through cutting-edge technology is particularly compelling to me, and I'd be excited to learn from and contribute to your team.";
          } else if (compLower.includes('meta') || compLower.includes('facebook')) {
            whyCompanySentence = "Meta's focus on building immersive social and virtual reality platforms is particularly compelling to me, and I'd be excited to learn from and contribute to your team.";
          } else if (compLower.includes('amazon')) {
            whyCompanySentence = "Amazon's leadership in cloud services and e-commerce innovation is particularly compelling to me, and I'd be excited to learn from and contribute to your team.";
          } else {
            whyCompanySentence = `${ceCompanyClean}'s focus on innovation and industry leadership is particularly compelling to me, and I'd be excited to learn from and contribute to your team.`;
          }
          
          const randGreeting = [
            "Hope you're doing well.",
            "Hope you're having a great week.",
            "I hope this email finds you well."
          ][Math.floor(Math.random() * 3)];
          
          const randBrief = [
            "I know you probably receive a lot of emails every day, so I'll keep this brief.",
            "I'll keep this brief.",
            "I recently came across the opening for the position and wanted to reach out.",
            "I was excited to see the opportunity and wanted to introduce myself."
          ][Math.floor(Math.random() * 4)];
          
          const closingBlock = `If you feel my background aligns with your team's needs, I'd appreciate the opportunity to discuss how I can contribute. I've attached my resume for your reference.\n\nThank you for your time and consideration. I'd welcome the opportunity to discuss how my background aligns with your team's needs and how I can contribute to ${ceCompanyClean}.`;
          
          const templateIndex = Math.floor(Math.random() * 4);
          let emailBody = '';
          
          if (templateIndex === 0) {
            // Template A: Greeting -> Intro -> Experience -> Company
            emailBody = `${randGreeting}\n\n${randBrief}\n\n${introParagraph}\n\n${projectsParagraph}\n\n${whyCompanySentence}`;
          } else if (templateIndex === 1) {
            // Template B: Greeting -> Role & Intro -> Why Company -> Projects & Experience
            emailBody = `${randGreeting}\n\n${introParagraph}\n\n${whyCompanySentence}\n\n${projectsParagraph}`;
          } else if (templateIndex === 2) {
            // Template C: Greeting -> Quick Intro -> Strengths & Projects -> Why Company
            emailBody = `${randGreeting}\n\n${introParagraph}\n\n${projectsParagraph}\n\n${whyCompanySentence}`;
          } else {
            // Template D: Greeting -> Role & Intro -> Most Relevant Project -> Skills & Strengths
            emailBody = `${randGreeting}\n\n${randBrief}\n\n${introParagraph}\n\n${projectsParagraph}\n\n${whyCompanySentence}`;
          }
          
          message = `Hi ${ceRecipientFinal},\n\n${emailBody}\n\n${closingBlock}\n\nBest regards,\n\n${ceYourName}${ceContactLines}`;
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

  useEffect(() => {
    if (generatedMessage) {
      generateMessage();
    }
  }, [
    isShorter,
    isMorePersonal,
    isFormal,
    isFriendly,
    isConfident,
    isDetailed,
    mentionCompany,
    mentionRole,
    mentionInterest,
    mentionConnection,
    mentionAchievement
  ]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMessage);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2500);
  };

  const copySubjectToClipboard = () => {
    navigator.clipboard.writeText(generatedSubject);
    setIsSubjectCopied(true);
    setTimeout(() => {
      setIsSubjectCopied(false);
    }, 2500);
  };

  const openGmail = () => {
    const rawEmail = context.recipientEmail || context.recruiterEmail || context.interviewerEmail || context.interviewerEmailFollowup || '';
    const cleanEmail = extractCleanEmail(rawEmail);
    const subject = generatedSubject || `Regarding ${context.jobTitle || 'opportunity'} at ${context.company || 'company'}`;
    const body = generatedMessage;
    
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(cleanEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
  };

  const openLinkedIn = () => {
    const profile = context.linkedInProfile || `https://linkedin.com`;
    window.open(profile, '_blank');
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
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Current Role *</label>
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
              <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Reason for Connecting *</label>
              <textarea
                rows={2}
                placeholder="Why do you want to connect with this person?"
                value={context.reasonForConnecting}
                onChange={e => setContext({ ...context, reasonForConnecting: e.target.value })}
                className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
              />
            </div>
            {mentionConnection && (
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Mutual Connection *</label>
                <input
                  type="text"
                  placeholder="e.g., Jane Doe"
                  value={context.mutualConnection}
                  onChange={e => setContext({ ...context, mutualConnection: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
            )}
            {mentionAchievement && (
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Recent Achievement *</label>
                <textarea
                  rows={2}
                  placeholder="e.g., their recent post about launching their new library"
                  value={context.recentAchievement}
                  onChange={e => setContext({ ...context, recentAchievement: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
            )}
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
                <ResumeSelector
                  value={context.resumeVersion}
                  onChange={val => setContext({ ...context, resumeVersion: val })}
                  resumes={resumes}
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
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Recipient Name</label>
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
                Subject 
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
            <div>
              <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Experience</label>
              <select
                value={context.experienceLevel}
                onChange={e => setContext({ ...context, experienceLevel: e.target.value })}
                className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white focus:outline-none focus:border-violet-500 transition-colors"
              >
                <option value="">Select Experience Level</option>
                <option value="student-intern">Student / Internship</option>
                <option value="recent-grad">Recent Graduate</option>
                <option value="entry-level">0–2 Years Experience</option>
                <option value="experienced">2+ Years Experience</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">Contact Number</label>
                <input
                  type="text"
                  placeholder="e.g., +1 (555) 019-2834"
                  value={context.contactInfo}
                  onChange={e => setContext({ ...context, contactInfo: e.target.value })}
                  className="w-full px-4 py-2 bg-[#131a26] border border-[#232d3f] rounded-lg text-white placeholder-[#6b7280]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-semibold text-[#94a3b8] block mb-2">LinkedIn Profile URL</label>
                <input
                  type="text"
                  placeholder="https://linkedin.com/in/username"
                  value={context.linkedInProfile}
                  onChange={e => setContext({ ...context, linkedInProfile: e.target.value })}
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
              <ResumeSelector
                value={context.resumeVersion}
                onChange={val => setContext({ ...context, resumeVersion: val })}
                resumes={resumes}
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
                <ResumeSelector
                  value={context.resumeVersion}
                  onChange={val => setContext({ ...context, resumeVersion: val })}
                  resumes={resumes}
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
      case 'connection': {
        const fields = [context.contactName, context.company, context.currentRole, context.reasonForConnecting];
        if (mentionConnection) fields.push(context.mutualConnection);
        if (mentionAchievement) fields.push(context.recentAchievement);
        return fields;
      }
      case 'referral':
        return [context.contactName, context.company, context.jobTitle];
      case 'cold-email':
        return [context.recipientEmail, context.company, context.jobTitle, context.yourName];
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
            onChange={(e) => {
              setMessageType(e.target.value);
              setIsShorter(false);
              setIsMorePersonal(false);
              setIsFormal(false);
              setIsFriendly(false);
              setIsConfident(false);
              setIsDetailed(false);
              setMentionCompany(true);
              setMentionRole(true);
              setMentionInterest(true);
              setMentionConnection(false);
              setMentionAchievement(false);
              setShowRewriteDropdown(false);
              setShowPersDropdown(false);
            }}
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
            <label className="text-sm font-semibold text-[#94a3b8] block">Generated Message</label>

            {/* AI Suggestions Panel */}
            <div className="bg-[#131a26] border border-[#232d3f] rounded-xl p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-center">
                <div>
                  <div className="text-[#94a3b8] mb-1">Tone:</div>
                  <div className="text-white font-semibold">{aiSuggestions.tone || 'Professional'}</div>
                </div>
                <div>
                  <div className="text-[#94a3b8] mb-1">Characters:</div>
                  <div className="text-white font-semibold">
                    {generatedMessage.length}{(messageType === 'connection' || messageType === 'referral') ? ' / 200' : ''}
                  </div>
                </div>
                <div>
                  <div className="text-[#94a3b8] mb-1">Personalization:</div>
                  <div className="text-white font-semibold">
                    {isMorePersonal ? 'High' : isShorter ? 'Low' : 'Medium'}
                  </div>
                </div>
                <div>
                  <div className="text-[#94a3b8] mb-1">CTA:</div>
                  <div className="text-white font-semibold">
                    {messageType === 'connection' ? 'Connect' :
                     messageType === 'referral' ? 'Referral' :
                     messageType === 'recruiter' ? 'Outreach' :
                     messageType === 'cold-email' ? 'Email' :
                     messageType === 'followup' ? 'Follow-up' :
                     messageType === 'thankyou' ? 'Thank You' : 'Send'}
                  </div>
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
                    onClick={copySubjectToClipboard}
                    className="px-3 py-2 bg-[#232d3f] hover:bg-[#1f2937] rounded-lg text-xs font-semibold text-white transition-colors min-w-[110px] text-center"
                  >
                    {isSubjectCopied ? 'Copied!' : 'Copy Subject'}
                  </button>
                </div>
              </div>
            )}

            {/* Message with character count */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-[#94a3b8] flex items-center">
                  Message
                </label>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between gap-2 mb-2 w-full">
                {/* Left side modifiers */}
                <div className="flex items-center gap-2">
                  {/* Rewrite Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowRewriteDropdown(!showRewriteDropdown);
                        setShowPersDropdown(false);
                      }}
                      className="px-2.5 py-1 bg-indigo-950/20 border border-indigo-900/50 text-indigo-400 hover:bg-indigo-950/40 hover:border-indigo-800 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <span>✨ Rewrite</span> <span className="text-[10px]">▼</span>
                    </button>
                    {showRewriteDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setShowRewriteDropdown(false)} 
                        />
                        <div className="absolute left-0 mt-1 w-48 bg-[#131a26] border border-[#232d3f] rounded-lg shadow-xl py-1 z-20">
                          <button
                            onClick={() => {
                              setIsFormal(!isFormal);
                              setIsFriendly(false);
                              setIsConfident(false);
                              setShowRewriteDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between ${
                              isFormal ? 'bg-[#1f2937] text-indigo-400 font-semibold' : 'text-[#94a3b8] hover:bg-[#1f2937] hover:text-white'
                            }`}
                          >
                            <span>More Formal</span>
                            {isFormal && <span className="text-indigo-400">✓</span>}
                          </button>
                          <button
                            onClick={() => {
                              setIsFriendly(!isFriendly);
                              setIsFormal(false);
                              setIsConfident(false);
                              setShowRewriteDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between ${
                              isFriendly ? 'bg-[#1f2937] text-indigo-400 font-semibold' : 'text-[#94a3b8] hover:bg-[#1f2937] hover:text-white'
                            }`}
                          >
                            <span>More Friendly</span>
                            {isFriendly && <span className="text-indigo-400">✓</span>}
                          </button>
                          <button
                            onClick={() => {
                              setIsShorter(!isShorter);
                              setIsDetailed(false);
                              setShowRewriteDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between ${
                              isShorter ? 'bg-[#1f2937] text-indigo-400 font-semibold' : 'text-[#94a3b8] hover:bg-[#1f2937] hover:text-white'
                            }`}
                          >
                            <span>More Concise</span>
                            {isShorter && <span className="text-indigo-400">✓</span>}
                          </button>
                          <button
                            onClick={() => {
                              setIsDetailed(!isDetailed);
                              setIsShorter(false);
                              setShowRewriteDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between ${
                              isDetailed ? 'bg-[#1f2937] text-indigo-400 font-semibold' : 'text-[#94a3b8] hover:bg-[#1f2937] hover:text-white'
                            }`}
                          >
                            <span>More Detailed</span>
                            {isDetailed && <span className="text-indigo-400">✓</span>}
                          </button>
                          <button
                            onClick={() => {
                              setIsMorePersonal(!isMorePersonal);
                              setShowRewriteDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between ${
                              isMorePersonal ? 'bg-[#1f2937] text-indigo-400 font-semibold' : 'text-[#94a3b8] hover:bg-[#1f2937] hover:text-white'
                            }`}
                          >
                            <span>More Personal</span>
                            {isMorePersonal && <span className="text-indigo-400">✓</span>}
                          </button>
                          <button
                            onClick={() => {
                              setIsConfident(!isConfident);
                              setIsFormal(false);
                              setIsFriendly(false);
                              setShowRewriteDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between ${
                              isConfident ? 'bg-[#1f2937] text-indigo-400 font-semibold' : 'text-[#94a3b8] hover:bg-[#1f2937] hover:text-white'
                            }`}
                          >
                            <span>More Confident</span>
                            {isConfident && <span className="text-indigo-400">✓</span>}
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Personalization Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowPersDropdown(!showPersDropdown);
                        setShowRewriteDropdown(false);
                      }}
                      className="px-2.5 py-1 bg-indigo-950/20 border border-indigo-900/50 text-indigo-400 hover:bg-indigo-950/40 hover:border-indigo-800 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <span>⚙️ Personalization</span> <span className="text-[10px]">▼</span>
                    </button>
                    {showPersDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setShowPersDropdown(false)} 
                        />
                        <div className="absolute left-0 mt-1 w-56 bg-[#131a26] border border-[#232d3f] rounded-lg shadow-xl py-1 z-20">
                          <button
                            onClick={() => {
                              setMentionCompany(!mentionCompany);
                              setShowPersDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between ${
                              mentionCompany ? 'text-[#94a3b8] hover:bg-[#1f2937] hover:text-white font-semibold' : 'text-[#6b7280]'
                            }`}
                          >
                            <span>Mention Company</span>
                            {mentionCompany && <span className="text-emerald-400">✓</span>}
                          </button>
                          <button
                            onClick={() => {
                              setMentionRole(!mentionRole);
                              setShowPersDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between ${
                              mentionRole ? 'text-[#94a3b8] hover:bg-[#1f2937] hover:text-white font-semibold' : 'text-[#6b7280]'
                            }`}
                          >
                            <span>Mention Role</span>
                            {mentionRole && <span className="text-emerald-400">✓</span>}
                          </button>
                          <button
                            onClick={() => {
                              setMentionInterest(!mentionInterest);
                              setShowPersDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between ${
                              mentionInterest ? 'text-[#94a3b8] hover:bg-[#1f2937] hover:text-white font-semibold' : 'text-[#6b7280]'
                            }`}
                          >
                            <span>Mention Shared Interest</span>
                            {mentionInterest && <span className="text-emerald-400">✓</span>}
                          </button>
                          <button
                            onClick={() => {
                              setMentionConnection(!mentionConnection);
                              setShowPersDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between ${
                              mentionConnection ? 'text-[#94a3b8] hover:bg-[#1f2937] hover:text-white font-semibold' : 'text-[#6b7280]'
                            }`}
                          >
                            <span>Mention Mutual Connection</span>
                            {mentionConnection && <span className="text-emerald-400">✓</span>}
                          </button>
                          <button
                            onClick={() => {
                              setMentionAchievement(!mentionAchievement);
                              setShowPersDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between ${
                              mentionAchievement ? 'text-[#94a3b8] hover:bg-[#1f2937] hover:text-white font-semibold' : 'text-[#6b7280]'
                            }`}
                          >
                            <span>Mention Recent Achievement</span>
                            {mentionAchievement && <span className="text-emerald-400">✓</span>}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Right side Copy & Clear */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="px-2.5 py-1 bg-emerald-950/20 border border-emerald-900/50 text-emerald-400 hover:bg-emerald-950/40 hover:border-emerald-800 rounded-lg text-xs font-semibold transition-all min-w-[65px] text-center"
                  >
                    {isCopied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => setGeneratedMessage('')}
                    className="px-2.5 py-1 bg-red-950/20 border border-red-900/50 text-red-400 hover:bg-red-950/40 hover:border-red-800 rounded-lg text-xs font-semibold transition-all"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <textarea
                value={generatedMessage}
                onChange={(e) => setGeneratedMessage(e.target.value)}
                rows={8}
                className="w-full px-4 py-2 bg-[#1b2535] border border-[#232d3f] rounded-lg text-white"
                maxLength={(messageType === 'connection' || messageType === 'referral') ? 180 : undefined}
              />
            </div>

            {/* Type-specific action buttons */}
            <div className="flex flex-wrap gap-2">

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
