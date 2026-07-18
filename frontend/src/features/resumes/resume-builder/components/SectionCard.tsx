import React, { type ReactNode } from "react";
import { ChevronUp, ChevronDown, Eye, EyeOff } from "lucide-react";

interface SectionCardProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

/**
 * SectionCard represents a collapsible card used in the Resume Builder UI.
 * It supports keyboard navigation, aria attributes, and tooltips for accessibility.
 */
export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  children,
  defaultExpanded = true,
  onToggle,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
  isVisible = true,
  onToggleVisibility,
}) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  const handleToggle = () => {
    if (!isVisible) return; // Disable expanding if hidden
    setExpanded((prev) => {
      const next = !prev;
      onToggle?.(next);
      return next;
    });
  };

  // Keyboard handling: Enter/Space toggles, Arrow keys navigate between sections
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <section className={`border rounded-xl shadow-sm bg-white dark:bg-[#131a26] border-[#232d3f] overflow-hidden transition-all duration-200 ${
      !isVisible ? "opacity-60 border-dashed" : ""
    }`}>
      <header className="flex items-center justify-between p-4 select-none bg-[#1b2535]/30">
        <button
          type="button"
          onClick={handleToggle}
          disabled={!isVisible}
          aria-expanded={expanded}
          aria-controls={`section-${title.replace(/\s+/g, "-").toLowerCase()}`}
          onKeyDown={handleKeyDown}
          className={`flex items-center focus-visible:outline-none flex-grow text-left ${
            isVisible ? "cursor-pointer" : "cursor-not-allowed"
          }`}
          title={!isVisible ? "Section is hidden" : expanded ? "Collapse" : "Expand"}
        >
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100" id={`section-${title.replace(/\s+/g, "-").toLowerCase()}`}>
            {title}
          </h2>
        </button>

        {/* Header control options: Up, Down, Visibility Toggle */}
        <div className="flex items-center gap-1.5 ml-4" onClick={(e) => e.stopPropagation()}>
          {onMoveUp && (
            <button
              type="button"
              onClick={onMoveUp}
              disabled={isFirst}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/60 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Move Up"
            >
              <ChevronUp size={16} />
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              onClick={onMoveDown}
              disabled={isLast}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/60 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Move Down"
            >
              <ChevronDown size={16} />
            </button>
          )}
          {onToggleVisibility && (
            <button
              type="button"
              onClick={onToggleVisibility}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isVisible
                  ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                  : "bg-gray-600/20 text-gray-500 hover:bg-gray-600/30"
              }`}
              title={isVisible ? "Hide Section" : "Show Section"}
            >
              {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          )}
        </div>
      </header>
      {isVisible && expanded && (
        <div
          id={`section-${title.replace(/\s+/g, "-").toLowerCase()}`}
          className="p-4 border-t border-gray-200 dark:border-[#232d3f] bg-[#131a26]/20"
          role="region"
          aria-labelledby={`section-${title.replace(/\s+/g, "-").toLowerCase()}`}
        >
          {children}
        </div>
      )}
    </section>
  );
};

export default SectionCard;
