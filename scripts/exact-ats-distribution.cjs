const fs = require('fs');
const path = require('path');

const companies = require('../config/companies.json');

// Group companies by ATS type
const atsGroups = {};

companies.forEach(company => {
  const ats = company.detected_ats || 'unknown';
  if (!atsGroups[ats]) {
    atsGroups[ats] = [];
  }
  atsGroups[ats].push({
    name: company.name,
    enabled: company.enabled
  });
});

// Sort by count (descending) then alphabetically
const sortedAtsTypes = Object.entries(atsGroups).sort((a, b) => {
  if (b[1].length !== a[1].length) {
    return b[1].length - a[1].length;
  }
  return a[0].localeCompare(b[0]);
});

// Generate summary
console.log('='.repeat(60));
console.log(`EXACT ATS DISTRIBUTION - ${companies.length} COMPANIES`);
console.log('='.repeat(60));
console.log('');

let totalEnabled = 0;
let totalCompanies = 0;

sortedAtsTypes.forEach(([ats, companyList]) => {
  const enabledCount = companyList.filter(c => c.enabled).length;
  const percentage = ((companyList.length / companies.length) * 100).toFixed(1);
  
  console.log(`${ats.toUpperCase().padEnd(20)} ${String(companyList.length).padStart(3)} companies (${percentage}%) - ${enabledCount} enabled`);
  
  totalEnabled += enabledCount;
  totalCompanies += companyList.length;
});

console.log('');
console.log('='.repeat(60));
console.log(`TOTAL: ${totalCompanies} companies, ${totalEnabled} enabled`);
console.log('='.repeat(60));

// Generate detailed breakdown
let report = `# Exact ATS Distribution - ${companies.length} Companies\n\n`;
report += `| ATS Type | Companies | % of Total | Enabled |\n`;
report += `|----------|-----------|------------|--------|\n`;

sortedAtsTypes.forEach(([ats, companyList]) => {
  const enabledCount = companyList.filter(c => c.enabled).length;
  const percentage = ((companyList.length / companies.length) * 100).toFixed(1);
  report += `| ${ats.toUpperCase()} | ${companyList.length} | ${percentage}% | ${enabledCount} |\n`;
});

// Write to file
const outputPath = path.join(__dirname, '..', 'exact-ats-distribution.md');
fs.writeFileSync(outputPath, report, 'utf8');

console.log(`\nDetailed report saved to: ${outputPath}`);