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
    endpoint: company.api_endpoint,
    enabled: company.enabled
  });
});

// Sort ATS types alphabetically
const sortedAtsTypes = Object.keys(atsGroups).sort();

// Generate markdown report
let report = '# Company List by ATS Type\n\n';
report += `Total Companies: ${companies.length}\n`;
report += `Total ATS Types: ${sortedAtsTypes.length}\n\n`;

sortedAtsTypes.forEach(ats => {
  const companyList = atsGroups[ats].sort((a, b) => a.name.localeCompare(b.name));
  const enabledCount = companyList.filter(c => c.enabled).length;
  
  report += `## ${ats.toUpperCase()} (${companyList.length} companies, ${enabledCount} enabled)\n\n`;
  report += '| Company Name | API Endpoint | Status |\n';
  report += '|--------------|--------------|--------|\n';
  
  companyList.forEach(company => {
    const status = company.enabled ? '✅ Enabled' : '❌ Disabled';
    report += `| ${company.name} | ${company.endpoint} | ${status} |\n`;
  });
  
  report += '\n';
});

// Write to file
const outputPath = path.join(__dirname, '..', 'companies-by-ats.md');
fs.writeFileSync(outputPath, report, 'utf8');

console.log(`Generated ATS-organized list with ${companies.length} companies`);
console.log(`Output: ${outputPath}`);

// Print summary
console.log('\nATS Distribution:');
sortedAtsTypes.forEach(ats => {
  const count = atsGroups[ats].length;
  const enabled = atsGroups[ats].filter(c => c.enabled).length;
  console.log(`  ${ats.toUpperCase()}: ${count} companies (${enabled} enabled)`);
});