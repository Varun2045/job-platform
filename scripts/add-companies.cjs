const fs = require('fs');
const path = require('path');

const companies = require('../config/companies.json');

const newCompanies = [
  {
    "id": "american-express",
    "name": "American Express",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://aexp.eightfold.ai/careers",
    "detected_ats": "eightfold",
    "resume_profiles": []
  },
  {
    "id": "american-airlines-gcc",
    "name": "American Airlines GCC",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://jobs.aa.com/group/bangalore-india/jobs",
    "detected_ats": "taleo",
    "resume_profiles": []
  },
  {
    "id": "barclays",
    "name": "Barclays",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://home.barclays/careers/bangalore",
    "detected_ats": "barclays",
    "resume_profiles": []
  },
  {
    "id": "deutsche-bank",
    "name": "Deutsche Bank",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://careers.db.com/india",
    "detected_ats": "db",
    "resume_profiles": []
  },
  {
    "id": "fidelity-investments",
    "name": "Fidelity Investments",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://jobs.fidelity.com/search",
    "detected_ats": "fidelity",
    "resume_profiles": []
  },
  {
    "id": "lowes-india",
    "name": "Lowe's India",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://lowes.com/careers/india",
    "detected_ats": "lowes",
    "resume_profiles": []
  },
  {
    "id": "tesco-bengaluru",
    "name": "Tesco Bengaluru",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://www.tescoplcareers.com/india/bangalore",
    "detected_ats": "tesco",
    "resume_profiles": []
  },
  {
    "id": "ubs",
    "name": "UBS",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://ubs.com/careers/india",
    "detected_ats": "ubs",
    "resume_profiles": []
  },
  {
    "id": "warner-bros-discovery",
    "name": "Warner Bros. Discovery",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://wbd.com/careers/india",
    "detected_ats": "wbd",
    "resume_profiles": []
  },
  {
    "id": "wells-fargo",
    "name": "Wells Fargo",
    "enabled": true,
    "priority": 1,
    "interval_minutes": 60,
    "api_endpoint": "https://careers.wellsfargo.com/india",
    "detected_ats": "wellsfargo",
    "resume_profiles": []
  }
];

// Combine and sort alphabetically
const allCompanies = [...companies, ...newCompanies].sort((a, b) => a.name.localeCompare(b.name));

// Write back to file
const filePath = path.join(__dirname, '..', 'config', 'companies.json');
fs.writeFileSync(filePath, JSON.stringify(allCompanies, null, 2), 'utf8');

console.log(`Added ${newCompanies.length} companies. Total: ${allCompanies.length}`);