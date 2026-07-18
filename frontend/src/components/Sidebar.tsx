import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, Building2, Hammer, ClipboardList, FileText, Mail, Globe, Brain, Bot, Code, DollarSign, Handshake, Settings, Shield, LogOut, Bell, Check, ChevronLeft, ChevronRight, X, Calendar, Activity, Trophy } from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout, isOpen = false, onClose }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>({ name: 'Loading...', role: 'User' });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Load collapsed state from localStorage
    const savedCollapsed = localStorage.getItem('sidebar-collapsed');
    if (savedCollapsed === 'true') {
      setIsCollapsed(true);
    }

    fetch('/api/profile')
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(() => {});

    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => setNotifications(data))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const clearAll = async () => {
    await fetch('/api/notifications', { method: 'DELETE' });
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const navSections = [
    {
      items: [
        { name: 'Dashboard', path: '/', icon: Home }
      ]
    },
    {
      category: 'Job Search',
      items: [
        { name: 'Job Explorer', path: '/explorer', icon: Search },
        { name: 'Company Monitor', path: '/companies', icon: Building2 },
        { name: 'Scraper Builder', path: '/scraper-builder', icon: Hammer }
      ]
    },
    {
      category: 'Applications',
      items: [
        { name: 'Applications', path: '/tracker', icon: ClipboardList },
        { name: 'Resume Manager', path: '/resumes', icon: FileText },
        { name: 'Cover Letter Builder', path: '/cover-letter-builder', icon: Mail },
        { name: 'Portfolio Exporter', path: '/profile-builder', icon: Globe }
      ]
    },
    {
      category: 'Automation',
      items: [
        { name: 'Monitoring Hub', path: '/automation/monitoring', icon: Activity },
        { name: 'Email Alerts', path: '/automation/email', icon: Mail },
        { name: 'Calendar', path: '/automation/calendar', icon: Calendar }
      ]
    },
    {
      category: 'AI Tools',
      items: [
        { name: 'Career Copilot', path: '/career-copilot', icon: Brain },
        { name: 'AI Career Assistant', path: '/career-assistant', icon: Bot },
        { name: 'GitHub Analyzer', path: '/github-analyzer', icon: Code },
        { name: 'Offer Negotiator', path: '/offer-comparison', icon: DollarSign }
      ]
    },
    {
      category: 'Interview Prep',
      items: [
        { name: 'Prep Hub', path: '/cheatsheets', icon: FileText },
        { name: 'Flashcards', path: '/flashcards', icon: Brain },
        { name: 'Topic Mastery', path: '/flashcard-achievements', icon: Trophy }
      ]
    },
    {
      category: 'Networking',
      items: [
        { name: 'Referrals', path: '/referrals', icon: Handshake }
      ]
    },
    {
      category: 'Administration',
      items: [
        { name: 'Settings', path: '/settings', icon: Settings },
        { name: 'Admin Console', path: '/admin', icon: Shield }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar Wrapper */}
      <div
        style={{
          width: isCollapsed ? '80px' : 'clamp(240px, 18vw, 280px)',
        }}
        className={`fixed md:sticky top-0 left-0 h-screen bg-[#0b0f19] border-r border-[#232d3f] flex flex-col justify-between p-4 z-50 transition-all duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Unified Scrollable Container */}
        <div className="flex-1 flex flex-col gap-6 min-h-0 overflow-y-auto pr-1">
          {/* Logo / Header */}
          <div className={`flex items-center justify-between px-2 shrink-0 ${isCollapsed ? 'flex-col gap-3' : ''}`}>
            {!isCollapsed ? (
              <span className="text-sm font-black text-white tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                JOB MONITOR
              </span>
            ) : null}

            <div className={`flex items-center gap-2 ${isCollapsed ? 'flex-col' : ''}`}>
              {/* Collapse Toggle */}
              <button
                onClick={() => {
                  const nextState = !isCollapsed;
                  setIsCollapsed(nextState);
                  localStorage.setItem('sidebar-collapsed', String(nextState));
                }}
                className="p-1.5 hover:bg-[#1b2535] border border-[#232d3f] hover:border-indigo-600 text-[#94a3b8] hover:text-white rounded-xl transition cursor-pointer hidden md:block"
                title={isCollapsed ? "Expand" : "Collapse"}
              >
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
              </button>

              {/* Bell Icon Trigger */}
              <div className="relative">
                <button
                  onClick={() => setShowNotif(!showNotif)}
                  className="p-1.5 hover:bg-[#1b2535] border border-[#232d3f] hover:border-indigo-600 text-[#94a3b8] hover:text-white rounded-xl transition cursor-pointer relative flex items-center justify-center"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
                  )}
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                  )}
                </button>

                {/* Notifications dropdown menu */}
                {showNotif && (
                  <div className={`absolute top-11 bg-[#131a26] border border-[#232d3f] rounded-xl p-3 shadow-2xl z-50 space-y-2.5 w-64 ${
                    isCollapsed ? 'left-1/2 -translate-x-1/2' : 'right-0'
                  }`}>
                    <div className="flex justify-between items-center text-[10px] font-bold text-[#94a3b8] pb-1 border-b border-[#232d3f]">
                      <span>ALERTS ({notifications.length})</span>
                      {notifications.length > 0 && (
                        <button onClick={clearAll} className="hover:text-red-400 cursor-pointer transition">CLEAR ALL</button>
                      )}
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {notifications.length === 0 ? (
                        <p className="text-[10px] text-gray-500 italic py-3 text-center">No active notifications</p>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="p-2 bg-[#1b2535] rounded-lg border border-[#232d3f] flex items-start gap-2 justify-between">
                            <p className={`text-[10px] leading-relaxed flex-1 ${n.is_read ? 'text-gray-500' : 'text-[#94a3b8] font-bold'}`}>
                              {n.message}
                            </p>
                            {!n.is_read && (
                              <button onClick={() => markAsRead(n.id)} className="p-0.5 hover:bg-[#232d3f] rounded text-emerald-400 cursor-pointer">
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Close Button */}
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-[#1b2535] border border-[#232d3f] text-[#94a3b8] rounded-xl transition cursor-pointer md:hidden"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation Section */}
          <nav className="flex flex-col gap-5">
            {navSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                {section.category && !isCollapsed && (
                  <div className="px-2 py-1 text-[9px] font-black uppercase text-[#475569] tracking-widest select-none flex items-center gap-2">
                    <span>{section.category}</span>
                    <div className="flex-1 border-t border-[#232d3f] opacity-20"></div>
                  </div>
                )}
                {section.category && isCollapsed && (
                  <div className="border-t border-[#232d3f] my-1 opacity-20"></div>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      onClick={() => onClose?.()}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                          isActive
                            ? 'bg-indigo-600/10 border-l-4 border-indigo-600 text-indigo-400 font-extrabold'
                            : 'text-[#94a3b8] hover:bg-[#1b2535] hover:text-white'
                        } ${isCollapsed ? 'justify-center' : ''}`
                      }
                      title={isCollapsed ? item.name : undefined}
                    >
                      <item.icon className="w-4.5 h-4.5 shrink-0" />
                      {!isCollapsed && <span>{item.name}</span>}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Profile Footer - Sticks to bottom */}
        <div className="space-y-4 border-t border-[#232d3f] pt-4 shrink-0 mt-4">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 px-3 py-2 bg-[#1b2535] rounded-xl border border-[#232d3f]">
              {profile.photo_url ? (
                <img src={profile.photo_url} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-[#232d3f]" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
                  {profile.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{profile.name}</p>
                <span className="text-[9px] bg-indigo-600/15 border border-indigo-500/25 text-indigo-400 font-bold px-1.5 py-0.5 rounded-full block w-fit mt-0.5">
                  {profile.role || 'User'}
                </span>
              </div>
            </div>
          ) : (
            profile.photo_url ? (
              <img src={profile.photo_url} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-[#232d3f] mx-auto" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs mx-auto">
                {profile.name?.charAt(0).toUpperCase()}
              </div>
            )
          )}

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-colors duration-200 cursor-pointer ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
};
