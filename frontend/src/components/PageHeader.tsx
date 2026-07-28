import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { getPageTheme } from '../theme/pageTheme.js';

interface PageHeaderProps {
  themeKey: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  themeKey,
  title,
  description,
  icon: Icon,
  children,
}) => {
  const theme = getPageTheme(themeKey);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-3 mb-1.5">
          {Icon && (
            <div className={`p-2.5 rounded-xl border ${theme.accentBgClass} ${theme.accentBorderClass} ${theme.iconColorClass}`}>
              <Icon className="w-6 h-6" />
            </div>
          )}
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${theme.headingColorClass}`}>
            {title}
          </h1>
        </div>
        {description && (
          <p className="text-sm text-[#94a3b8] max-w-3xl font-medium">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-3 shrink-0">{children}</div>}
    </div>
  );
};
