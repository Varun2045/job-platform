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
    headingColorClass: 'text-[#38bdf8]', // Blue
    iconColorClass: 'text-[#38bdf8]',
    accentBgClass: 'bg-[#38bdf8]/10',
    accentBorderClass: 'border-[#38bdf8]/20',
  },
  kanban: {
    key: 'kanban',
    name: 'Application Kanban CRM',
    headingColorClass: 'text-[#a855f7]', // Purple
    iconColorClass: 'text-[#a855f7]',
    accentBgClass: 'bg-[#a855f7]/10',
    accentBorderClass: 'border-[#a855f7]/20',
  },
  heatmap: {
    key: 'heatmap',
    name: 'ATS Keyword Heatmap',
    headingColorClass: 'text-[#10b981]', // Emerald
    iconColorClass: 'text-[#10b981]',
    accentBgClass: 'bg-[#10b981]/10',
    accentBorderClass: 'border-[#10b981]/20',
  },
  recruiterCrm: {
    key: 'recruiterCrm',
    name: 'Recruiter CRM & Referrals',
    headingColorClass: 'text-[#0ea5e9]', // Sky Blue
    iconColorClass: 'text-[#0ea5e9]',
    accentBgClass: 'bg-[#0ea5e9]/10',
    accentBorderClass: 'border-[#0ea5e9]/20',
  },
  resumeManager: {
    key: 'resumeManager',
    name: 'Resume Manager',
    headingColorClass: 'text-[#f59e0b]', // Amber / Orange
    iconColorClass: 'text-[#f59e0b]',
    accentBgClass: 'bg-[#f59e0b]/10',
    accentBorderClass: 'border-[#f59e0b]/20',
  },
  atsExplorer: {
    key: 'atsExplorer',
    name: 'Supported ATS Explorer',
    headingColorClass: 'text-[#06b6d4]', // Cyan
    iconColorClass: 'text-[#06b6d4]',
    accentBgClass: 'bg-[#06b6d4]/10',
    accentBorderClass: 'border-[#06b6d4]/20',
  },
  explorer: {
    key: 'explorer',
    name: 'Job Inbox & Explorer',
    headingColorClass: 'text-[#6366f1]', // Indigo
    iconColorClass: 'text-[#6366f1]',
    accentBgClass: 'bg-[#6366f1]/10',
    accentBorderClass: 'border-[#6366f1]/20',
  },
  analytics: {
    key: 'analytics',
    name: 'Analytics',
    headingColorClass: 'text-[#ec4899]', // Pink
    iconColorClass: 'text-[#ec4899]',
    accentBgClass: 'bg-[#ec4899]/10',
    accentBorderClass: 'border-[#ec4899]/20',
  },
  settings: {
    key: 'settings',
    name: 'Settings',
    headingColorClass: 'text-[#94a3b8]', // Slate
    iconColorClass: 'text-[#94a3b8]',
    accentBgClass: 'bg-[#94a3b8]/10',
    accentBorderClass: 'border-[#94a3b8]/20',
  },
  notifications: {
    key: 'notifications',
    name: 'Notification Center',
    headingColorClass: 'text-[#eab308]', // Yellow
    iconColorClass: 'text-[#eab308]',
    accentBgClass: 'bg-[#eab308]/10',
    accentBorderClass: 'border-[#eab308]/20',
  },
  tailoring: {
    key: 'tailoring',
    name: 'Resume Tailoring & Copilot',
    headingColorClass: 'text-[#14b8a6]', // Teal
    iconColorClass: 'text-[#14b8a6]',
    accentBgClass: 'bg-[#14b8a6]/10',
    accentBorderClass: 'border-[#14b8a6]/20',
  },
  coverLetter: {
    key: 'coverLetter',
    name: 'Cover Letter Generator',
    headingColorClass: 'text-[#f43f5e]', // Rose
    iconColorClass: 'text-[#f43f5e]',
    accentBgClass: 'bg-[#f43f5e]/10',
    accentBorderClass: 'border-[#f43f5e]/20',
  },
};

export const getPageTheme = (key: string): PageThemeConfig => {
  return PAGE_THEMES[key] || {
    key: 'default',
    name: 'Page',
    headingColorClass: 'text-indigo-400',
    iconColorClass: 'text-indigo-400',
    accentBgClass: 'bg-indigo-500/10',
    accentBorderClass: 'border-indigo-500/20',
  };
};
