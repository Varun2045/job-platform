const fs = require('fs');
const path = require('path');

const companies = require('../config/companies.json');

// Sort companies alphabetically
const sortedCompanies = companies.sort((a, b) => a.name.localeCompare(b.name));

// Generate markdown table
let table = 'Company Name | API Endpoint | ATS Type\n';
table += '--- | --- | ---\n';

sortedCompanies.forEach(company => {
  table += `${company.name} | ${company.api_endpoint} | ${company.detected_ats}\n`;
});

// Write to file
const outputPath = path.join(__dirname, '..', 'companies-table.txt');
fs.writeFileSync(outputPath, table, 'utf8');

console.log(`Generated companies table with ${sortedCompanies.length} companies`);
console.log(`Output: ${outputPath}`);