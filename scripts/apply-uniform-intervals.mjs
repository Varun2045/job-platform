#!/usr/bin/env node

/**
 * Uniform Scraping Interval System
 * 
 * All companies scrape X times per day with equal spacing across Y hours
 * Example: 3 times per day over 24 hours = every 8 hours
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default configuration
const DEFAULT_SCRAPES_PER_DAY = 3;
const DEFAULT_HOURS_SPAN = 24;

function calculateUniformInterval(scrapesPerDay, hoursSpan) {
  if (scrapesPerDay <= 0) {
    throw new Error('SCRAPES_PER_DAY must be greater than 0');
  }
  if (hoursSpan <= 0) {
    throw new Error('HOURS_SPAN must be greater than 0');
  }
  
  const totalMinutes = hoursSpan * 60;
  const intervalMinutes = totalMinutes / scrapesPerDay;
  
  return Math.round(intervalMinutes);
}

function updateCompaniesWithUniformIntervals(scrapesPerDay, hoursSpan) {
  const companiesPath = path.join(__dirname, '..', 'config', 'companies.json');
  
  if (!fs.existsSync(companiesPath)) {
    console.error('companies.json not found at:', companiesPath);
    process.exit(1);
  }
  
  const companiesData = fs.readFileSync(companiesPath, 'utf8');
  const companies = JSON.parse(companiesData);
  
  const intervalMinutes = calculateUniformInterval(scrapesPerDay, hoursSpan);
  
  console.log(`Configuration:`);
  console.log(`- Scrapes per day: ${scrapesPerDay}`);
  console.log(`- Hours span: ${hoursSpan}`);
  console.log(`- Interval: ${intervalMinutes} minutes`);
  console.log('');
  
  const stats = {
    updated: 0,
    total: companies.length
  };
  
  const updatedCompanies = companies.map(company => {
    const oldInterval = company.interval_minutes || 60;
    
    company.interval_minutes = intervalMinutes;
    company.priority = 1; // All companies have same priority for uniform scraping
    
    if (oldInterval !== intervalMinutes) {
      console.log(`Updated ${company.name}: ${oldInterval}min → ${intervalMinutes}min`);
      stats.updated++;
    }
    
    return company;
  });
  
  // Sort by name for consistency
  updatedCompanies.sort((a, b) => a.name.localeCompare(b.name));
  
  // Write updated companies.json
  fs.writeFileSync(companiesPath, JSON.stringify(updatedCompanies, null, 2), 'utf8');
  
  console.log('\n=== Uniform Scraping Statistics ===');
  console.log(`Updated: ${stats.updated} companies`);
  console.log(`Total: ${stats.total} companies`);
  console.log(`New interval: ${intervalMinutes} minutes (${scrapesPerDay}x per day over ${hoursSpan} hours)`);
  console.log('\n✅ companies.json updated successfully!');
}

// Run the update
const args = process.argv.slice(2);
const scrapesPerDay = args[0] ? parseInt(args[0], 10) : DEFAULT_SCRAPES_PER_DAY;
const hoursSpan = args[1] ? parseInt(args[1], 10) : DEFAULT_HOURS_SPAN;

updateCompaniesWithUniformIntervals(scrapesPerDay, hoursSpan);
