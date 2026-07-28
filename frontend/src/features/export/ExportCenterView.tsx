import React from 'react';
import { Download, FileSpreadsheet, Code } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader.js';

export const ExportCenterView: React.FC = () => {
  const handleExportCSV = () => {
    window.open('/api/backup/export-csv', '_blank');
  };

  const handleExportJSON = () => {
    window.open('/api/backup/export', '_blank');
  };

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto min-h-screen text-white">
      <PageHeader
        themeKey="exportCenter"
        title="Export & Report Center"
        description="Export full job application history, recruiter outreach notes, and analytics in CSV or JSON format."
        icon={Download}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Export */}
        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-base text-slate-100">CSV Spreadsheet Export</h2>
                <span className="text-xs text-slate-400">Compatible with Excel, Google Sheets, and Numbers</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Exports all application records including company, status, dates, notes, and custom stage order floats.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Download Applications CSV
          </button>
        </div>

        {/* JSON Export */}
        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                <Code className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-base text-slate-100">Full System JSON Backup</h2>
                <span className="text-xs text-slate-400">Complete raw platform backup</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Exports complete database state including resume profiles, saved searches, companies state, and offer calculations.
            </p>
          </div>
          <button
            onClick={handleExportJSON}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Download Backup JSON
          </button>
        </div>
      </div>
    </div>
  );
};
