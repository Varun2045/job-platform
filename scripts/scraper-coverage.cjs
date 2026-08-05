const fs = require('fs');
const path = require('path');

const companies = require('../config/companies.json');

// All implemented ATS scrapers
const implementedScrapers = [
  'greenhouse', 'workday', 'ashby', 'lever', 'taleo', 'smartrecruiters',
  'workable', 'oraclecloud', 'phenom', 'eightfold', 'avature', 'darwinbox', 'bamboohr',
  'google', 'microsoft', 'amazon', 'apple', 'meta', 'custom' // custom uses fallback scraper
];

let withScraper = 0;
let withoutScraper = 0;
const companiesWithoutScraper = [];
const companiesWithScraper = [];

companies.forEach(company => {
  const hasScraper = implementedScrapers.includes(company.detected_ats);
  if (hasScraper) {
    withScraper++;
    companiesWithScraper.push({
      name: company.name,
      ats: company.detected_ats,
      enabled: company.enabled
    });
  } else {
    withoutScraper++;
    companiesWithoutScraper.push({
      name: company.name,
      ats: company.detected_ats,
      enabled: company.enabled
    });
  }
});

console.log('='.repeat(60));
console.log('SCRAPER COVERAGE REPORT - 392 COMPANIES');
console.log('='.repeat(60));
console.log('');
console.log(`✅ WITH SCRAPER: ${withScraper} companies (${((withScraper/392)*100).toFixed(1)}%)`);
console.log(`❌ WITHOUT SCRAPER: ${withoutScraper} companies (${((withoutScraper/392)*100).toFixed(1)}%)`);
console.log('');

// Group companies without scraper by ATS type
const atsWithoutScraper = {};
companiesWithoutScraper.forEach(company => {
  const ats = company.detected_ats || 'unknown';
  if (!atsWithoutScraper[ats]) {
    atsWithoutScraper[ats] = [];
  }
  atsWithoutScraper[ats].push(company.name);
});

console.log('COMPANIES WITHOUT SCRAPERS (BY ATS TYPE):');
console.log('='.repeat(60));
Object.entries(atsWithoutScraper).sort((a, b) => b[1].length - a[1].length).forEach(([ats, companyList]) => {
  console.log(`\n${ats.toUpperCase()} (${companyList.length} companies):`);
  companyList.forEach(name => console.log(`  - ${name}`));
});

console.log('');
console.log('='.repeat(60));
console.log('IMPLEMENTED ATS SCRAPERS:');
console.log('='.repeat(60));
implementedScrapers.forEach(ats => console.log(`  ✅ ${ats.toUpperCase()}`));