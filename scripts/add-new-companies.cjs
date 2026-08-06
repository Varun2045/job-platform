const fs = require('fs');
const path = require('path');

const companies = require('../config/companies.json');

// New companies to add
const newCompanies = [
  {
    "id": "airbyte",
    "name": "Airbyte",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://boards.greenhouse.io/airbyte",
    "detected_ats": "greenhouse",
    "resume_profiles": []
  },
  {
    "id": "baseten",
    "name": "Baseten",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://jobs.ashbyhq.com/baseten",
    "detected_ats": "ashby",
    "resume_profiles": []
  },
  {
    "id": "box",
    "name": "Box",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://job-boards.greenhouse.io/boxinc",
    "detected_ats": "greenhouse",
    "resume_profiles": []
  },
  {
    "id": "clickhouse",
    "name": "ClickHouse",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://job-boards.greenhouse.io/clickhouse",
    "detected_ats": "greenhouse",
    "resume_profiles": []
  },
  {
    "id": "dagster-labs",
    "name": "Dagster Labs",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://job-boards.greenhouse.io/dagsterlabs",
    "detected_ats": "greenhouse",
    "resume_profiles": []
  },
  {
    "id": "headlands-tech",
    "name": "Headlands Tech",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://job-boards.greenhouse.io/headlandstechnologiesllc",
    "detected_ats": "greenhouse",
    "resume_profiles": []
  },
  {
    "id": "ideogram",
    "name": "Ideogram",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://jobs.ashbyhq.com/ideogram",
    "detected_ats": "ashby",
    "resume_profiles": []
  },
  {
    "id": "infra-market",
    "name": "Infra.Market",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://infra.market/careers",
    "detected_ats": "custom",
    "resume_profiles": []
  },
  {
    "id": "luma-ai",
    "name": "Luma AI",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://boards.greenhouse.io/lumaai",
    "detected_ats": "greenhouse",
    "resume_profiles": []
  },
  {
    "id": "m2p-fintech",
    "name": "M2P Fintech",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://m2pfintech.com/careers",
    "detected_ats": "custom",
    "resume_profiles": []
  },
  {
    "id": "old-mission-capital",
    "name": "Old Mission Capital",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://boards.greenhouse.io/oldmissioncapital",
    "detected_ats": "greenhouse",
    "resume_profiles": []
  },
  {
    "id": "photoroom",
    "name": "Photoroom",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://jobs.ashbyhq.com/photoroom",
    "detected_ats": "ashby",
    "resume_profiles": []
  },
  {
    "id": "pine-labs",
    "name": "Pine Labs",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://www.pinelabs.com/careers",
    "detected_ats": "custom",
    "resume_profiles": []
  },
  {
    "id": "policybazaar",
    "name": "PolicyBazaar",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://www.policybazaar.com/careers",
    "detected_ats": "custom",
    "resume_profiles": []
  },
  {
    "id": "quadeye",
    "name": "Quadeye",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://quadeye.com/careers",
    "detected_ats": "custom",
    "resume_profiles": []
  },
  {
    "id": "rapido",
    "name": "Rapido",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://rapido.bike/careers",
    "detected_ats": "custom",
    "resume_profiles": []
  },
  {
    "id": "replicate",
    "name": "Replicate",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://jobs.ashbyhq.com/replicate",
    "detected_ats": "ashby",
    "resume_profiles": []
  },
  {
    "id": "superhuman",
    "name": "Superhuman",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://jobs.ashbyhq.com/superhuman",
    "detected_ats": "ashby",
    "resume_profiles": []
  },
  {
    "id": "tata-digital",
    "name": "Tata Digital",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://www.tatadigital.com/careers",
    "detected_ats": "custom",
    "resume_profiles": []
  },
  {
    "id": "turso",
    "name": "Turso",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://jobs.ashbyhq.com/turso",
    "detected_ats": "ashby",
    "resume_profiles": []
  },
  {
    "id": "vast-data",
    "name": "Vast Data",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://boards.greenhouse.io/vastdata",
    "detected_ats": "greenhouse",
    "resume_profiles": []
  },
  {
    "id": "vellum",
    "name": "Vellum",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://jobs.ashbyhq.com/vellum",
    "detected_ats": "ashby",
    "resume_profiles": []
  },
  {
    "id": "workday",
    "name": "Workday",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://workday.wd5.myworkdayjobs.com/Workday",
    "detected_ats": "workday",
    "resume_profiles": []
  }
];

// Check for duplicates and add new companies
let addedCount = 0;
let skippedCount = 0;
const existingIds = new Set(companies.map(c => c.id));

newCompanies.forEach(newCompany => {
  if (existingIds.has(newCompany.id)) {
    console.log(`SKIPPED: ${newCompany.name} already exists`);
    skippedCount++;
  } else {
    companies.push(newCompany);
    console.log(`ADDED: ${newCompany.name}`);
    addedCount++;
  }
});

// Sort companies alphabetically
companies.sort((a, b) => a.name.localeCompare(b.name));

// Write back to file
const filePath = path.join(__dirname, '..', 'config', 'companies.json');
fs.writeFileSync(filePath, JSON.stringify(companies, null, 2), 'utf8');

console.log(`\nSummary: Added ${addedCount} companies, Skipped ${skippedCount} duplicates`);
console.log(`Total companies: ${companies.length}`);