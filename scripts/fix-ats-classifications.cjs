const fs = require('fs');
const path = require('path');

const companies = require('../config/companies.json');

// ATS detection patterns
const atsPatterns = {
  workable: {
    pattern: /apply\.workable\.com/i,
    companies: []
  },
  smartrecruiters: {
    pattern: /smartrecruiters\.com/i,
    companies: []
  },
  bamboohr: {
    pattern: /\.bamboohr\.com/i,
    companies: []
  },
  greenhouse: {
    pattern: /boards\.greenhouse\.io|job-boards\.greenhouse\.io/i,
    companies: []
  },
  lever: {
    pattern: /jobs\.lever\.co/i,
    companies: []
  },
  ashby: {
    pattern: /jobs\.ashbyhq\.com/i,
    companies: []
  },
  workday: {
    pattern: /\.myworkdayjobs\.com/i,
    companies: []
  },
  oraclecloud: {
    pattern: /fa\.oraclecloud\.com/i,
    companies: []
  },
  taleo: {
    pattern: /taleo\.net/i,
    companies: []
  },
  eightfold: {
    pattern: /eightfold\.ai/i,
    companies: []
  },
  phenom: {
    pattern: /phenom\.com/i,
    companies: []
  }
};

let updatedCount = 0;

companies.forEach(company => {
  const endpoint = company.api_endpoint.toLowerCase();
  let detectedAts = null;

  // Check each ATS pattern
  for (const [atsName, atsInfo] of Object.entries(atsPatterns)) {
    if (atsInfo.pattern.test(endpoint)) {
      detectedAts = atsName;
      atsInfo.companies.push(company.name);
      break;
    }
  }

  // Update if we found a better ATS classification
  if (detectedAts && company.detected_ats !== detectedAts) {
    console.log(`UPDATE: ${company.name} - ${company.detected_ats} → ${detectedAts}`);
    console.log(`  Endpoint: ${company.api_endpoint}`);
    company.detected_ats = detectedAts;
    updatedCount++;
  }
});

// Write back to file
const filePath = path.join(__dirname, '..', 'config', 'companies.json');
fs.writeFileSync(filePath, JSON.stringify(companies, null, 2), 'utf8');

console.log(`\nUpdated ${updatedCount} companies with correct ATS classifications`);

// Print summary
console.log('\nCompanies by detected ATS:');
Object.entries(atsPatterns).forEach(([atsName, atsInfo]) => {
  if (atsInfo.companies.length > 0) {
    console.log(`\n${atsName.toUpperCase()} (${atsInfo.companies.length}):`);
    atsInfo.companies.forEach(name => console.log(`  - ${name}`));
  }
});