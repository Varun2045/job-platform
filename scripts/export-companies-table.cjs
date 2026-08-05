const fs = require('fs');
const path = require('path');

const companies = require('../config/companies.json');
const sorted = companies.sort((a, b) => a.name.localeCompare(b.name));

console.log('Company Name | API Endpoint | ATS Type');
console.log('--- | --- | ---');

sorted.forEach(c => {
  console.log(`${c.name} | ${c.api_endpoint || 'N/A'} | ${c.detected_ats || 'N/A'}`);
});

// Also save to file
const tableContent = sorted.map(c => 
  `${c.name} | ${c.api_endpoint || 'N/A'} | ${c.detected_ats || 'N/A'}`
).join('\n');

const header = 'Company Name | API Endpoint | ATS Type\n--- | --- | ---\n';
fs.writeFileSync(path.join(__dirname, '..', 'companies-table.txt'), header + tableContent);
console.log('\nTable saved to companies-table.txt');