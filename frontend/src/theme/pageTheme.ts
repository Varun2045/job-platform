export interface PageThemeConfig {
  key: string;
  name: string;
  headingColorClass: string;
  iconColorClass: string;
  accentBgClass: string;
  accentBorderClass: string;
}

export const PAGE_THEMES: Record<string, PageThemeConfig> = {
  dashboard: {
    key: 'dashboard',
    name: 'Dashboard',
    headingColorClass: 'text-[#38bdf8]', // Sky Blue
    iconColorClass: 'text-[#38bdf8]',
    accentBgClass: 'bg-[#38bdf8]/10',
    accentBorderClass: 'border-[#38bdf8]/20',
  },
  explorer: {
    key: 'explorer',
    name: 'Job Explorer',
    headingColorClass: 'text-[#6366f1]', // Indigo
    iconColorClass: 'text-[#6366f1]',
    accentBgClass: 'bg-[#6366f1]/10',
    accentBorderClass: 'border-[#6366f1]/20',
  },
  atsExplorer: {
    key: 'atsExplorer',
    name: 'Parser & ATS Explorer',
    headingColorClass: 'text-[#06b6d4]', // Cyan
    iconColorClass: 'text-[#06b6d4]',
    accentBgClass: 'bg-[#06b6d4]/10',
    accentBorderClass: 'border-[#06b6d4]/20',
  },
  kanban: {
    key: 'kanban',
    name: 'Application Kanban CRM',
    headingColorClass: 'text-[#a855f7]', // Violet Purple
    iconColorClass: 'text-[#a855f7]',
    accentBgClass: 'bg-[#a855f7]/10',
    accentBorderClass: 'border-[#a855f7]/20',
  },
  resumeManager: {
    key: 'resumeManager',
    name: 'Resume Manager',
    headingColorClass: 'text-[#f97316]', // Warm Sunset Coral / Orange (Replaced harsh yellow)
    iconColorClass: 'text-[#f97316]',
    accentBgClass: 'bg-[#f97316]/10',
    accentBorderClass: 'border-[#f97316]/20',
  },
  heatmap: {
    key: 'heatmap',
    name: 'ATS Keyword Heatmap',
    headingColorClass: 'text-[#10b981]', // Emerald Green
    iconColorClass: 'text-[#10b981]',
    accentBgClass: 'bg-[#10b981]/10',
    accentBorderClass: 'border-[#10b981]/20',
  },
  coverLetter: {
    key: 'coverLetter',
    name: 'Cover Letter Builder',
    headingColorClass: 'text-[#f43f5e]', // Rose Pink
    iconColorClass: 'text-[#f43f5e]',
    accentBgClass: 'bg-[#f43f5e]/10',
    accentBorderClass: 'border-[#f43f5e]/20',
  },
  profileBuilder: {
    key: 'profileBuilder',
    name: 'Portfolio Exporter',
    headingColorClass: 'text-[#14b8a6]', // Teal
    iconColorClass: 'text-[#14b8a6]',
    accentBgClass: 'bg-[#14b8a6]/10',
    accentBorderClass: 'border-[#14b8a6]/20',
  },
  automationMonitoring: {
    key: 'automationMonitoring',
    name: 'Monitoring Hub',
    headingColorClass: 'text-[#eab308]', // Warm Amber
    iconColorClass: 'text-[#eab308]',
    accentBgClass: 'bg-[#eab308]/10',
    accentBorderClass: 'border-[#eab308]/20',
  },
  automationEmail: {
    key: 'automationEmail',
    name: 'Email Alerts',
    headingColorClass: 'text-[#3b82f6]', // Sapphire Blue
    iconColorClass: 'text-[#3b82f6]',
    accentBgClass: 'bg-[#3b82f6]/10',
    accentBorderClass: 'border-[#3b82f6]/20',
  },
  automationCalendar: {
    key: 'automationCalendar',
    name: 'Calendar Sync',
    headingColorClass: 'text-[#d946ef]', // Fuchsia
    iconColorClass: 'text-[#d946ef]',
    accentBgClass: 'bg-[#d946ef]/10',
    accentBorderClass: 'border-[#d946ef]/20',
  },
  careerCopilot: {
    key: 'careerCopilot',
    name: 'Career Copilot',
    headingColorClass: 'text-[#818cf8]', // Bright Indigo
    iconColorClass: 'text-[#818cf8]',
    accentBgClass: 'bg-[#818cf8]/10',
    accentBorderClass: 'border-[#818cf8]/20',
  },
  careerAssistant: {
    key: 'careerAssistant',
    name: 'AI Career Assistant',
    headingColorClass: 'text-[#22d3ee]', // Bright Cyan
    iconColorClass: 'text-[#22d3ee]',
    accentBgClass: 'bg-[#22d3ee]/10',
    accentBorderClass: 'border-[#22d3ee]/20',
  },
  githubAnalyzer: {
    key: 'githubAnalyzer',
    name: 'GitHub Analyzer',
    headingColorClass: 'text-[#84cc16]', // Lime Green
    iconColorClass: 'text-[#84cc16]',
    accentBgClass: 'bg-[#84cc16]/10',
    accentBorderClass: 'border-[#84cc16]/20',
  },
  offerComparison: {
    key: 'offerComparison',
    name: 'Offer Negotiator',
    headingColorClass: 'text-[#22c55e]', // Mint Green
    iconColorClass: 'text-[#22c55e]',
    accentBgClass: 'bg-[#22c55e]/10',
    accentBorderClass: 'border-[#22c55e]/20',
  },
  cheatsheets: {
    key: 'cheatsheets',
    name: 'Interview Prep Hub',
    headingColorClass: 'text-[#fb923c]', // Sunset Orange
    iconColorClass: 'text-[#fb923c]',
    accentBgClass: 'bg-[#fb923c]/10',
    accentBorderClass: 'border-[#fb923c]/20',
  },
  flashcards: {
    key: 'flashcards',
    name: 'Flashcards',
    headingColorClass: 'text-[#c084fc]', // Light Purple
    iconColorClass: 'text-[#c084fc]',
    accentBgClass: 'bg-[#c084fc]/10',
    accentBorderClass: 'border-[#c084fc]/20',
  },
  flashcardAchievements: {
    key: 'flashcardAchievements',
    name: 'Topic Mastery',
    headingColorClass: 'text-[#facc15]', // Yellow Gold
    iconColorClass: 'text-[#facc15]',
    accentBgClass: 'bg-[#facc15]/10',
    accentBorderClass: 'border-[#facc15]/20',
  },
  recruiterCrm: {
    key: 'recruiterCrm',
    name: 'Recruiter CRM',
    headingColorClass: 'text-[#0ea5e9]', // Sky Blue
    iconColorClass: 'text-[#0ea5e9]',
    accentBgClass: 'bg-[#0ea5e9]/10',
    accentBorderClass: 'border-[#0ea5e9]/20',
  },
  referrals: {
    key: 'referrals',
    name: 'Referrals',
    headingColorClass: 'text-[#2dd4bf]', // Turquoise
    iconColorClass: 'text-[#2dd4bf]',
    accentBgClass: 'bg-[#2dd4bf]/10',
    accentBorderClass: 'border-[#2dd4bf]/20',
  },
  analytics: {
    key: 'analytics',
    name: 'Analytics',
    headingColorClass: 'text-[#ec4899]', // Hot Pink
    iconColorClass: 'text-[#ec4899]',
    accentBgClass: 'bg-[#ec4899]/10',
    accentBorderClass: 'border-[#ec4899]/20',
  },
  exportCenter: {
    key: 'exportCenter',
    name: 'Export Center',
    headingColorClass: 'text-[#a78bfa]', // Light Violet
    iconColorClass: 'text-[#a78bfa]',
    accentBgClass: 'bg-[#a78bfa]/10',
    accentBorderClass: 'border-[#a78bfa]/20',
  },
  settings: {
    key: 'settings',
    name: 'Settings',
    headingColorClass: 'text-[#94a3b8]', // Slate Gray
    iconColorClass: 'text-[#94a3b8]',
    accentBgClass: 'bg-[#94a3b8]/10',
    accentBorderClass: 'border-[#94a3b8]/20',
  },
  admin: {
    key: 'admin',
    name: 'Admin Console',
    headingColorClass: 'text-[#ef4444]', // Crimson Red
    iconColorClass: 'text-[#ef4444]',
    accentBgClass: 'bg-[#ef4444]/10',
    accentBorderClass: 'border-[#ef4444]/20',
  },
};

export const getPageTheme = (key: string): PageThemeConfig => {
  return (
    PAGE_THEMES[key] || {
      key: 'default',
      name: 'Page',
      headingColorClass: 'text-indigo-400',
      iconColorClass: 'text-indigo-400',
      accentBgClass: 'bg-indigo-500/10',
      accentBorderClass: 'border-indigo-500/20',
    }
  );
};
