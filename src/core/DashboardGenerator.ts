import fs from 'fs';
import path from 'path';
import { GlobalMetrics } from './MetricsExporter.js';
import { Job, Application } from '../companies/Scraper.js';
import { Logger } from './Logger.js';

// Helper function to escape HTML content to prevent XSS
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export interface DashboardData {
  runTimestamp: string;
  totalDurationMs: number;
  companiesChecked: number;
  totalJobs: number;
  totalNewMatches: number;
  totalUpdatedMatches: number;
  totalFailures: number;
  healthRate: number;
  companies: {
    id: string;
    name: string;
    status: string;
    jobsCount: number;
    newJobsCount: number;
    durationMs: number;
  }[];
  recentMatches: {
    company: string;
    title: string;
    location: string;
    experience: string;
    employmentType: string;
    url: string;
    datePosted: string;
    matchScore: number;
    isRemote: boolean;
    explanation?: any;
    jobHash: string;
  }[];
  updatedMatches: {
    company: string;
    title: string;
    location: string;
    experience: string;
    employmentType: string;
    url: string;
    datePosted: string;
    matchScore: number;
    isRemote: boolean;
    changes?: string[];
    explanation?: any;
    jobHash: string;
  }[];
  applications: Application[];
}

export class DashboardGenerator {
  public static generate(
    metrics: GlobalMetrics,
    newMatches: { job: Job; score: number }[],
    updatedMatches: { job: Job; score: number }[],
    applications: Application[],
  ): void {
    const storageDir = path.join(process.cwd(), 'storage');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    const healthRate = Math.round(
      ((metrics.companiesChecked - metrics.totalFailures) / metrics.companiesChecked) * 100,
    );

    const dashboardJson: DashboardData = {
      runTimestamp: metrics.runTimestamp,
      totalDurationMs: metrics.totalDurationMs,
      companiesChecked: metrics.companiesChecked,
      totalJobs: metrics.totalJobs,
      totalNewMatches: newMatches.length,
      totalUpdatedMatches: updatedMatches.length,
      totalFailures: metrics.totalFailures,
      healthRate,
      companies: metrics.companies.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        jobsCount: c.jobsFound,
        newJobsCount: c.newJobs,
        durationMs: c.durationMs,
      })),
      recentMatches: newMatches.map((m) => ({
        company: m.job.company,
        title: m.job.title,
        location: m.job.location,
        experience: m.job.experience,
        employmentType: m.job.employmentType,
        url: m.job.url,
        datePosted: m.job.datePosted,
        matchScore: m.score,
        isRemote: m.job.isRemote,
        explanation: (m.job as any).explanation || null,
        jobHash: m.job.jobHash,
      })),
      updatedMatches: updatedMatches.map((m) => ({
        company: m.job.company,
        title: m.job.title,
        location: m.job.location,
        experience: m.job.experience,
        employmentType: m.job.employmentType,
        url: m.job.url,
        datePosted: m.job.datePosted,
        matchScore: m.score,
        isRemote: m.job.isRemote,
        changes: (m.job as any).changes || [],
        explanation: (m.job as any).explanation || null,
        jobHash: m.job.jobHash,
      })),
      applications: applications || [],
    };

    const jsonPath = path.join(storageDir, 'dashboard.json');
    fs.writeFileSync(jsonPath, JSON.stringify(dashboardJson, null, 2), 'utf-8');
    Logger.debug(`Dashboard JSON data written to: ${jsonPath}`);

    const htmlPath = path.join(storageDir, 'dashboard.html');
    const htmlContent = this.buildHtmlClient();
    fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
    Logger.debug(`Dashboard HTML client updated at: ${htmlPath}`);
  }

  private static buildHtmlClient(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Monitor Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-primary: #0b0f19;
      --bg-secondary: #131a26;
      --bg-tertiary: #1b2535;
      --accent: #4f46e5;
      --accent-gradient: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      --text-primary: #f8fafc;
      --text-secondary: #94a3b8;
      --border: #232d3f;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-primary);
      color: var(--text-primary);
      font-family: 'Plus Jakarta Sans', sans-serif;
      min-height: 100vh;
      padding: 40px 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    header {
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--bg-secondary);
      padding: 24px;
      border-radius: 16px;
      border: 1px solid var(--border);
    }

    .logo-container h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 28px;
      font-weight: 800;
      background: var(--accent-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 4px;
    }

    .logo-container p {
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 500;
    }

    .time-badge {
      background: var(--bg-tertiary);
      padding: 8px 16px;
      border-radius: 99px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      border: 1px solid var(--border);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      position: relative;
      overflow: hidden;
    }

    .stat-card::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: var(--border);
    }

    .stat-card.success::after { background: var(--success); }
    .stat-card.warning::after { background: var(--warning); }
    .stat-card.danger::after { background: var(--danger); }

    .stat-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 800;
      font-family: 'Outfit', sans-serif;
    }

    .filter-bar {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 30px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 15px;
      align-items: end;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .filter-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
    }

    .filter-input, .filter-select {
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      color: var(--text-primary);
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      width: 100%;
      outline: none;
    }

    .filter-input:focus, .filter-select:focus {
      border-color: var(--accent);
    }

    .dashboard-layout {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 30px;
    }

    .section-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      height: fit-content;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .section-header h2 {
      font-family: 'Outfit', sans-serif;
      font-size: 20px;
      font-weight: 700;
    }

    .status-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .status-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: var(--bg-tertiary);
      border-radius: 8px;
      border: 1px solid var(--border);
    }

    .company-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .company-name {
      font-weight: 600;
      font-size: 14px;
    }

    .company-meta {
      font-size: 11px;
      color: var(--text-secondary);
    }

    .status-badge {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 4px 8px;
      border-radius: 4px;
    }

    .status-badge.healthy { background-color: rgba(16, 185, 129, 0.15); color: var(--success); }
    .status-badge.degraded { background-color: rgba(245, 158, 11, 0.15); color: var(--warning); }
    .status-badge.failed { background-color: rgba(239, 68, 68, 0.15); color: var(--danger); }

    .matches-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .match-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      transition: border-color 0.2s;
      position: relative;
    }

    .match-card:hover {
      border-color: var(--accent);
    }

    .match-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .match-company {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
    }

    .match-title {
      font-family: 'Outfit', sans-serif;
      font-size: 18px;
      font-weight: 700;
      margin-top: 4px;
    }

    .score-badge {
      background: rgba(79, 70, 229, 0.15);
      color: #818cf8;
      border: 1px solid rgba(79, 70, 229, 0.3);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      font-family: 'Outfit', sans-serif;
    }

    .match-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }

    .tag {
      font-size: 11px;
      font-weight: 600;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      padding: 4px 8px;
      border-radius: 6px;
      color: var(--text-secondary);
    }

    .tag.accent {
      background-color: rgba(79, 70, 229, 0.1);
      color: #818cf8;
      border-color: rgba(79, 70, 229, 0.2);
    }

    .tag.success {
      background-color: rgba(16, 185, 129, 0.1);
      color: var(--success);
      border-color: rgba(16, 185, 129, 0.2);
    }

    .tag.warning {
      background-color: rgba(245, 158, 11, 0.1);
      color: var(--warning);
      border-color: rgba(245, 158, 11, 0.2);
    }

    .match-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border);
      padding-top: 12px;
    }

    .match-date {
      font-size: 11px;
      color: var(--text-secondary);
    }

    .btn-group {
      display: flex;
      gap: 10px;
    }

    .apply-btn {
      background: var(--accent-gradient);
      color: #ffffff;
      text-decoration: none;
      font-size: 12px;
      font-weight: 700;
      padding: 8px 16px;
      border-radius: 8px;
      transition: opacity 0.2s;
    }

    .apply-btn:hover {
      opacity: 0.9;
    }

    .action-btn {
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border: 1px solid var(--border);
      font-size: 12px;
      font-weight: 700;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .action-btn:hover {
      background: var(--border);
    }

    .explanation-panel {
      margin-top: 16px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      display: none;
    }

    .explanation-panel.active {
      display: block;
    }

    .explain-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }

    .skills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
    }

    .skill-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .skill-badge.matched { background: rgba(16, 185, 129, 0.15); color: var(--success); }
    .skill-badge.missing { background: rgba(239, 68, 68, 0.15); color: var(--danger); }

    .bullets-list {
      list-style-type: none;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .bullets-list li {
      font-size: 12px;
      color: var(--text-secondary);
    }

    .bullets-list li::before {
      content: '• ';
      color: var(--accent);
      font-weight: bold;
    }

    .no-matches {
      text-align: center;
      padding: 40px;
      color: var(--text-secondary);
    }

    .tabs-bar {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 10px;
    }

    .tab-btn {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      padding: 6px 12px;
      border-radius: 6px;
    }

    .tab-btn.active {
      background: var(--bg-tertiary);
      color: var(--text-primary);
    }

    .trend-bar-container {
      margin-bottom: 12px;
    }

    .trend-bar-label {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 4px;
    }

    .trend-bar-bg {
      background: var(--bg-tertiary);
      height: 8px;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid var(--border);
    }

    .trend-bar-fill {
      background: var(--accent-gradient);
      height: 100%;
    }

    /* Modal Styling */
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      z-index: 1000;
      justify-content: center;
      align-items: center;
    }

    .modal.active {
      display: flex;
    }

    .modal-content {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 16px;
      width: 480px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .modal-header {
      font-size: 18px;
      font-weight: 700;
      font-family: 'Outfit', sans-serif;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo-container">
        <h1>Job Monitor</h1>
        <p>Serverless Automated Career Monitor Engine v1.2.0</p>
      </div>
      <div class="time-badge" id="last-updated">Last Run: Loading...</div>
    </header>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Applications Submitted</div>
        <div class="stat-value" id="stat-apps-submitted">0</div>
      </div>
      <div class="stat-card success">
        <div class="stat-label">Interviews Scheduled</div>
        <div class="stat-value" id="stat-interviews">0</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-label">Offers Received</div>
        <div class="stat-value" id="stat-offers">0</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Jobs Waiting</div>
        <div class="stat-value" id="stat-jobs-waiting">0</div>
      </div>
    </div>

    <!-- Advanced Search & Filters -->
    <div class="filter-bar">
      <div class="filter-group">
        <div class="filter-label">Search Keyword / Tech</div>
        <input type="text" id="search-input" class="filter-input" placeholder="e.g. Node, React...">
      </div>
      <div class="filter-group">
        <div class="filter-label">Company Filter</div>
        <select id="company-filter" class="filter-select">
          <option value="all">All Companies</option>
        </select>
      </div>
      <div class="filter-group">
        <div class="filter-label">Experience Level</div>
        <select id="exp-filter" class="filter-select">
          <option value="all">All Levels</option>
          <option value="junior">Junior / Early</option>
          <option value="mid">Mid / General</option>
          <option value="senior">Senior / Lead</option>
        </select>
      </div>
      <div class="filter-group">
        <div class="filter-label">Min Score</div>
        <select id="score-filter" class="filter-select">
          <option value="0">All Match Scores</option>
          <option value="70">70% or Higher</option>
          <option value="80">80% or Higher</option>
          <option value="90">90% or Higher</option>
        </select>
      </div>
      <div class="filter-group">
        <div class="filter-label">Data Export</div>
        <div class="btn-group">
          <button class="action-btn" onclick="exportData('csv')">CSV</button>
          <button class="action-btn" onclick="exportData('json')">JSON</button>
          <button class="action-btn" onclick="exportData('md')">MD</button>
        </div>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="dashboard-layout">
      <!-- Left: Sidebar Tabs -->
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div class="tabs-bar">
          <button class="tab-btn active" id="tab-scrapers-btn" onclick="switchSidebarTab('scrapers')">Scrapers</button>
          <button class="tab-btn" id="tab-trends-btn" onclick="switchSidebarTab('trends')">Analytics Trends</button>
          <button class="tab-btn" id="tab-tracker-btn" onclick="switchSidebarTab('tracker')">App Tracker</button>
        </div>

        <!-- Scrapers List -->
        <div class="section-card" id="sidebar-scrapers" style="width: 100%;">
          <div class="section-header">
            <h2>Scraper Status</h2>
            <span style="font-size: 12px; color: var(--text-secondary);" id="stat-failures">0 failures</span>
          </div>
          <div class="status-list" id="company-status-list">
            <!-- Dynamic -->
          </div>
        </div>

        <!-- Trends / Analytics List -->
        <div class="section-card" id="sidebar-trends" style="width: 100%; display: none;">
          <div class="section-header">
            <h2>Historical Analytics</h2>
          </div>
          <div id="analytics-container" style="display: flex; flex-direction: column; gap: 15px;">
            <div class="trend-bar-container">
              <div class="trend-bar-label">
                <span>Average Resume Match Score</span>
                <span id="trend-avg-score">--%</span>
              </div>
              <div class="trend-bar-bg">
                <div class="trend-bar-fill" id="trend-avg-score-fill" style="width: 0%;"></div>
              </div>
            </div>
            <div class="trend-bar-container">
              <div class="trend-bar-label">
                <span>Scraper Failure Rate</span>
                <span id="trend-fail-rate">--%</span>
              </div>
              <div class="trend-bar-bg">
                <div class="trend-bar-fill" id="trend-fail-rate-fill" style="width: 0%; background: var(--danger);"></div>
              </div>
            </div>

            <h3 style="font-size: 13px; text-transform: uppercase; color: var(--text-secondary); margin-top: 10px; margin-bottom: 5px;">Most Active Boards</h3>
            <div id="analytics-active-companies"></div>
          </div>
        </div>

        <!-- Tracker / Applications list -->
        <div class="section-card" id="sidebar-tracker" style="width: 100%; display: none;">
          <div class="section-header">
            <h2>Tracked Applications</h2>
          </div>
          <div class="status-list" id="tracker-list">
            <!-- Dynamic -->
          </div>
        </div>
      </div>

      <!-- Right: Matched Positions -->
      <div class="section-card">
        <div class="section-header">
          <h2>High-Match Job Postings</h2>
          <span style="font-size: 12px; color: var(--text-secondary);" id="matches-count-badge">0 matched</span>
        </div>
        <div class="matches-list" id="matches-container">
          <div class="no-matches">Loading matching job postings...</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal for Tracking status updates -->
  <div class="modal" id="track-modal">
    <div class="modal-content">
      <div class="modal-header">Track Application</div>
      <div class="filter-group">
        <div class="filter-label">Status</div>
        <select id="modal-status-select" class="filter-select">
          <option value="Saved">Saved</option>
          <option value="Applied">Applied</option>
          <option value="OA Scheduled">OA Scheduled</option>
          <option value="OA Completed">OA Completed</option>
          <option value="Interview">Interview</option>
          <option value="Offer">Offer</option>
          <option value="Rejected">Rejected</option>
          <option value="Closed">Closed</option>
        </select>
      </div>
      <div class="filter-group">
        <div class="filter-label">Notes</div>
        <textarea id="modal-notes" class="filter-input" style="height: 80px; resize: none;"></textarea>
      </div>
      <div class="btn-group" style="justify-content: flex-end;">
        <button class="action-btn" onclick="closeModal()">Cancel</button>
        <button class="apply-btn" onclick="submitTracking()">Save</button>
      </div>
    </div>
  </div>

  <script>
    let rawDashboardData = null;
    let selectedJobHash = null;

    // Helper function to escape HTML content to prevent XSS
    function escapeHtml(unsafe) {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
    let selectedJobDetails = null;

    function switchSidebarTab(tab) {
      document.getElementById('tab-scrapers-btn').className = tab === 'scrapers' ? 'tab-btn active' : 'tab-btn';
      document.getElementById('tab-trends-btn').className = tab === 'trends' ? 'tab-btn active' : 'tab-btn';
      document.getElementById('tab-tracker-btn').className = tab === 'tracker' ? 'tab-btn active' : 'tab-btn';

      document.getElementById('sidebar-scrapers').style.display = tab === 'scrapers' ? 'block' : 'none';
      document.getElementById('sidebar-trends').style.display = tab === 'trends' ? 'block' : 'none';
      document.getElementById('sidebar-tracker').style.display = tab === 'tracker' ? 'block' : 'none';
    }

    async function loadDashboard() {
      try {
        const response = await fetch('./dashboard.json');
        if (!response.ok) throw new Error('Failed to load dashboard.json');
        const data = await response.json();
        rawDashboardData = data;

        // Update Header Time
        document.getElementById('last-updated').innerText = 'Last Run: ' + new Date(data.runTimestamp).toLocaleString();

        // Populate Company Filter options
        const companyFilter = document.getElementById('company-filter');
        const companiesList = Array.from(new Set([
          ...data.recentMatches.map(m => m.company),
          ...data.updatedMatches.map(m => m.company)
        ])).sort();

        companiesList.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c;
          opt.innerText = c;
          companyFilter.appendChild(opt);
        });

        // Render Company Statuses
        const statusList = document.getElementById('company-status-list');
        statusList.innerHTML = '';
        data.companies
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach((c) => {
            const statusClass = c.status === 'healthy' ? 'healthy' : (c.status === 'degraded' ? 'degraded' : 'failed');
            const durationText = c.durationMs > 0 ? (c.durationMs / 1000).toFixed(1) + 's' : '--';

            const item = document.createElement('div');
            item.className = 'status-item';
            item.innerHTML = '<div class="company-info">' +
              '<span class="company-name">' + escapeHtml(c.name) + '</span>' +
              '<span class="company-meta">Found: ' + escapeHtml(String(c.jobsCount)) + ' - Scraped in: ' + escapeHtml(durationText) + '</span>' +
              '</div>' +
              '<span class="status-badge ' + statusClass + '">' + escapeHtml(c.status) + '</span>';
            statusList.appendChild(item);
          });

        renderPersonalTracker();
        renderFilteredMatches();

        // Attach filter listeners
        document.getElementById('search-input').addEventListener('input', renderFilteredMatches);
        document.getElementById('company-filter').addEventListener('change', renderFilteredMatches);
        document.getElementById('exp-filter').addEventListener('change', renderFilteredMatches);
        document.getElementById('score-filter').addEventListener('change', renderFilteredMatches);

      } catch (err) {
        Logger.logError('Error parsing dashboard.json', err as Error);
        const matchesContainer = document.getElementById('matches-container');
        if (matchesContainer) {
          matchesContainer.textContent = 'Error loading metrics: ' + (err as Error).message;
        }
      }

      // Load Analytics separately
      try {
        const response = await fetch('./analytics.json');
        if (response.ok) {
          const analytics = await response.json();
          document.getElementById('trend-avg-score').innerText = analytics.averageScore + '%';
          document.getElementById('trend-avg-score-fill').style.width = analytics.averageScore + '%';

          document.getElementById('trend-fail-rate').innerText = analytics.failureRate + '%';
          document.getElementById('trend-fail-rate-fill').style.width = analytics.failureRate + '%';

          const activeCont = document.getElementById('analytics-active-companies');
          activeCont.innerHTML = '';
          const maxJobs = Math.max(...analytics.mostActiveCompanies.map(c => c.jobsCount), 1);
          analytics.mostActiveCompanies.forEach(c => {
            const pct = Math.round((c.jobsCount / maxJobs) * 100);
            const item = document.createElement('div');
            item.className = 'trend-bar-container';
            item.innerHTML = '<div class="trend-bar-label">' +
              '<span>' + escapeHtml(c.name) + '</span>' +
              '<span>' + escapeHtml(String(c.jobsCount)) + ' jobs</span>' +
              '</div>' +
              '<div class="trend-bar-bg">' +
              '<div class="trend-bar-fill" style="width: ' + escapeHtml(String(pct)) + '%;"></div>' +
              '</div>';
            activeCont.appendChild(item);
          });
        }
      } catch (e) {
        Logger.logWarn('analytics.json not found or failed to load. Skipping trends load.', e as Error);
      }
    }

    function renderPersonalTracker() {
      if (!rawDashboardData) return;
      const apps = rawDashboardData.applications || [];

      // Update Tracker statistics cards
      document.getElementById('stat-apps-submitted').innerText = apps.filter(a => a.status === 'Applied').length;
      document.getElementById('stat-interviews').innerText = apps.filter(a => a.status === 'Interview').length;
      document.getElementById('stat-offers').innerText = apps.filter(a => a.status === 'Offer').length;
      document.getElementById('stat-jobs-waiting').innerText = apps.filter(a => ['Saved', 'OA Scheduled', 'OA Completed'].includes(a.status)).length;

      // Render applications list in sidebar
      const trackerList = document.getElementById('tracker-list');
      trackerList.innerHTML = '';
      if (apps.length === 0) {
        trackerList.innerHTML = '<div class="no-matches">No applications tracked yet.</div>';
        return;
      }

      apps.forEach(a => {
        const item = document.createElement('div');
        item.className = 'status-item';
        item.innerHTML = '<div class="company-info">' +
          '<span class="company-name">' + escapeHtml(a.company) + '</span>' +
          '<span class="company-meta">ID: ' + escapeHtml(a.jobId) + ' • Notes: ' + escapeHtml(a.notes || 'None') + '</span>' +
          '</div>' +
          '<span class="status-badge healthy">' + escapeHtml(a.status) + '</span>';
        trackerList.appendChild(item);
      });
    }

    function toggleExplanation(id) {
      const panel = document.getElementById('explain-' + id);
      if (panel) {
        panel.classList.toggle('active');
      }
    }

    function openTrackModal(hash, company, jobId, event) {
      if (event) event.stopPropagation();
      selectedJobHash = hash;
      selectedJobDetails = { company, jobId };

      const existing = (rawDashboardData.applications || []).find(a => a.jobHash === hash);
      document.getElementById('modal-status-select').value = existing ? existing.status : 'Saved';
      document.getElementById('modal-notes').value = existing ? (existing.notes || '') : '';

      document.getElementById('track-modal').classList.add('active');
    }

    function closeModal() {
      document.getElementById('track-modal').classList.remove('active');
    }

    function submitTracking() {
      if (!selectedJobHash) return;
      const status = document.getElementById('modal-status-select').value;
      const notes = document.getElementById('modal-notes').value;

      // Update locally
      if (!rawDashboardData.applications) rawDashboardData.applications = [];
      const existingIdx = rawDashboardData.applications.findIndex(a => a.jobHash === selectedJobHash);
      const appRecord = {
        jobHash: selectedJobHash,
        company: selectedJobDetails.company,
        jobId: selectedJobDetails.jobId,
        status: status,
        notes: notes,
        lastUpdated: new Date().toISOString()
      };

      if (existingIdx !== -1) {
        rawDashboardData.applications[existingIdx] = appRecord;
      } else {
        rawDashboardData.applications.push(appRecord);
      }

      renderPersonalTracker();
      renderFilteredMatches();
      closeModal();

      // Trigger server-side update check if in dev mode
      fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appRecord)
      }).catch(e => {
        // Mock notification: applications saved in memory only. Export CSV/JSON/MD to download.
      });
    }

    function renderFilteredMatches() {
      if (!rawDashboardData) return;

      const searchVal = document.getElementById('search-input').value.toLowerCase();
      const companyVal = document.getElementById('company-filter').value;
      const expVal = document.getElementById('exp-filter').value;
      const minScoreVal = parseInt(document.getElementById('score-filter').value, 10);

      const items = [
        ...rawDashboardData.recentMatches.map(m => ({ ...m, status: 'new' })),
        ...rawDashboardData.updatedMatches.map(m => ({ ...m, status: 'updated' }))
      ];

      const filtered = items.filter(item => {
        // Tech keywords check
        const matchesSearch = item.title.toLowerCase().includes(searchVal) || item.company.toLowerCase().includes(searchVal) || (item.explanation && item.explanation.matchedSkills.some(s => s.toLowerCase().includes(searchVal)));
        const matchesCompany = companyVal === 'all' || item.company === companyVal;
        const matchesScore = item.matchScore >= minScoreVal;

        let matchesExp = true;
        if (expVal !== 'all') {
          const expText = (item.experience || '').toLowerCase() + ' ' + item.title.toLowerCase();
          if (expVal === 'junior') matchesExp = expText.includes('junior') || expText.includes('early') || expText.includes('entry') || expText.includes('grad') || expText.includes('intern');
          else if (expVal === 'senior') matchesExp = expText.includes('senior') || expText.includes('lead') || expText.includes('staff') || expText.includes('principal');
          else matchesExp = !expText.includes('junior') && !expText.includes('senior') && !expText.includes('lead') && !expText.includes('intern') && !expText.includes('grad');
        }

        return matchesSearch && matchesCompany && matchesScore && matchesExp;
      });

      const container = document.getElementById('matches-container');
      if (container) {
        container.textContent = '';
      }

      const matchesCountBadge = document.getElementById('matches-count-badge');
      if (matchesCountBadge) {
        matchesCountBadge.textContent = filtered.length + ' matched';
      }

      if (filtered.length === 0 && container) {
        container.textContent = 'No postings matching search criteria.';
        return;
      }

      filtered.forEach((m, idx) => {
        const id = m.status + '-' + idx;
        const card = document.createElement('div');
        card.className = 'match-card';
        card.setAttribute('onclick', 'toggleExplanation("' + id + '")');

        const tags = [
          '<span class="tag">📍 ' + escapeHtml(m.location) + '</span>',
          '<span class="tag">💼 ' + escapeHtml(m.employmentType || 'Full-time') + '</span>',
          '<span class="tag">🎓 ' + escapeHtml(m.experience || 'Entry') + '</span>'
        ];
        if (m.isRemote) tags.push('<span class="tag accent">🌐 Remote</span>');
        
        const trackingStatus = (rawDashboardData.applications || []).find(a => a.jobHash === m.jobHash);
        if (trackingStatus) {
          tags.push('<span class="tag success">💼 ' + escapeHtml(trackingStatus.status) + '</span>');
        }

        const dateStr = m.datePosted ? new Date(m.datePosted).toLocaleDateString() : 'Just now';

        let explainHtml = '';
        if (m.explanation) {
          const exp = m.explanation;
          const matchedList = exp.matchedSkills.map(s => '<span class="skill-badge matched">✓ ' + escapeHtml(s) + '</span>').join(' ');
          const missingList = exp.missingSkills.map(s => '<span class="skill-badge missing">✗ ' + escapeHtml(s) + '</span>').join(' ');
          const strengthsList = exp.strengths.map(s => '<li>' + escapeHtml(s) + '</li>').join('');
          const weaknessesList = exp.weaknesses.map(w => '<li>' + escapeHtml(w) + '</li>').join('');

          explainHtml = '<div class="explanation-panel" id="explain-' + id + '" onclick="event.stopPropagation()">' +
            '<div class="explain-title">Skills Overview</div>' +
            '<div class="skills-grid">' +
              matchedList +
              (missingList || '<span class="tag">No missing required skills</span>') +
            '</div>' +
            '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">' +
              '<div>' +
                '<div class="explain-title">Strengths</div>' +
                '<ul class="bullets-list">' + (strengthsList || '<li>Clear alignment with resume</li>') + '</ul>' +
              '</div>' +
              '<div>' +
                '<div class="explain-title">Weaknesses</div>' +
                '<ul class="bullets-list">' + (weaknessesList || '<li>No significant weaknesses</li>') + '</ul>' +
              '</div>' +
            '</div>' +
          '</div>';
        }

        const card = document.createElement('div');
        card.className = 'match-card';
        card.innerHTML = '<div class="match-header">' +
            '<div>' +
              '<span class="match-company">' + escapeHtml(m.company) + '</span>' +
              '<h3 class="match-title">' + escapeHtml(m.title) + '</h3>' +
            '</div>' +
            '<span class="score-badge">' + escapeHtml(String(m.matchScore)) + '% Match</span>' +
          '</div>' +
          '<div class="match-tags">' +
            tags.join('') +
          '</div>' +
          '<div class="match-footer">' +
            '<span class="match-date">Posted on: ' + escapeHtml(dateStr) + '</span>' +
            '<div class="btn-group">' +
              '<button class="action-btn" onclick="openTrackModal(\'' + escapeHtml(m.jobHash) + '\', \'' + escapeHtml(m.company) + '\', \'' + escapeHtml(m.jobId || 'N/A') + '\', event)">Track Status</button>' +
              '<a href="' + escapeHtml(m.url) + '" target="_blank" class="apply-btn" onclick="event.stopPropagation()">View Job</a>' +
            '</div>' +
          '</div>' +
          explainHtml;

        container.appendChild(card);
      });
    }

    function exportData(format) {
      if (!rawDashboardData) return;
      const items = [
        ...rawDashboardData.recentMatches,
        ...rawDashboardData.updatedMatches
      ];

      let content = '';
      let filename = 'export.' + format;
      let type = 'text/plain';

      if (format === 'json') {
        content = JSON.stringify(rawDashboardData, null, 2);
        filename = 'job_monitor_export.json';
        type = 'application/json';
      } else if (format === 'csv') {
        const headers = ['Company', 'Title', 'Location', 'Score', 'URL', 'Date Posted'];
        const rows = items.map(m => [
          '"' + m.company.replace(/"/g, '""') + '"',
          '"' + m.title.replace(/"/g, '""') + '"',
          '"' + m.location.replace(/"/g, '""') + '"',
          m.matchScore,
          '"' + m.url.replace(/"/g, '""') + '"',
          m.datePosted
        ]);
        content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        filename = 'job_monitor_export.csv';
        type = 'text/csv';
      } else {
        // Markdown
        content = '# Job Monitor Export\\n\\n';
        items.forEach(m => {
          content += '### ' + m.title + ' at ' + m.company + ' (' + m.matchScore + '% match)\\n';
          content += '- **Location**: ' + m.location + '\\n';
          content += '- **Apply URL**: ' + m.url + '\\n';
          content += '- **Date Posted**: ' + m.datePosted + '\\n\\n';
        });
        filename = 'job_monitor_export.md';
      }

      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    loadDashboard();
  </script>
</body>
</html>`;
  }
}
