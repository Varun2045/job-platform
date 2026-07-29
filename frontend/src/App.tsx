// deploy latest date parsing fixes
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components/Sidebar.js';
import { Login } from './features/auth/Login.js';
import { Dashboard } from './features/dashboard/Dashboard.js';
import { JobExplorer } from './features/explorer/JobExplorer.js';
import { KanbanTracker } from './features/tracker/KanbanTracker.js';
import { ResumeManager } from './features/resumes/ResumeManager.js';
import { Settings } from './features/settings/Settings.js';
import { AdminPanel } from './features/admin/AdminPanel.js';
import { ResumeBuilder } from './features/resumes/resume-builder/ResumeBuilder.js';
import { AutomationHub } from './features/automation/AutomationHub.js';
import { Referrals } from './features/referrals/Referrals.js';
import { AICareerAssistant } from './features/career-assistant/AICareerAssistant.js';
import { CoverLetterBuilder } from './features/cover-letter-builder/CoverLetterBuilder.js';
import { CopilotDashboard } from './features/_experimental/CopilotDashboard.js';
import { OfferComparison } from './features/offer-comparison/OfferComparison.js';
import { GithubAnalyzer } from './features/github-analyzer/GithubAnalyzer.js';
import { FlashcardDashboard } from './features/flashcards/FlashcardDashboard.js';
import { FlashcardAchievements } from './features/flashcards/FlashcardAchievements.js';
import { CheatsheetDashboard } from './features/flashcards/CheatsheetDashboard.js';
import { ProfileBuilder } from './features/profile-builder/ProfileBuilder.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { Menu } from 'lucide-react';
import { AtsHeatmapView } from './features/resumes/AtsHeatmapView.js';
import { NotificationSettingsView } from './features/settings/NotificationSettingsView.js';
import { AnalyticsDashboardView } from './features/analytics/AnalyticsDashboardView.js';
import { ExportCenterView } from './features/export/ExportCenterView.js';
import { AtsExplorerView } from './features/ats/AtsExplorerView.js';

import { ToastProvider } from './context/ToastContext.js';

const queryClient = new QueryClient();

// Override window.fetch at the module level to ensure it is active immediately on mount
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const jwt = localStorage.getItem('token');
  const authHeader = jwt ? { Authorization: `Bearer ${jwt}` } : {};
  const updatedInit = {
    ...init,
    headers: {
      ...(init?.headers || {}),
      ...authHeader
    }
  } as RequestInit;
  return originalFetch(input, updatedInit);
};

export const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [, setEmail] = useState<string | null>(localStorage.getItem('email'));

  const handleLogin = (jwt: string, userEmail: string) => {
    setToken(jwt);
    setEmail(userEmail);
    localStorage.setItem('token', jwt);
    localStorage.setItem('email', userEmail);
  };

  const handleLogout = () => {
    setToken(null);
    setEmail(null);
    localStorage.removeItem('token');
    localStorage.removeItem('email');
  };

  useEffect(() => {
    // Parse Supabase OAuth Hash Params: #access_token=...
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.substring(1)); // remove '#'
      const jwt = params.get('access_token');
      if (jwt) {
        handleLogin(jwt, 'oauth-user@jobmonitor.com');
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!token) {
    return (
      <ToastProvider>
        <Login onLogin={handleLogin} />
      </ToastProvider>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <Router>
            <div className="flex flex-col md:flex-row bg-[#0b0f19] h-screen text-white overflow-hidden">
              {/* Mobile Header Bar */}
              <div className="md:hidden h-14 bg-[#131a26] border-b border-[#232d3f] px-4 flex items-center justify-between shrink-0 z-30">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-[#1b2535] rounded-xl text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
                  aria-label="Open Sidebar Menu"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <span className="font-bold text-[#e2e8f0] text-sm flex items-center gap-2">
                  JobSearch OS
                </span>
              </div>

              {/* Sidebar */}
              <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
              />

              {/* Main Workspace Area */}
              <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#0b0f19] text-white">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/explorer" element={<JobExplorer />} />
                  <Route path="/tracker" element={<KanbanTracker />} />
                  <Route path="/resumes" element={<ResumeManager />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="/resume-builder" element={<ResumeBuilder />} />
                  <Route path="/automation" element={<AutomationHub tab="monitoring" />} />
                  <Route path="/automation/monitoring" element={<AutomationHub tab="monitoring" />} />
                  <Route path="/automation/email" element={<AutomationHub tab="email" />} />
                  <Route path="/automation/calendar" element={<AutomationHub tab="calendar" />} />
                  <Route path="/automation/*" element={<AutomationHub tab="monitoring" />} />
                  <Route path="/companies" element={<AutomationHub tab="monitoring" />} />
                  <Route path="/referrals" element={<Referrals />} />
                  <Route path="/crm" element={<Referrals />} />
                  <Route path="/copilot" element={<CopilotDashboard />} />
                  <Route path="/career-copilot" element={<CopilotDashboard />} />
                  <Route path="/career-assistant" element={<AICareerAssistant />} />
                  <Route path="/cover-letter" element={<CoverLetterBuilder />} />
                  <Route path="/cover-letter-builder" element={<CoverLetterBuilder />} />
                  <Route path="/offers" element={<OfferComparison />} />
                  <Route path="/offer-comparison" element={<OfferComparison />} />
                  <Route path="/offer-negotiation" element={<OfferComparison />} />
                  <Route path="/offer-negotiator" element={<OfferComparison />} />
                  <Route path="/github" element={<GithubAnalyzer />} />
                  <Route path="/github-analyzer" element={<GithubAnalyzer />} />
                  <Route path="/flashcards" element={<FlashcardDashboard />} />
                  <Route path="/flashcard-achievements" element={<FlashcardAchievements />} />
                  <Route path="/cheatsheets" element={<CheatsheetDashboard />} />
                  <Route path="/ats-heatmap" element={<AtsHeatmapView />} />
                  <Route path="/notification-settings" element={<NotificationSettingsView />} />
                  <Route path="/analytics" element={<AnalyticsDashboardView />} />
                  <Route path="/export-center" element={<ExportCenterView />} />
                  <Route path="/ats-explorer" element={<AtsExplorerView />} />
                  <Route path="/profile-builder" element={<ProfileBuilder />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </Router>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
