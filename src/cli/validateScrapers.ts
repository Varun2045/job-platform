import fs from 'fs';
import path from 'path';
import { config } from '../config/config.js';
import { HttpClient } from '../core/HttpClient.js';
import { ScraperRegistry } from '../companies/ScraperRegistry.js';
import { PlaywrightScraper } from '../companies/PlaywrightScraper.js';
import { FallbackScraper } from '../companies/FallbackScraper.js';
import { CompanyConfig } from '../companies/Scraper.js';
import { TaskQueue } from '../core/Queue.js';

interface ScraperValidationResult {
  companyName: string;
  companyId: string;
  careerUrl: string;
  atsPlatform: string;
  pluginName: string;
  status: 'Green' | 'Yellow' | 'Red';
  httpStatus: number;
  jobsFound: number;
  executionTimeMs: number;
  lastError: string;
  failureReason: string;
  suggestedFix: string;
}

async function main() {
  const args = process.argv.slice(2);
  const companyFlagIdx = args.indexOf('--company');
  const targetCompany = companyFlagIdx !== -1 ? args[companyFlagIdx + 1] : null;

  const limitFlagIdx = args.indexOf('--limit');
  const limit = limitFlagIdx !== -1 ? parseInt(args[limitFlagIdx + 1], 10) : null;

  const concurrencyFlagIdx = args.indexOf('--concurrency');
  const concurrency = concurrencyFlagIdx !== -1 ? parseInt(args[concurrencyFlagIdx + 1], 10) : 5;

  const atsFlagIdx = args.indexOf('--ats');
  const targetAts = atsFlagIdx !== -1 ? args[atsFlagIdx + 1] : null;

  // Load companies
  const configDir = path.join(process.cwd(), 'config');
  const companiesPath = path.join(configDir, 'companies.json');
  if (!fs.existsSync(companiesPath)) {
    console.error(`Error: config/companies.json not found at ${companiesPath}`);
    process.exit(1);
  }

  const allCompanies: CompanyConfig[] = JSON.parse(fs.readFileSync(companiesPath, 'utf8'));
  let filteredCompanies = allCompanies.filter(c => c.enabled);

  if (targetCompany) {
    filteredCompanies = filteredCompanies.filter(c => c.id === targetCompany || c.name.toLowerCase() === targetCompany.toLowerCase());
  }

  if (targetAts) {
    filteredCompanies = filteredCompanies.filter(c => c.detected_ats && c.detected_ats.toLowerCase() === targetAts.toLowerCase());
  }

  if (limit) {
    filteredCompanies = filteredCompanies.slice(0, limit);
  }

  console.log(`\n=================== SCRAPER VALIDATION FRAMEWORK ===================`);
  console.log(`Targeting ${filteredCompanies.length} companies with a concurrency level of ${concurrency}...`);
  console.log(`====================================================================\n`);

  const httpClient = new HttpClient();
  const playwrightScraper = new PlaywrightScraper();
  const fallbackScraper = new FallbackScraper();
  const results: ScraperValidationResult[] = [];

  const taskQueue = new TaskQueue();

  for (const company of filteredCompanies) {
    taskQueue.addTask({
      id: company.id,
      priority: 1,
      execute: async () => {
        const scraperStart = Date.now();
        let httpStatus = 200;
        let jobsFound = 0;
        let errorMessage = '';
        let failureReason = '';
        let suggestedFix = '';
        let status: 'Green' | 'Yellow' | 'Red' = 'Green';

        const plugin = ScraperRegistry.getPlugin(company);
        const pluginName = plugin ? plugin.metadata.id : 'fallback';
        const apiEndpoint = company.api_endpoint || '';

        // 1. Probing the URL
        try {
          if (apiEndpoint) {
            const probeRes = await httpClient.request(apiEndpoint, { method: 'GET', timeoutMs: 10000, retries: 1 });
            httpStatus = probeRes.status;
          } else {
            httpStatus = 400;
            errorMessage = 'Missing api_endpoint configuration';
          }
        } catch (err: any) {
          httpStatus = err.status || 500;
          errorMessage = err.message || 'Request timed out or network failed';
        }

        // 2. Executing Scraper
        try {
          let rawJobs = [];
          if (plugin && company.detected_ats !== 'fallback') {
            rawJobs = await plugin.discover(company, httpClient);
          } else if (config.features.playwright) {
            rawJobs = await playwrightScraper.discover(company);
          } else {
            rawJobs = await fallbackScraper.discover(company, httpClient);
          }
          jobsFound = rawJobs.length;

          // Check if some fields are missing
          const hasMissingFields = rawJobs.some(j => !j.title || !j.url);
          if (hasMissingFields) {
            status = 'Yellow';
            failureReason = 'Extracted job listings have missing required fields (title or url).';
            suggestedFix = 'Inspect parser selectors to ensure correct extraction rules are mapped.';
          }
        } catch (err: any) {
          status = 'Red';
          errorMessage = err.message || 'Scraper execution crashed';
        }

        const durationMs = Date.now() - scraperStart;

        // Classify Status
        if (status !== 'Red') {
          if (errorMessage) {
            status = 'Red';
            failureReason = errorMessage;
            suggestedFix = getSuggestedFix(httpStatus, errorMessage);
          } else if (httpStatus >= 400) {
            status = 'Red';
            failureReason = `HTTP Error Code: ${httpStatus}`;
            suggestedFix = getSuggestedFix(httpStatus, '');
          } else if (jobsFound === 0) {
            status = 'Yellow';
            failureReason = 'Career page reachable but returned 0 jobs.';
            suggestedFix = 'Verify if the company actually has open roles, or if the career page HTML container changed.';
          } else if (durationMs > 10000) {
            status = 'Yellow';
            failureReason = `Slow extraction response: took ${(durationMs / 1000).toFixed(1)}s`;
            suggestedFix = 'Enable API-based scraping or add cache-control headers to decrease latency.';
          }
        } else {
          failureReason = errorMessage;
          suggestedFix = getSuggestedFix(httpStatus, errorMessage);
        }

        const result: ScraperValidationResult = {
          companyName: company.name,
          companyId: company.id,
          careerUrl: apiEndpoint,
          atsPlatform: company.detected_ats || 'custom',
          pluginName,
          status,
          httpStatus,
          jobsFound,
          executionTimeMs: durationMs,
          lastError: errorMessage,
          failureReason,
          suggestedFix,
        };

        results.push(result);

        // Colorful Console Logging
        if (status === 'Green') {
          console.log(`\x1b[32m🟢 SUCCESS\x1b[0m ${company.name.padEnd(20)} | ATS: ${(company.detected_ats || 'custom').padEnd(12)} | Jobs: ${String(jobsFound).padEnd(4)} | Time: ${durationMs}ms`);
        } else if (status === 'Yellow') {
          console.log(`\x1b[33m🟡 WARNING\x1b[0m ${company.name.padEnd(19)} | Reason: ${failureReason.substring(0, 60)}`);
        } else {
          console.log(`\x1b[31m🔴 ERROR\x1b[0m ${company.name.padEnd(21)} | Reason: ${failureReason.substring(0, 60)}`);
        }
      }
    });
  }

  // Run all tasks
  await taskQueue.runAll(concurrency, 300);

  // Generate Reports
  const total = results.length;
  const green = results.filter(r => r.status === 'Green').length;
  const yellow = results.filter(r => r.status === 'Yellow').length;
  const red = results.filter(r => r.status === 'Red').length;
  const successRate = total > 0 ? ((green / total) * 100).toFixed(1) : '0.0';

  const times = results.map(r => r.executionTimeMs);
  const avgTime = times.length > 0 ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(0) : '0';

  const slowest = [...results].sort((a, b) => b.executionTimeMs - a.executionTimeMs).slice(0, 5);
  const fastest = [...results].sort((a, b) => a.executionTimeMs - b.executionTimeMs).slice(0, 5);

  // Failure reasons aggregation
  const failureReasons: Record<string, number> = {};
  results.filter(r => r.status !== 'Green').forEach(r => {
    const reason = r.failureReason || 'Unknown error';
    failureReasons[reason] = (failureReasons[reason] || 0) + 1;
  });
  const topFailures = Object.entries(failureReasons).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Failure by ATS aggregation
  const atsStats: Record<string, { total: number; green: number; yellow: number; red: number }> = {};
  results.forEach(r => {
    if (!atsStats[r.atsPlatform]) {
      atsStats[r.atsPlatform] = { total: 0, green: 0, yellow: 0, red: 0 };
    }
    atsStats[r.atsPlatform].total++;
    if (r.status === 'Green') atsStats[r.atsPlatform].green++;
    else if (r.status === 'Yellow') atsStats[r.atsPlatform].yellow++;
    else atsStats[r.atsPlatform].red++;
  });

  // HTTP status distribution
  const httpDist: Record<number, number> = {};
  results.forEach(r => {
    httpDist[r.httpStatus] = (httpDist[r.httpStatus] || 0) + 1;
  });

  // Display Summary Console
  console.log(`\n======================== SUMMARY ========================`);
  console.log(`Total Companies:        ${total}`);
  console.log(`🟢 Green:              ${green}`);
  console.log(`🟡 Yellow:             ${yellow}`);
  console.log(`🔴 Red:                ${red}`);
  console.log(`Success Rate:           ${successRate}%`);
  console.log(`Avg Extraction Time:    ${avgTime} ms`);
  console.log(`==========================================================\n`);

  // JSON Export
  const jsonPath = path.join(process.cwd(), 'scraper-health-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    metrics: { total, green, yellow, red, successRatePercent: parseFloat(successRate), averageTimeMs: parseInt(avgTime, 10) },
    results
  }, null, 2), 'utf8');

  // CSV Export
  const csvPath = path.join(process.cwd(), 'scraper-health-report.csv');
  const csvHeaders = ['Company', 'Career URL', 'ATS Platform', 'Plugin Name', 'Status', 'HTTP Status', 'Jobs Found', 'Execution Time (ms)', 'Last Error', 'Failure Reason', 'Suggested Fix'];
  const csvRows = results.map(r => [
    `"${r.companyName.replace(/"/g, '""')}"`,
    `"${r.careerUrl}"`,
    `"${r.atsPlatform}"`,
    `"${r.pluginName}"`,
    `"${r.status}"`,
    r.httpStatus,
    r.jobsFound,
    r.executionTimeMs,
    `"${(r.lastError || '').replace(/"/g, '""')}"`,
    `"${(r.failureReason || '').replace(/"/g, '""')}"`,
    `"${(r.suggestedFix || '').replace(/"/g, '""')}"`
  ].join(','));
  fs.writeFileSync(csvPath, [csvHeaders.join(','), ...csvRows].join('\n'), 'utf8');

  // MD Export
  const mdPath = path.join(process.cwd(), 'scraper-health-report.md');
  let mdContent = `# Scraper Health Validation Report\n\n`;
  mdContent += `Generated at: **${new Date().toLocaleString()}**\n\n`;
  
  mdContent += `## Executive Summary\n\n`;
  mdContent += `* **Total Companies Tested**: ${total}\n`;
  mdContent += `* **🟢 Green (Healthy)**: ${green}\n`;
  mdContent += `* **🟡 Yellow (Degraded)**: ${yellow}\n`;
  mdContent += `* **🔴 Red (Failed)**: ${red}\n`;
  mdContent += `* **Overall Health Score**: **${successRate}%**\n`;
  mdContent += `* **Average Extraction Duration**: ${avgTime} ms\n\n`;

  mdContent += `### ATS Coverage Statistics\n\n`;
  mdContent += `| ATS Platform | Total | Green | Yellow | Red | Success Rate |\n`;
  mdContent += `| --- | --- | --- | --- | --- | --- |\n`;
  Object.entries(atsStats).forEach(([ats, stat]) => {
    const rate = ((stat.green / stat.total) * 100).toFixed(1);
    mdContent += `| ${ats} | ${stat.total} | ${stat.green} | ${stat.yellow} | ${stat.red} | ${rate}% |\n`;
  });
  mdContent += `\n`;

  mdContent += `### HTTP Response Distribution\n\n`;
  mdContent += `| HTTP Status Code | Count |\n`;
  mdContent += `| --- | --- |\n`;
  Object.entries(httpDist).forEach(([code, count]) => {
    mdContent += `| ${code} | ${count} |\n`;
  });
  mdContent += `\n`;

  mdContent += `### Performance Metrics\n\n`;
  mdContent += `#### Slowest Scrapers\n`;
  slowest.forEach(s => {
    mdContent += `* **${s.companyName}** (${s.atsPlatform}): ${(s.executionTimeMs / 1000).toFixed(1)}s\n`;
  });
  mdContent += `\n#### Fastest Scrapers\n`;
  fastest.forEach(s => {
    mdContent += `* **${s.companyName}** (${s.atsPlatform}): ${s.executionTimeMs}ms\n`;
  });
  mdContent += `\n`;

  mdContent += `## Validation Result Tables\n\n`;

  // Green Table
  mdContent += `### 🟢 Green (Successful Scrapers)\n\n`;
  mdContent += `| Company | ATS | Career URL | Jobs Found | Time (ms) |\n`;
  mdContent += `| --- | --- | --- | --- | --- |\n`;
  results.filter(r => r.status === 'Green').forEach(r => {
    mdContent += `| ${r.companyName} | ${r.atsPlatform} | [Link](${r.careerUrl}) | ${r.jobsFound} | ${r.executionTimeMs} |\n`;
  });
  mdContent += `\n`;

  // Yellow Table
  mdContent += `### 🟡 Yellow (Degraded/Empty Scrapers)\n\n`;
  mdContent += `| Company | ATS | Career URL | Warning Reason | Jobs | Time (ms) |\n`;
  mdContent += `| --- | --- | --- | --- | --- | --- |\n`;
  results.filter(r => r.status === 'Yellow').forEach(r => {
    mdContent += `| ${r.companyName} | ${r.atsPlatform} | [Link](${r.careerUrl}) | ${r.failureReason} | ${r.jobsFound} | ${r.executionTimeMs} |\n`;
  });
  mdContent += `\n`;

  // Red Table
  mdContent += `### 🔴 Red (Failed Scrapers)\n\n`;
  mdContent += `| Company | ATS | Career URL | Error | HTTP | Suggested Fix |\n`;
  mdContent += `| --- | --- | --- | --- | --- | --- |\n`;
  results.filter(r => r.status === 'Red').forEach(r => {
    mdContent += `| ${r.companyName} | ${r.atsPlatform} | [Link](${r.careerUrl}) | ${r.failureReason} | ${r.httpStatus} | ${r.suggestedFix} |\n`;
  });
  mdContent += `\n`;

  fs.writeFileSync(mdPath, mdContent, 'utf8');

  console.log(`Reports successfully exported to:`);
  console.log(`  - scraper-health-report.json`);
  console.log(`  - scraper-health-report.csv`);
  console.log(`  - scraper-health-report.md`);
}

function getSuggestedFix(httpStatus: number, errMessage: string): string {
  if (httpStatus === 403) {
    return 'The website is blocking requests (Cloudflare or standard anti-bot protection). Try executing using the Playwright fallback or enable proxy support.';
  }
  if (httpStatus === 404) {
    return 'The career URL is returning Not Found. Perform a web search to verify if the company career portal URL has migrated.';
  }
  if (httpStatus === 429) {
    return 'Rate limit exceeded. Introduce larger staggering request intervals or switch scraper to API-based ingestion.';
  }
  if (errMessage.includes('timeout') || errMessage.includes('timed out')) {
    return 'Response took longer than the configured timeout limit. Try increasing the company config "scrape_timeout" parameter.';
  }
  if (errMessage.includes('selector') || errMessage.includes('parse')) {
    return 'The ATS system HTML templates have changed. Inspect the page markup and update the scraper parser selector paths.';
  }
  return 'Verify the company configurations endpoint URL and ensure detected_ats matches the target platform plugin.';
}

main().catch(err => {
  console.error('Fatal crash in scraper validation framework', err);
});
