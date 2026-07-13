import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Search, ClipboardList, Handshake, Cpu, FileText, Building2, Settings, LogOut, Shield, Bell, Check, MessageSquare, ChevronLeft, ChevronRight, X } from 'lucide-react';

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
    if (savedCollapsed !== null) {
      setIsCollapsed(JSON.parse(savedCollapsed));
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

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
  };

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

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Job Explorer', path: '/explorer', icon: Search },
    { name: 'Applications', path: '/tracker', icon: ClipboardList },
    { name: 'Referrals', path: '/referrals', icon: Handshake },
    { name: 'Automation Hub', path: '/automation', icon: Cpu },
    { name: 'Resume Manager', path: '/resumes', icon: FileText },
    { name: 'Cover Letter Builder', path: '/cover-letter-builder', icon: MessageSquare },
    { name: 'AI Career Assistant', path: '/career-assistant', icon: MessageSquare },
    { name: 'Company Monitor', path: '/companies', icon: Building2 },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Admin Console', path: '/admin', icon: Shield },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-[1px] z-40 md:hidden cursor-pointer"
        />
      )}

      <div 
        className={`bg-[#131a26] border-r border-[#232d3f] h-full flex flex-col justify-between p-4 shrink-0 transition-all duration-250 ease-in-out z-50
          fixed md:relative top-0 bottom-0 left-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'w-[70px]' : 'w-[260px]'}
        `}
      >
        <div className="flex flex-col flex-1 min-h-0 space-y-4">
          <div className={`px-4 py-2 flex justify-between items-center ${isCollapsed ? 'justify-center' : ''}`}>
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                  Job Monitor
                </h1>
                <p className="text-[10px] text-[#94a3b8] font-medium tracking-wider uppercase mt-0.5">
                  v3.0 Enterprise
                </p>
              </div>
            )}

            <button
              onClick={toggleCollapse}
              className="hidden md:block p-2 hover:bg-[#1b2535] rounded-xl text-[#94a3b8] hover:text-white transition duration-200 cursor-pointer shrink-0"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden p-2 hover:bg-[#1b2535] rounded-xl text-[#94a3b8] hover:text-white transition duration-200 cursor-pointer shrink-0"
                title="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}

          {!isCollapsed && (
            <div className="relative">
              <button
                onClick={() => setShowNotif(!showNotif)}
                className="p-2 hover:bg-[#1b2535] rounded-xl text-[#94a3b8] hover:text-white transition duration-200 cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-indigo-600 text-white rounded-full text-[9px] font-black flex items-center justify-center border-2 border-[#131a26]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className="absolute left-0 mt-2 w-80 bg-[#131a26] border border-[#232d3f] rounded-2xl p-4 shadow-2xl z-50 space-y-3">
                  <div className="flex justify-between items-center border-b border-[#232d3f] pb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">User Notifications</span>
                    {notifications.length > 0 && (
                      <button onClick={clearAll} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer">
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-[10px] text-[#6b7280] text-center py-4">No unread notifications.</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-xl border border-[#232d3f] text-left transition duration-200 ${
                            n.is_read ? 'bg-transparent opacity-65' : 'bg-[#1b2535]'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-1">
                            <span className="text-[10px] font-bold text-white block">{n.title}</span>
                            {!n.is_read && (
                              <button
                                onClick={() => markAsRead(n.id)}
                                className="text-indigo-400 hover:text-indigo-300 p-0.5 rounded-full cursor-pointer shrink-0"
                                title="Mark as read"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-[9px] text-[#94a3b8] mt-1">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto flex flex-col gap-0.5 pr-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => onClose?.()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600/10 border-l-4 border-indigo-600 text-indigo-400'
                    : 'text-[#94a3b8] hover:bg-[#1b2535] hover:text-white'
                } ${isCollapsed ? 'justify-center' : ''}`
              }
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>{item.name}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="space-y-4 border-t border-[#232d3f] pt-4">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 px-4 py-2 bg-[#1b2535] rounded-xl border border-[#232d3f]">
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
          className={`flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-semibold transition-colors duration-200 cursor-pointer ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  </>
);
};
