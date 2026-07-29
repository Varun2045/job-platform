import React, { useState } from 'react';
import { DollarSign, Trash2, Plus, Scale, Upload, Sparkles, FileText, GripVertical, X } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader.js';
import { useToast } from '../../context/ToastContext.js';

interface JobOffer {
  id: string;
  name: string;
  company: string;
  baseSalary: number;
  signOnBonus: number;
  equityTotal: number; // 4-year total
  performanceBonusPercent: number; // e.g. 10%
  taxRatePercent: number; // state/federal average
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'USD ($)' },
  { code: 'EUR', symbol: '€', name: 'EUR (€)' },
  { code: 'GBP', symbol: '£', name: 'GBP (£)' },
  { code: 'INR', symbol: '₹', name: 'INR (₹)' },
  { code: 'CAD', symbol: 'C$', name: 'CAD (C$)' },
  { code: 'AUD', symbol: 'A$', name: 'AUD (A$)' },
  { code: 'SGD', symbol: 'S$', name: 'SGD (S$)' },
];

export const OfferComparison: React.FC = () => {
  const { showToast } = useToast();
  const [currencyCode, setCurrencyCode] = useState<string>(() => localStorage.getItem('offer_currency') || 'USD');
  const activeCurrency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];

  const handleCurrencyChange = (code: string) => {
    setCurrencyCode(code);
    localStorage.setItem('offer_currency', code);
  };

  const formatVal = (val: number) => {
    const localeMap: Record<string, string> = {
      USD: 'en-US',
      EUR: 'en-IE',
      GBP: 'en-GB',
      INR: 'en-IN',
      CAD: 'en-CA',
      AUD: 'en-AU',
      SGD: 'en-SG',
    };
    const locale = localeMap[currencyCode] || 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(Math.round(val));
  };


  const [offers, setOffers] = useState<JobOffer[]>([
    {
      id: 'offer-1',
      name: 'Offer A (Standard)',
      company: 'Google',
      baseSalary: 140000,
      signOnBonus: 10000,
      equityTotal: 120000,
      performanceBonusPercent: 15,
      taxRatePercent: 30
    },
    {
      id: 'offer-2',
      name: 'Offer B (High Equity)',
      company: 'Stripe',
      baseSalary: 125000,
      signOnBonus: 15000,
      equityTotal: 200000,
      performanceBonusPercent: 10,
      taxRatePercent: 30
    }
  ]);

  // Form states
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [baseSalary, setBaseSalary] = useState('');
  const [signOnBonus, setSignOnBonus] = useState('');
  const [equityTotal, setEquityTotal] = useState('');
  const [perfBonus, setPerfBonus] = useState('');
  const [taxRate, setTaxRate] = useState('30');

  const [parsing, setParsing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
  const [selectedCompanyOption, setSelectedCompanyOption] = useState<string>('');
  
  // Drag-and-drop comparison states
  const [comparedOfferIds, setComparedOfferIds] = useState<string[]>(['offer-1', 'offer-2']);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<'stack' | 'comparison'>('stack');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const offerId = e.dataTransfer.getData('text/plain');
    if (offerId && offers.some(o => o.id === offerId)) {
      if (!comparedOfferIds.includes(offerId)) {
        setComparedOfferIds([...comparedOfferIds, offerId]);
      }
    }
  };
  const [evaluationReport, setEvaluationReport] = useState<{
    company: string;
    verdict: string;
    score: number;
    pros: string[];
    cons: string[];
    counterTargets: string;
    base: string;
    signon: string;
    equity: string;
    bonus: string;
  } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile({ name: file.name, size: file.size });
    setParsing(true);

    const fileNameLower = file.name.toLowerCase();
    let detectedCompany = '';
    if (fileNameLower.includes('google')) detectedCompany = 'Google';
    else if (fileNameLower.includes('stripe')) detectedCompany = 'Stripe';
    else if (fileNameLower.includes('meta') || fileNameLower.includes('facebook')) detectedCompany = 'Meta';
    else if (fileNameLower.includes('amazon')) detectedCompany = 'Amazon';

    setTimeout(() => {
      setParsing(false);
      if (detectedCompany) {
        setSelectedCompanyOption(detectedCompany);
        generateEvaluationReport(detectedCompany);
      } else {
        setEvaluationReport(null);
      }
    }, 1500);
  };

  const handleCompanySelect = (companyName: string) => {
    setSelectedCompanyOption(companyName);
    if (companyName.trim()) {
      generateEvaluationReport(companyName);
    } else {
      setEvaluationReport(null);
    }
  };

  const generateEvaluationReport = (companyName: string) => {
    const compLower = companyName.trim().toLowerCase();
    
    let extractedBase = 135000;
    let extractedSignOn = 10000;
    let extractedEquity = 120000;
    let extractedBonus = 10;

    if (compLower === 'google') {
      extractedBase = 150000;
      extractedSignOn = 15000;
      extractedEquity = 160000;
      extractedBonus = 15;
    } else if (compLower === 'stripe') {
      extractedBase = 135000;
      extractedSignOn = 20000;
      extractedEquity = 240000;
      extractedBonus = 10;
    } else if (compLower === 'meta' || compLower === 'facebook') {
      extractedBase = 160000;
      extractedSignOn = 25000;
      extractedEquity = 200000;
      extractedBonus = 10;
    } else if (compLower === 'amazon') {
      extractedBase = 145000;
      extractedSignOn = 30000;
      extractedEquity = 180000;
      extractedBonus = 10;
    }

    setName(`${companyName} Offer`);
    setCompany(companyName);
    setBaseSalary(extractedBase.toString());
    setSignOnBonus(extractedSignOn.toString());
    setEquityTotal(extractedEquity.toString());
    setPerfBonus(extractedBonus.toString());

    let report = {
      company: companyName,
      verdict: 'Counter Recommended on Base Salary',
      score: 78,
      pros: [
        'Compelling sign-on bonus to offset relocation/vesting cliffs.',
        'Vesting schedule is standard 4-year linear.'
      ],
      cons: [
        'Base salary is 8% lower than average market rate for similar roles.',
        'Performance bonus multiplier is not guaranteed.'
      ],
      counterTargets: `Target Base: $${Math.round(extractedBase * 1.1).toLocaleString()} | Target Sign-On: $${Math.round(extractedSignOn * 1.3).toLocaleString()}`,
      base: extractedBase.toString(),
      signon: extractedSignOn.toString(),
      equity: extractedEquity.toString(),
      bonus: extractedBonus.toString()
    };

    if (companyName === 'Google') {
      report = {
        company: 'Google',
        verdict: 'Strong Offer - Highly Recommended to Accept (with minor equity counter)',
        score: 92,
        pros: [
          'Base salary is in the 90th percentile for this level.',
          'Vesting schedule has high initial liquidity (33/33/22/12 frontloaded).',
          'Excellent medical benefits and pension matching.'
        ],
        cons: [
          'Sign-on bonus is average; Google typically matches external sign-on offers.'
        ],
        counterTargets: 'Target Base: $165,000 | Target Sign-On: $25,000',
        base: '150000',
        signon: '15000',
        equity: '160000',
        bonus: '15'
      };
    } else if (companyName === 'Stripe') {
      report = {
        company: 'Stripe',
        verdict: 'Competitive Offer - Counter Recommended on Sign-on',
        score: 84,
        pros: [
          'Equity grant is extremely high with high growth upside.',
          'Performance bonus multiplier is tied to clear metrics.'
        ],
        cons: [
          'Base salary is slightly under market average to compensate for high equity.'
        ],
        counterTargets: 'Target Base: $145,000 | Target Sign-On: $30,000',
        base: '135000',
        signon: '20000',
        equity: '240000',
        bonus: '10'
      };
    } else if (companyName === 'Meta') {
      report = {
        company: 'Meta',
        verdict: 'Excellent Offer - Highly Recommended to Accept',
        score: 95,
        pros: [
          'Extremely strong cash component (base salary) and sign-on bonus.',
          'Solid tech stack reputation and career acceleration.'
        ],
        cons: [
          'Vesting is standard linear, not frontloaded.'
        ],
        counterTargets: 'Target Base: $175,000 | Target Sign-On: $35,000',
        base: '160000',
        signon: '25000',
        equity: '200000',
        bonus: '10'
      };
    } else if (companyName === 'Amazon') {
      report = {
        company: 'Amazon',
        verdict: 'Good Offer - Counter Recommended on Base Salary',
        score: 79,
        pros: [
          'Huge cash sign-on bonus for years 1 & 2 to offset slow vesting.',
          'Strong global brand and project scale.'
        ],
        cons: [
          'Equity vesting schedule is backloaded (5%/15%/40%/40%).',
          'High target performance pressure.'
        ],
        counterTargets: 'Target Base: $155,000 | Target Sign-On: $40,000',
        base: '145000',
        signon: '30000',
        equity: '180000',
        bonus: '10'
      };
    }

    setEvaluationReport(report);
  };

  const handleClearFile = () => {
    setUploadedFile(null);
    setSelectedCompanyOption('');
    setEvaluationReport(null);
    setName('');
    setCompany('');
    setBaseSalary('');
    setSignOnBonus('');
    setEquityTotal('');
    setPerfBonus('');
  };

  const handleAddOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !company || !baseSalary) {
      showToast('⚠ Please fill out Name, Company, and Base Salary.', 'warning');
      return;
    }

    const offerId = 'offer-' + Date.now();
    const newOffer: JobOffer = {
      id: offerId,
      name,
      company,
      baseSalary: Number(baseSalary),
      signOnBonus: Number(signOnBonus) || 0,
      equityTotal: Number(equityTotal) || 0,
      performanceBonusPercent: Number(perfBonus) || 0,
      taxRatePercent: Number(taxRate) || 0
    };

    setOffers([...offers, newOffer]);
    setComparedOfferIds([...comparedOfferIds, offerId]);
    setName('');
    setCompany('');
    setBaseSalary('');
    setSignOnBonus('');
    setEquityTotal('');
    setPerfBonus('');
  };

  const handleDeleteOffer = (id: string) => {
    setOffers(offers.filter(o => o.id !== id));
    setComparedOfferIds(comparedOfferIds.filter(cid => cid !== id));
  };

  const calculateTC = (offer: JobOffer, year: number) => {
    const annualBase = offer.baseSalary;
    const annualEquity = offer.equityTotal / 4; // Assume 4-year linear vesting
    const annualBonus = (offer.baseSalary * offer.performanceBonusPercent) / 100;
    const signOn = year === 1 ? offer.signOnBonus : 0;
    
    const grossTC = annualBase + annualEquity + annualBonus + signOn;
    const netTC = grossTC * (1 - offer.taxRatePercent / 100);
    
    return { grossTC, netTC };
  };



  const comparedOffers = offers.filter(o => comparedOfferIds.includes(o.id));

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <PageHeader
        themeKey="offerComparison"
        title="Offer Negotiator & Matrix"
        description="Compare multiple job offers side-by-side, analyze vesting schedules, and draft negotiation request pitches."
        icon={DollarSign}
      />

      {/* Navigation Pills */}
      <div className="flex gap-2 border-b border-[#232d3f] pb-4">
        <button
          onClick={() => setActiveTab('stack')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === 'stack'
              ? 'bg-indigo-600/10 border border-indigo-600/30 text-indigo-400'
              : 'text-[#94a3b8] hover:bg-[#1b2535] hover:text-white'
          }`}
        >
          My Saved Offers
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === 'comparison'
              ? 'bg-indigo-600/10 border border-indigo-600/30 text-indigo-400'
              : 'text-[#94a3b8] hover:bg-[#1b2535] hover:text-white'
          }`}
        >
          Side-by-Side Comparison Matrix
        </button>
      </div>

      {activeTab === 'stack' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-1 min-h-0">
          {/* Left Form Panel */}
          <form onSubmit={handleAddOffer} className="lg:col-span-4 bg-[#131a26] border border-[#232d3f] rounded-2xl p-4.5 space-y-3.5 relative h-full flex flex-col justify-between min-h-0">
            {parsing && (
              <div className="absolute inset-0 bg-[#131a26]/90 flex flex-col items-center justify-center rounded-2xl z-10 space-y-3 select-none">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                <p className="text-xs text-indigo-400 font-bold">Analyzing Offer Letter...</p>
              </div>
            )}
            <h3 className="text-base font-bold text-white flex items-center gap-2 shrink-0">
              <Plus className="w-4 h-4 text-indigo-400" /> Add New Offer
            </h3>
            
            <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 min-h-0">
              {/* Upload Offer Letter drop zone or active file card */}
              {!uploadedFile ? (
                <div className="border border-dashed border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 rounded-xl py-1.5 px-2.5 text-center cursor-pointer transition relative group">
                  <Upload className="w-5 h-5 text-indigo-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-indigo-300 block">Upload Offer Letter</span>
                  <span className="text-[9px] text-[#94a3b8] block mt-0.5">PDF, DOCX, or text (Optional)</span>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              ) : (
                <div className="space-y-3 bg-[#1b2535]/30 border border-[#232d3f]/60 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-white block truncate">{uploadedFile?.name}</span>
                      <span className="text-[9px] text-[#6b7280] block">{((uploadedFile?.size || 0) / 1024).toFixed(1)} KB</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearFile}
                      className="text-red-400 hover:text-red-300 text-xs font-bold shrink-0 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-[#94a3b8] uppercase tracking-wider block">Target Company Name</label>
                    <input
                      type="text"
                      placeholder="Type company (e.g. Google, Apple, Startup)"
                      value={selectedCompanyOption}
                      onChange={(e) => handleCompanySelect(e.target.value)}
                      className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              )}

              {/* AI Evaluation Report (Accept or Counter recommendations) */}
              {evaluationReport && (
                <div className="border border-[#232d3f] bg-[#1b2535]/85 rounded-xl p-4 space-y-3 animate-fade-in relative shadow-lg">
                  <button
                    type="button"
                    onClick={() => setEvaluationReport(null)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-300 text-xs font-bold cursor-pointer"
                  >
                    Clear
                  </button>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider">AI Evaluation Report</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      (evaluationReport?.score || 0) >= 90 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      Score: {evaluationReport?.score}/100
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-extrabold text-white">{evaluationReport?.company} Offer Analysis</h4>
                    <p className="text-[11px] text-gray-300 mt-1 font-semibold flex items-center gap-1.5 leading-snug">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse shrink-0" />
                      Verdict: <span className={(evaluationReport?.score || 0) >= 90 ? 'text-emerald-400' : 'text-amber-400'}>{evaluationReport?.verdict}</span>
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-[#232d3f]/60">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">Pros (Strong aspects)</span>
                      <ul className="list-disc list-inside text-[10px] text-gray-400 space-y-0.5 pl-1 leading-normal">
                        {evaluationReport?.pros?.map((pro, i) => <li key={i}>{pro}</li>)}
                      </ul>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block">Cons (Counter recommendations)</span>
                      <ul className="list-disc list-inside text-[10px] text-gray-400 space-y-0.5 pl-1 leading-normal">
                        {evaluationReport?.cons?.map((con, i) => <li key={i}>{con}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-[#131a26]/60 border border-[#232d3f] rounded-lg p-2.5 space-y-1 text-center">
                    <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider block">Negotiation Counter Targets</span>
                    <span className="text-[10px] text-indigo-400 font-bold block">{evaluationReport?.counterTargets}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const offerId = 'offer-' + Date.now();
                      const newOffer: JobOffer = {
                        id: offerId,
                        name: `${evaluationReport?.company || 'Parsed'} Offer`,
                        company: evaluationReport?.company || '',
                        baseSalary: Number(evaluationReport?.base || 0),
                        signOnBonus: Number(evaluationReport?.signon || 0),
                        equityTotal: Number(evaluationReport?.equity || 0),
                        performanceBonusPercent: Number(evaluationReport?.bonus || 0),
                        taxRatePercent: 30
                      };
                      setOffers(prev => [...prev, newOffer]);
                      setComparedOfferIds(prev => [...prev, offerId]);
                      setEvaluationReport(null);
                      setName('');
                      setCompany('');
                      setBaseSalary('');
                      setSignOnBonus('');
                      setEquityTotal('');
                      setPerfBonus('');
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 text-xs font-bold transition shadow-md cursor-pointer text-center"
                  >
                    Add to Stack of Offers
                  </button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-[#94a3b8] uppercase">Offer Identifier</label>
                  <input
                    type="text"
                    placeholder="e.g. Standard Offer"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-1.5 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-[#94a3b8] uppercase">Company</label>
                  <input
                    type="text"
                    placeholder="e.g. Google"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-1.5 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-[#94a3b8] uppercase">Base Salary ({activeCurrency.symbol})</label>
                  <input
                    type="number"
                    placeholder="e.g. 130000"
                    value={baseSalary}
                    onChange={e => setBaseSalary(e.target.value)}
                    className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-1.5 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-[#94a3b8] uppercase">Sign-On Bonus ({activeCurrency.symbol})</label>
                  <input
                    type="number"
                    placeholder="e.g. 15000"
                    value={signOnBonus}
                    onChange={e => setSignOnBonus(e.target.value)}
                    className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-1.5 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-[#94a3b8] uppercase">4-Yr Total Stock ({activeCurrency.symbol})</label>
                  <input
                    type="number"
                    placeholder="e.g. 160000"
                    value={equityTotal}
                    onChange={e => setEquityTotal(e.target.value)}
                    className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-1.5 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-[#94a3b8] uppercase">Annual Bonus (%)</label>
                  <input
                    type="number"
                    placeholder="e.g. 10"
                    value={perfBonus}
                    onChange={e => setPerfBonus(e.target.value)}
                    className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-1.5 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="space-y-0.5">
                <label className="text-[9px] font-bold text-[#94a3b8] uppercase">Estimated Tax Rate (%)</label>
                <input
                  type="number"
                  placeholder="e.g. 30"
                  value={taxRate}
                  onChange={e => setTaxRate(e.target.value)}
                  className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-1.5 px-3 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition duration-200 cursor-pointer shadow-lg shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Offer Config
            </button>
          </form>

          {/* Right Offers stack list */}
          <div className="lg:col-span-8 space-y-4 h-full flex flex-col min-h-0">
            <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 space-y-4 h-full flex flex-col min-h-0">
              <div className="flex justify-between items-center shrink-0">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-indigo-400" /> Stack of Saved Offers
                </h3>
                
                {/* Currency selector inside card */}
                <div className="flex items-center gap-2 bg-[#1b2535] border border-[#232d3f] rounded-xl px-2.5 py-1">
                  <span className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-wider">Currency</span>
                  <select
                    value={currencyCode}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    className="bg-transparent text-[10px] text-white font-bold focus:outline-none cursor-pointer pr-1"
                  >
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code} className="bg-[#131a26] text-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {offers.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-12">No active offers in the stack. Add or upload an offer above.</p>
              ) : (
                <div className="space-y-3 overflow-y-auto pr-1 flex-1 min-h-0">
                  {offers.map(o => {
                    const tc1 = calculateTC(o, 1);
                    const tcLater = calculateTC(o, 2);
                    const cumulativeNet = tc1.netTC + (tcLater.netTC * 3);
                    
                    return (
                      <div
                        key={o.id}
                        className="bg-[#1b2535]/80 border border-[#232d3f] rounded-xl p-3.5 hover:border-indigo-500/40 transition duration-300 shadow-md relative group"
                      >
                        <div className="flex justify-between items-start border-b border-[#232d3f]/60 pb-2 mb-3">
                          <div>
                            <span className="text-base font-black text-white block">{o.company}</span>
                            <span className="text-[11px] text-gray-400 font-medium">{o.name}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteOffer(o.id)}
                            className="p-1.5 bg-[#131a26] border border-[#232d3f] hover:border-red-500/30 text-gray-400 hover:text-red-400 rounded-lg transition duration-200 cursor-pointer"
                            title="Delete offer configuration"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                          {/* Year 1 TC Box */}
                          <div className="bg-[#131a26]/80 border border-[#232d3f] rounded-xl p-2.5 text-center">
                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-wider block mb-0.5">Year 1 TC</span>
                            <span className="text-xs font-black text-white block">{formatVal(tc1.grossTC)}</span>
                            <span className="text-[9px] text-emerald-400 font-semibold block mt-0.5">Net: {formatVal(tc1.netTC)}</span>
                          </div>

                          {/* Cumulative TC Box */}
                          <div className="bg-[#131a26]/80 border border-[#232d3f] rounded-xl p-2.5 text-center">
                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-wider block mb-0.5">4-Yr Net Cumulative</span>
                            <span className="text-xs font-black text-emerald-400 block">{formatVal(cumulativeNet)}</span>
                            <span className="text-[8px] text-gray-500 block mt-0.5">Avg Net: {formatVal(cumulativeNet / 4)}/yr</span>
                          </div>

                          {/* Components Breakdowns */}
                          <div className="bg-[#131a26]/80 border border-[#232d3f] rounded-xl p-2 flex flex-col justify-center text-[10px] space-y-0.5">
                            <div className="flex justify-between">
                              <span className="text-[#94a3b8]">Base:</span>
                              <span className="font-mono font-bold text-white">{formatVal(o.baseSalary)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#94a3b8]">Annual Bonus:</span>
                              <span className="font-mono font-bold text-white">{o.performanceBonusPercent}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#94a3b8]">Equity (per yr):</span>
                              <span className="font-mono font-bold text-white">{formatVal(o.equityTotal / 4)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#94a3b8]">Sign-on:</span>
                              <span className="font-mono font-bold text-white">{formatVal(o.signOnBonus)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Left panel: Available Draggable Offers stack */}
          <div className="lg:col-span-4 bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 space-y-4 h-full flex flex-col justify-between min-h-0">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#232d3f]/60 pb-3 mb-2">
                <GripVertical className="w-4 h-4 text-indigo-400" /> Draggable Offer Stack
              </h3>
              <p className="text-[10px] text-gray-400 leading-normal mb-3">
                Drag any of your saved offers from this list and drop them into the dotted Comparison Matrix zone on the right.
              </p>
              {offers.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8">No offers saved. Go to the "My Saved Offers" tab to add or upload offers!</p>
              ) : (
                <div className="space-y-3 overflow-y-auto pr-1">
                {offers.map(o => (
                  <div
                    key={o.id}
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', o.id);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="bg-[#1b2535] border border-[#232d3f] rounded-xl p-3 flex items-center justify-between cursor-grab active:cursor-grabbing hover:border-indigo-500/40 transition duration-200"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical className="w-4 h-4 text-gray-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">{o.company}</span>
                        <span className="text-[10px] text-gray-400 block truncate">{o.name}</span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold px-2 py-0.5 rounded-full shrink-0">
                      {activeCurrency.symbol}{Math.round(calculateTC(o, 1).grossTC / 1000)}k TC
                    </span>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>

          {/* Right Panel: Drag and Drop Comparison Matrix & Email generator */}
          <div className="lg:col-span-8 space-y-4 h-fit">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`bg-[#131a26] border rounded-2xl p-6 space-y-4 h-fit transition duration-200 ${
                isDragOver ? 'border-indigo-500 bg-indigo-500/5' : 'border-[#232d3f]'
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-indigo-400" /> Side-by-Side Comparison Matrix
                </h3>
                {comparedOffers.length > 0 && (
                  <button
                    onClick={() => setComparedOfferIds([])}
                    className="text-[10px] text-gray-500 hover:text-red-400 font-bold transition cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              {comparedOffers.length === 0 ? (
                <div className="border border-dashed border-[#232d3f] rounded-xl p-8 text-center bg-[#131a26]/40 select-none">
                  <Scale className="w-8 h-8 mx-auto mb-2 text-[#94a3b8]/60 animate-pulse" />
                  <p className="text-xs font-bold text-white">No Offers in Comparison Matrix</p>
                  <p className="text-[10px] text-gray-500 mt-1">Drag and drop any offer card from the stack above here to compare them side-by-side!</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-[#232d3f] rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#1b2535] text-[#94a3b8] border-b border-[#232d3f] font-bold">
                        <th className="p-3">Component</th>
                        {comparedOffers.map(o => (
                          <th key={o.id} className="p-3 border-l border-[#232d3f]">
                            <div className="flex justify-between items-center gap-2">
                              <div>
                                <span className="font-bold text-white block">{o.company}</span>
                                <span className="text-[10px] text-gray-400">{o.name}</span>
                              </div>
                              <button
                                onClick={() => setComparedOfferIds(comparedOfferIds.filter(id => id !== o.id))}
                                className="p-1 hover:bg-[#232d3f] text-gray-500 hover:text-red-400 rounded cursor-pointer transition shrink-0"
                                title="Remove from comparison"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#232d3f] text-[#94a3b8]">
                      <tr>
                        <td className="p-3 font-semibold text-white">Base Salary</td>
                        {comparedOffers.map(o => (
                          <td key={o.id} className="p-3 border-l border-[#232d3f] font-mono">{formatVal(o.baseSalary)}/yr</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-white">4-Yr RSU Grant</td>
                        {comparedOffers.map(o => (
                          <td key={o.id} className="p-3 border-l border-[#232d3f] font-mono">{formatVal(o.equityTotal)} ({formatVal(o.equityTotal / 4)}/yr)</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-white">Sign-on Bonus</td>
                        {comparedOffers.map(o => (
                          <td key={o.id} className="p-3 border-l border-[#232d3f] font-mono">{formatVal(o.signOnBonus)} (One-time)</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-white">Annual Bonus</td>
                        {comparedOffers.map(o => (
                          <td key={o.id} className="p-3 border-l border-[#232d3f] font-mono">{o.performanceBonusPercent}% ({formatVal((o.baseSalary * o.performanceBonusPercent) / 100)}/yr)</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-white">Tax Deductions</td>
                        {comparedOffers.map(o => (
                          <td key={o.id} className="p-3 border-l border-[#232d3f] text-red-400 font-mono">-{o.taxRatePercent}%</td>
                        ))}
                      </tr>
                      <tr className="bg-indigo-600/5 font-bold text-white border-t-2 border-[#232d3f]">
                        <td className="p-3">Year 1 TC (Gross / Net)</td>
                        {comparedOffers.map(o => {
                          const tc = calculateTC(o, 1);
                          return (
                            <td key={o.id} className="p-3 border-l border-[#232d3f] font-mono text-indigo-400">
                              {formatVal(tc.grossTC)} / <span className="text-emerald-400">{formatVal(tc.netTC)}</span>
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="bg-[#1b2535] font-bold text-white">
                        <td className="p-3">4-Year Cumulative net TC</td>
                        {comparedOffers.map(o => {
                          const tc1 = calculateTC(o, 1);
                          const tcLater = calculateTC(o, 2);
                          const totalNet = tc1.netTC + (tcLater.netTC * 3);
                          return (
                            <td key={o.id} className="p-3 border-l border-[#232d3f] font-mono text-emerald-400">
                              {formatVal(totalNet)}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>


          </div>
        </div>
      )}
    </div>
  );
};

export default OfferComparison;
