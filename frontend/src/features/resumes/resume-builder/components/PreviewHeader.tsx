import React, { useState, useRef, useEffect } from "react";
import {
  RotateCw,
  FileCode,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  Download,
  Save,
  Maximize2,
  Loader2,
} from "lucide-react";

interface PreviewHeaderProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onFitWidth: () => void;
  onFitHeight?: () => void;
  onTogglePresentationMode?: () => void;
  onDownloadLatex: () => void;
  onRefresh?: () => void;
  isSaving: boolean;
  onSave: () => void;
  onDownloadPdf: () => void;
  isDownloadingPdf?: boolean;
}

export const PreviewHeader: React.FC<PreviewHeaderProps> = ({
  zoom,
  onZoomChange,
  onFitWidth,
  onFitHeight,
  onTogglePresentationMode,
  onDownloadLatex,
  onRefresh,
  isSaving,
  onSave,
  onDownloadPdf,
  isDownloadingPdf = false,
}) => {
  const [showZoomDropdown, setShowZoomDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState(`${zoom}%`);

  const zoomPresets = [50, 75, 100, 150, 200, 400];

  // Sync input value when zoom prop changes externally
  useEffect(() => {
    setInputValue(`${zoom}%`);
  }, [zoom]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowZoomDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputSubmit = () => {
    const parsed = parseInt(inputValue.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(parsed)) {
      const clamped = Math.min(400, Math.max(40, parsed));
      onZoomChange(clamped);
      setInputValue(`${clamped}%`);
    } else {
      setInputValue(`${zoom}%`);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleInputSubmit();
    }
  };

  return (
    <div className="h-14 bg-[#131a26] border-b border-[#232d3f] px-4 flex items-center justify-between select-none relative z-45">
      {/* Left: Refresh and Zoom Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={onRefresh}
          className="p-1.5 hover:bg-[#2d3748] rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
          title="Refresh Preview"
          aria-label="Refresh Preview"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-[#1b2535] border border-[#232d3f] rounded-md px-1 h-8">
          <button
            onClick={() => onZoomChange(Math.max(40, zoom - 10))}
            className="p-1 hover:bg-[#2d3748] rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Clickable Zoom Dropdown trigger */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowZoomDropdown((prev) => !prev)}
              className="flex items-center gap-1 px-2 h-6 hover:bg-[#2d3748] rounded text-xs text-gray-300 hover:text-white font-medium transition-colors cursor-pointer"
              title="Zoom Presets"
              aria-label={`Zoom level: ${zoom}%`}
            >
              <span>{zoom}%</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </button>

            {showZoomDropdown && (
              <div className="absolute top-full left-0 mt-2 w-60 bg-[#1b2535] border border-[#232d3f] rounded-lg shadow-2xl p-2 z-55 text-left text-gray-300 animate-in fade-in duration-100">
                {/* 1. Zoom indicator input/box */}
                <div className="px-1 py-1">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputSubmit}
                    onKeyDown={handleInputKeyDown}
                    className="w-full bg-[#131a26] border border-[#2d3748] rounded px-3 py-2 text-xs text-white font-semibold outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Separator */}
                <div className="border-t border-[#232d3f] my-1" />

                {/* 2. Zoom Actions with Shortcuts */}
                <button
                  onClick={() => {
                    onZoomChange(Math.min(400, zoom + 10));
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-gray-200 hover:bg-[#2d3748] rounded hover:text-white transition-colors cursor-pointer"
                >
                  <span>Zoom in</span>
                  <span className="text-gray-500 font-mono text-[10px]">Ctrl +</span>
                </button>

                <button
                  onClick={() => {
                    onZoomChange(Math.max(40, zoom - 10));
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-gray-200 hover:bg-[#2d3748] rounded hover:text-white transition-colors cursor-pointer"
                >
                  <span>Zoom out</span>
                  <span className="text-gray-500 font-mono text-[10px]">Ctrl -</span>
                </button>

                <button
                  onClick={() => {
                    onFitWidth();
                    setShowZoomDropdown(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-gray-200 hover:bg-[#2d3748] rounded hover:text-white transition-colors cursor-pointer"
                >
                  <span>Fit to width</span>
                  <span className="text-gray-500 font-mono text-[10px]">Ctrl 0</span>
                </button>

                <button
                  onClick={() => {
                    onFitHeight?.();
                    setShowZoomDropdown(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-gray-200 hover:bg-[#2d3748] rounded hover:text-white transition-colors cursor-pointer"
                >
                  <span>Fit to height</span>
                  <span className="text-gray-500 font-mono text-[10px]">Ctrl 9</span>
                </button>

                {/* Separator */}
                <div className="border-t border-[#232d3f] my-1" />

                {/* 3. Presentation Mode */}
                <button
                  onClick={() => {
                    onTogglePresentationMode?.();
                    setShowZoomDropdown(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-[#2d3748] rounded hover:text-white transition-colors cursor-pointer font-medium"
                >
                  Presentation mode
                </button>

                {/* Separator */}
                <div className="border-t border-[#232d3f] my-1" />

                {/* 4. Zoom to Heading */}
                <div className="px-3 py-1 text-[9px] uppercase font-bold text-gray-500 tracking-wider">
                  Zoom to
                </div>

                <div className="space-y-0.5 mt-0.5 max-h-40 overflow-y-auto">
                  {zoomPresets.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        onZoomChange(preset);
                        setShowZoomDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded transition-colors cursor-pointer ${
                        zoom === preset
                          ? "bg-[#2d3748] text-indigo-400 font-semibold"
                          : "text-gray-300 hover:bg-[#2d3748] hover:text-white"
                      }`}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => onZoomChange(Math.min(400, zoom + 10))}
            className="p-1 hover:bg-[#2d3748] rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {onFitHeight && (
            <>
              <div className="w-[1px] h-3.5 bg-[#232d3f] mx-0.5" />
              <button
                onClick={onFitHeight}
                className="p-1 hover:bg-[#2d3748] rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
                title="Fit to Page (Whole Page)"
                aria-label="Fit to Page"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        {/* Export LaTeX Code */}
        <button
          onClick={onDownloadLatex}
          className="p-1.5 hover:bg-[#2d3748] rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
          title="Export LaTeX"
          aria-label="Export LaTeX"
        >
          <FileCode className="w-4 h-4" />
        </button>

        {/* Download PDF */}
        <button
          onClick={onDownloadPdf}
          disabled={isDownloadingPdf}
          className="p-1.5 hover:bg-[#2d3748] rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title={isDownloadingPdf ? "Exporting PDF..." : "Download PDF"}
          aria-label="Download PDF"
        >
          {isDownloadingPdf ? (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </button>

        {/* Save Resume */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className="p-1.5 hover:bg-[#2d3748] rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title={isSaving ? "Saving..." : "Save Resume"}
          aria-label="Save Resume"
        >
          <Save className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
