export interface PageThemeConfig {
  key: string;
  name: string;
  headingColorClass: string;
}

export const PAGE_THEMES: Record<string, PageThemeConfig> = {
  dashboard: {
    key: 'dashboard',
    name: 'Dashboard',
    headingColorClass: 'text-[#38bdf8]', // Vibrant Blue
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
  heatmap: {
    key: 'heatmap',
    name: 'ATS Keyword Match Heatmap',
    headingColorClass: 'text-[#10b981]', // Emerald (Match screenshot)
  },
  coverLetter: {
    key: 'coverLetter',
    name: 'Cover Letter Builder',
    headingColorClass: 'text-[#f43f5e]', // Rose
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
    headingColorClass: 'text-[#f97316]', // Deep Orange
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
  admin: {
    key: 'admin',
    name: 'Admin Console',
    headingColorClass: 'text-[#ef4444]', // Ruby Red
  },
  explorer: {
    key: 'explorer',
    name: 'Job Explorer',
    headingColorClass: 'text-[#6366f1]', // Indigo
  },
  resumeManager: {
    key: 'resumeManager',
    name: 'Resume Manager',
    headingColorClass: 'text-[#f97316]', // Warm Coral
  },
  settings: {
    key: 'settings',
    name: 'Settings',
    headingColorClass: 'text-[#94a3b8]', // Slate
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
