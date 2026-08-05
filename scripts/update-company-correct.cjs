const fs = require('fs');
const path = require('path');

const companies = require('../config/companies.json');

// Correct mappings based on official career portals
const corrections = {
  'american-express': {
    api_endpoint: 'https://www.americanexpress.com/en-us/careers',
    detected_ats: 'eightfold'
  },
  'wells-fargo': {
    api_endpoint: 'https://www.wellsfargojobs.com/en',
    detected_ats: 'phenom'
  },
  'barclays': {
    api_endpoint: 'https://search.jobs.barclays',
    detected_ats: 'phenom'
  },
  'ubs': {
    api_endpoint: 'https://jobs.ubs.com',
    detected_ats: 'avature'
  },
  'deutsche-bank': {
    api_endpoint: 'https://careers.db.com',
    detected_ats: 'avature'
  },
  'fidelity-investments': {
    api_endpoint: 'https://jobs.fidelity.com',
    detected_ats: 'phenom'
  },
  'american-airlines-gcc': {
    api_endpoint: 'https://jobs.aa.com',
    detected_ats: 'workday'
  },
  'lowes-india': {
    api_endpoint: 'https://talent.lowes.com',
    detected_ats: 'phenom'
  },
  'warner-bros-discovery': {
    api_endpoint: 'https://careers.wbd.com',
    detected_ats: 'workday'
  },
  'tesco-bengaluru': {
    api_endpoint: 'https://apply.tesco-careers.com',
    detected_ats: 'oraclecloud'
  }
};

let updatedCount = 0;

companies.forEach(company => {
  const correction = corrections[company.id];
  if (correction) {
    company.api_endpoint = correction.api_endpoint;
    company.detected_ats = correction.detected_ats;
    updatedCount++;
    console.log(`Updated: ${company.name} -> ${correction.api_endpoint} (${correction.detected_ats})`);
  }
});

// Write back to file
const filePath = path.join(__dirname, '..', 'config', 'companies.json');
fs.writeFileSync(filePath, JSON.stringify(companies, null, 2), 'utf8');

console.log(`\nUpdated ${updatedCount} companies with correct career portals and ATS types.`);