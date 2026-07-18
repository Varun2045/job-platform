import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Cpu, Terminal, Play, CheckCircle, List, Code, HelpCircle, Save, Clock } from 'lucide-react';

export const ScraperBuilder: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'no-code' | 'selector'>('no-code');

  // No-Code Configurator States
  const [companyName, setCompanyName] = useState('');
  const [boardUrl, setBoardUrl] = useState('');
  const [atsProvider, setAtsProvider] = useState('greenhouse');
  const [scrapeLogs, setScrapeLogs] = useState<string[]>([]);
  const [previewJobs, setPreviewJobs] = useState<any[]>([]);
  const [testStats, setTestStats] = useState<any>(null);
  const [useCron, setUseCron] = useState(false);
  const [cronExpression, setCronExpression] = useState('0 9 * * 1-5');

  const translateCron = (cron: string) => {
    const parts = cron.trim().split(/\s+/);
    if (parts.length !== 5) return 'Invalid cron format (must be 5 fields)';
    const [min, hour, dayOfMonth, month, dayOfWeek] = parts;
    
    let timeStr = '';
    if (min === '0' && hour.match(/^\d+$/)) {
      const h = parseInt(hour);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const dispHour = h % 12 === 0 ? 12 : h % 12;
      timeStr = `${dispHour}:00 ${ampm}`;
    } else {
      timeStr = `minute ${min} of hour ${hour}`;
    }

    let scheduleStr = `Runs at ${timeStr}`;
    
    if (dayOfWeek === '1-5' || dayOfWeek === 'mon-fri') {
      scheduleStr += ', every weekday';
    } else if (dayOfWeek === '*') {
      scheduleStr += ', every day';
    } else if (dayOfWeek.match(/^\d+$/)) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      scheduleStr += `, only on ${days[parseInt(dayOfWeek)] || 'unknown day'}`;
    } else {
      scheduleStr += `, on days ${dayOfWeek} of the week`;
    }

    if (dayOfMonth !== '*') scheduleStr += `, on day ${dayOfMonth} of the month`;
    if (month !== '*') scheduleStr += `, in month ${month}`;
    
    return scheduleStr;
  };

  // CSS Selector Tester States
  const [rawHtml, setRawHtml] = useState('');
  const [titleSelector, setTitleSelector] = useState('a.job-title');
  const [locationSelector, setLocationSelector] = useState('.job-location');
  const [linkSelector, setLinkSelector] = useState('a');
  const [selectorMatches, setSelectorMatches] = useState<any[]>([]);

  // Mutations
  const testScraperMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/scraper/test-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, boardUrl, atsProvider })
      });
      if (!res.ok) throw new Error('Test run failed');
      return res.json();
    },
    onSuccess: (data) => {
      setScrapeLogs(data.logs || []);
      setPreviewJobs(data.jobs || []);
      setTestStats({
        success: data.success,
        responseTimeMs: data.responseTimeMs,
        jobsCount: data.jobsCount,
        error: data.error
      });
    },
    onError: (err: any) => {
      setScrapeLogs(prev => [...prev, `[ERROR] Connection failed: ${err.message}`]);
      setTestStats({
        success: false,
        responseTimeMs: 0,
        jobsCount: 0,
        error: err.message
      });
    }
  });

  const deployMutation = useMutation({
    mutationFn: async () => {
      const id = companyName.toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: companyName,
          priority: 2,
          interval_minutes: 60,
          api_endpoint: boardUrl,
          detected_ats: atsProvider,
          resume_profiles: ['backend'],
          cron_expression: useCron ? cronExpression : null
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to deploy scraper configuration');
      }
      return res.json();
    },
    onSuccess: () => {
      alert('Custom scraper successfully deployed to the background runner!');
      // Reset form
      setCompanyName('');
      setBoardUrl('');
      setAtsProvider('greenhouse');
      setScrapeLogs([]);
      setPreviewJobs([]);
      setTestStats(null);
    },
    onError: (err: any) => {
      alert(`Deployment failed: ${err.message}`);
    }
  });

  const testSelectorMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/scraper/test-selector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: rawHtml,
          titleSelector,
          locationSelector,
          linkSelector
        })
      });
      if (!res.ok) throw new Error('Selector parsing failed');
      return res.json();
    },
    onSuccess: (data) => {
      setSelectorMatches(data.preview || []);
    },
    onError: (err: any) => {
      alert(`Parsing failed: ${err.message}`);
    }
  });

  const handleTestScrape = () => {
    if (!companyName || !boardUrl) {
      alert('Please fill out Company Name and Job Board URL');
      return;
    }
    setScrapeLogs(['[INFO] Dispatching test scrape task to worker...']);
    setPreviewJobs([]);
    setTestStats(null);
    testScraperMutation.mutate();
  };

  const handleTestSelector = () => {
    if (!rawHtml || !titleSelector) {
      alert('Please input HTML and at least a Title Selector');
      return;
    }
    testSelectorMutation.mutate();
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto h-full flex flex-col overflow-y-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Cpu className="w-8 h-8 text-indigo-400" /> Custom Scraper Builder
        </h1>
        <p className="text-sm text-[#94a3b8]">Create, test, and deploy custom scraper configurations for any company without code</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#232d3f] gap-4 shrink-0">
        {[
          { id: 'no-code', label: 'ATS Scraper Configurator', icon: Cpu },
          { id: 'selector', label: 'HTML CSS Selector Tester', icon: Code }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 pb-3 px-1 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === t.id
                ? 'border-indigo-600 text-white'
                : 'border-transparent text-[#94a3b8] hover:text-white'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'no-code' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Config Panel */}
          <div className="lg:col-span-5 bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-white">Scraper Parameters</h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#94a3b8] uppercase">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Stripe, HuggingFace"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-600 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#94a3b8] uppercase">Job Board URL</label>
                <input
                  type="text"
                  placeholder="e.g. https://boards.greenhouse.io/stripe"
                  value={boardUrl}
                  onChange={e => setBoardUrl(e.target.value)}
                  className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-600 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#94a3b8] uppercase">ATS Provider</label>
                <select
                  value={atsProvider}
                  onChange={e => setAtsProvider(e.target.value)}
                  className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-600 transition"
                >
                  <option value="greenhouse">Greenhouse API</option>
                  <option value="lever">Lever API</option>
                  <option value="workday">Workday API</option>
                  <option value="cheerio_fallback">Cheerio HTML Fallback (Fast)</option>
                  <option value="playwright_fallback">Playwright Headless Browser (Heavy)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[#232d3f]">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-400" /> Custom Cron Schedule
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCron}
                    onChange={e => setUseCron(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#1b2535] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#94a3b8] after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                </label>
              </div>

              {useCron && (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#94a3b8] uppercase">Cron Expression</label>
                    <input
                      type="text"
                      placeholder="e.g. 0 9 * * 1-5"
                      value={cronExpression}
                      onChange={e => setCronExpression(e.target.value)}
                      className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-indigo-600 transition font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-indigo-400 font-bold bg-indigo-500/5 p-2 rounded-lg border border-indigo-600/20">
                    {translateCron(cronExpression)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-2">
              <button
                onClick={handleTestScrape}
                disabled={testScraperMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 text-white font-bold py-2.5 rounded-xl text-xs transition duration-200 cursor-pointer shadow-lg"
              >
                <Play className="w-4 h-4" /> {testScraperMutation.isPending ? 'Testing...' : 'Test Scraper'}
              </button>
              
              <button
                onClick={() => deployMutation.mutate()}
                disabled={!testStats?.success || deployMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl text-xs transition duration-200 cursor-pointer shadow-lg"
              >
                <Save className="w-4 h-4" /> {deployMutation.isPending ? 'Deploying...' : 'Deploy Scraper'}
              </button>
            </div>
          </div>

          {/* Right Debug Terminal & Results */}
          <div className="lg:col-span-7 space-y-6">
            {/* Terminal Window */}
            <div className="bg-[#0b0f19] border border-[#1b2535] rounded-2xl overflow-hidden flex flex-col shadow-2xl">
              <div className="h-10 bg-[#131a26] border-b border-[#1b2535] px-4 flex items-center justify-between text-xs text-[#94a3b8] font-bold select-none shrink-0">
                <span className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" /> Scraper Diagnostic Terminal
                </span>
                {testStats && (
                  <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                    testStats.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {testStats.success ? 'Success' : 'Failed'}
                  </span>
                )}
              </div>
              <div className="p-4 font-mono text-xs text-green-400 bg-black min-h-[180px] max-h-[250px] overflow-y-auto space-y-1.5 leading-relaxed selection:bg-green-800">
                {scrapeLogs.length === 0 ? (
                  <p className="text-gray-500 italic">No diagnostic task active. Formulate config and test scrape.</p>
                ) : (
                  scrapeLogs.map((log, idx) => (
                    <p key={idx} className={
                      log.includes('[ERROR]') ? 'text-red-400' : log.includes('[WARN]') ? 'text-amber-400' : 'text-green-400'
                    }>
                      {log}
                    </p>
                  ))
                )}
              </div>
            </div>

            {/* Test Stats Widget */}
            {testStats && (
              <div className="grid grid-cols-3 gap-4 bg-[#131a26] border border-[#232d3f] p-4 rounded-xl text-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-[#94a3b8] uppercase">Response Time</span>
                  <p className="text-lg font-black text-indigo-400">{testStats.responseTimeMs}ms</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-[#94a3b8] uppercase">Jobs Scraped</span>
                  <p className="text-lg font-black text-white">{testStats.jobsCount} roles</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-[#94a3b8] uppercase">ATS Type</span>
                  <p className="text-lg font-black text-emerald-400 uppercase">{atsProvider.replace('_fallback', '')}</p>
                </div>
              </div>
            )}

            {/* Live Scraped Jobs Preview Grid */}
            {previewJobs.length > 0 && (
              <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <List className="w-4 h-4 text-indigo-400" /> Scraped Jobs Preview (Top {previewJobs.length})
                </h3>
                <div className="max-h-80 overflow-y-auto border border-[#232d3f] rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#1b2535] text-[#94a3b8] border-b border-[#232d3f] font-bold">
                        <th className="p-3">Job Title</th>
                        <th className="p-3">Location</th>
                        <th className="p-3">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#232d3f] text-[#94a3b8]">
                      {previewJobs.map((j) => (
                        <tr key={j.id} className="hover:bg-[#1b2535] transition duration-150">
                          <td className="p-3 font-bold text-white">{j.title}</td>
                          <td className="p-3">
                            <span className="bg-[#0b0f19] px-2 py-0.5 rounded border border-[#232d3f]">
                              {j.location}
                            </span>
                          </td>
                          <td className="p-3">{j.employmentType}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* CSS Selector Tester Tab */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-white">Parser Selectors</h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#94a3b8] uppercase">Target Page HTML Source</label>
                <textarea
                  placeholder="Paste raw HTML of the career page here..."
                  value={rawHtml}
                  onChange={e => setRawHtml(e.target.value)}
                  className="w-full h-40 bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600 transition font-mono resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#94a3b8] uppercase">Job Title CSS Selector</label>
                <input
                  type="text"
                  placeholder="e.g. a.job-title, div.title"
                  value={titleSelector}
                  onChange={e => setTitleSelector(e.target.value)}
                  className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-600 transition font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#94a3b8] uppercase">Location Selector (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. span.loc, .location"
                  value={locationSelector}
                  onChange={e => setLocationSelector(e.target.value)}
                  className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-600 transition font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#94a3b8] uppercase">Link Tag Selector (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. a, a.apply-btn"
                  value={linkSelector}
                  onChange={e => setLinkSelector(e.target.value)}
                  className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-600 transition font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleTestSelector}
              disabled={testSelectorMutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 text-white font-bold py-2.5 rounded-xl text-xs transition duration-200 cursor-pointer shadow-lg"
            >
              <Code className="w-4 h-4" /> {testSelectorMutation.isPending ? 'Testing...' : 'Test CSS Selectors'}
            </button>
          </div>

          {/* Results Grid */}
          <div className="lg:col-span-7 bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-indigo-400" /> Extracted Elements Results
            </h3>
            {selectorMatches.length === 0 ? (
              <div className="border border-dashed border-[#232d3f] rounded-xl py-16 text-center text-xs text-[#94a3b8] flex flex-col items-center justify-center gap-2">
                <HelpCircle className="w-8 h-8 text-[#232d3f]" />
                <p>No elements parsed. Paste HTML source and click test.</p>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto border border-[#232d3f] rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#1b2535] text-[#94a3b8] border-b border-[#232d3f] font-bold">
                      <th className="p-3 w-10">#</th>
                      <th className="p-3">Title Text</th>
                      <th className="p-3">Location Text</th>
                      <th className="p-3">Relative Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232d3f] text-[#94a3b8]">
                    {selectorMatches.map((m, idx) => (
                      <tr key={m.id} className="hover:bg-[#1b2535] transition duration-150">
                        <td className="p-3 font-bold text-indigo-400">#{idx + 1}</td>
                        <td className="p-3 font-bold text-white">{m.title}</td>
                        <td className="p-3">
                          <span className="bg-[#0b0f19] px-2 py-0.5 rounded border border-[#232d3f]">
                            {m.location}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[10px] text-gray-500 truncate max-w-[150px]" title={m.url}>{m.url}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScraperBuilder;
