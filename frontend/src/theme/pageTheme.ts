export interface PageThemeConfig {
  key: string;
  name: string;
  headingColorClass: string;
}

export const PAGE_THEMES: Record<string, PageThemeConfig> = {
  dashboard: {
    key: 'dashboard',
    name: 'Dashboard',
    headingColorClass: 'text-[#38bdf8]', // Sky Blue
  },
  explorer: {
    key: 'explorer',
    name: 'Job Explorer',
    headingColorClass: 'text-[#6366f1]', // Indigo
  },
  atsExplorer: {
    key: 'atsExplorer',
    name: 'Supported ATS & Portal Explorer',
    headingColorClass: 'text-[#06b6d4]', // Cyan
  },
  kanban: {
    key: 'kanban',
    name: 'Application Kanban CRM',
    headingColorClass: 'text-[#a855f7]', // Purple
  },
  resumeManager: {
    key: 'resumeManager',
    name: 'Resume Manager',
    headingColorClass: 'text-[#06b6d4]', // Electric Cyan
  },
  heatmap: {
    key: 'heatmap',
    name: 'ATS Keyword Match Heatmap',
    headingColorClass: 'text-[#10b981]', // Emerald Green
  },
  coverLetter: {
    key: 'coverLetter',
    name: 'Cover Letter Builder',
    headingColorClass: 'text-[#f43f5e]', // Rose Pink
  },
  profileBuilder: {
    key: 'profileBuilder',
    name: 'Portfolio Exporter',
    headingColorClass: 'text-[#14b8a6]', // Teal
  },
  automationMonitoring: {
    key: 'automationMonitoring',
    name: 'Monitoring Hub',
    headingColorClass: 'text-[#f59e0b]', // Warm Amber
  },
  automationEmail: {
    key: 'automationEmail',
    name: 'Email Alerts',
    headingColorClass: 'text-[#3b82f6]', // Sapphire Blue
  },
  automationCalendar: {
    key: 'automationCalendar',
    name: 'Calendar',
    headingColorClass: 'text-[#d946ef]', // Fuchsia
  },
  careerCopilot: {
    key: 'careerCopilot',
    name: 'Career Copilot',
    headingColorClass: 'text-[#818cf8]', // Bright Indigo
  },
  careerAssistant: {
    key: 'careerAssistant',
    name: 'AI Career Assistant',
    headingColorClass: 'text-[#22d3ee]', // Sky Cyan
  },
  githubAnalyzer: {
    key: 'githubAnalyzer',
    name: 'GitHub Profile Analyzer',
    headingColorClass: 'text-[#84cc16]', // Lime Green
  },
  offerComparison: {
    key: 'offerComparison',
    name: 'Offer Negotiator & Matrix',
    headingColorClass: 'text-[#22c55e]', // Spring Green
  },
  cheatsheets: {
    key: 'cheatsheets',
    name: 'Interview Preparation Hub',
    headingColorClass: 'text-[#818cf8]', // Indigo Purple
  },
  flashcards: {
    key: 'flashcards',
    name: 'AI Study Flashcards',
    headingColorClass: 'text-[#c084fc]', // Violet Purple
  },
  flashcardAchievements: {
    key: 'flashcardAchievements',
    name: 'Topic Mastery & Achievements',
    headingColorClass: 'text-[#eab308]', // Gold Star
  },
  referrals: {
    key: 'referrals',
    name: 'Recruiter CRM & Follow-Ups',
    headingColorClass: 'text-[#2dd4bf]', // Bright Teal
  },
  analytics: {
    key: 'analytics',
    name: 'Career Analytics & Conversion Metrics',
    headingColorClass: 'text-[#ec4899]', // Hot Pink
  },
  exportCenter: {
    key: 'exportCenter',
    name: 'Export & Report Center',
    headingColorClass: 'text-[#a78bfa]', // Lavender
  },
  settings: {
    key: 'settings',
    name: 'Settings',
    headingColorClass: 'text-[#94a3b8]', // Slate Gray
  },
  admin: {
    key: 'admin',
    name: 'Admin Console',
    headingColorClass: 'text-[#ef4444]', // Ruby Red
  },
};

export const getPageTheme = (key: string): PageThemeConfig => {
  return (
    PAGE_THEMES[key] || {
      key: 'default',
      name: 'Page',
      headingColorClass: 'text-indigo-400',
    }
  );
};
