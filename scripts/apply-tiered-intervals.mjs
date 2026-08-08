#!/usr/bin/env node

/**
 * Tiered Scraping Interval System
 * 
 * Tier 1 (60 min): Top priority companies - Google, Amazon, Apple, Microsoft, Meta, Netflix, Stripe, OpenAI, Anthropic, Uber, Airbnb, Spotify, Dropbox
 * Tier 2 (90 min): High priority - Salesforce, Adobe, Oracle, IBM, Cisco, VMware, Intel, AMD, LinkedIn, GitHub, Atlassian
 * Tier 3 (120 min): Medium priority - Most other tech companies, startups, unicorns, mid-sized companies
 * Tier 4 (180 min): Low priority - Consulting firms, traditional companies, companies with low job volume
 * Tier 5 (240 min): Maintenance - Companies that rarely post, backup checks
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tier 1: Top priority (60 minutes)
const tier1Companies = [
  'google', 'amazon', 'apple', 'microsoft', 'meta', 'netflix', 'stripe', 
  'openai', 'anthropic', 'uber', 'airbnb', 'spotify', 'dropbox', 'nvidia',
  'tesla', 'bytedance', 'tencent', 'alibaba', 'salesforce', 'adobe'
];

// Tier 2: High priority (90 minutes)
const tier2Companies = [
  'oracle', 'ibm', 'cisco', 'vmware', 'intel', 'amd', 'linkedin', 'github',
  'atlassian', 'slack', 'zoom', 'twilio', 'mongodb', 'databricks', 'snowflake',
  'confluent', 'cockroach-labs', 'redis', 'elastic', 'hashicorp', 'gitlab',
  'jetbrains', 'android', 'kubernetes', 'apache', 'linux-foundation'
];

// Tier 4: Low priority (180 minutes) - consulting, traditional
const tier4Companies = [
  'accenture', 'deloitte', 'pwc', 'kpmg', 'ey', 'bain-company', 'bcg',
  'mckinsey', 'booz-allen-hamilton', 'capgemini', 'infosys', 'tcs', 'wipro',
  'hcl', 'tech-mahindra', 'l-t-infotech', 'mindtree', 'mphasis'
];

// Tier 5: Maintenance (240 minutes) - rarely posting
const tier5Companies = [
  'legacy-company', 'backup-check', 'maintenance-only'
];

function getTierInterval(companyName) {
  const normalizedName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  if (tier1Companies.includes(normalizedName)) {
    return 60; // Tier 1
  }
  
  if (tier2Companies.includes(normalizedName)) {
    return 90; // Tier 2
  }
  
  if (tier4Companies.includes(normalizedName)) {
    return 180; // Tier 4
  }
  
  if (tier5Companies.includes(normalizedName)) {
    return 240; // Tier 5
  }
  
  return 120; // Tier 3 (default)
}

function updateCompaniesWithTiers() {
  const companiesPath = path.join(__dirname, '..', 'config', 'companies.json');
  
  if (!fs.existsSync(companiesPath)) {
    console.error('companies.json not found at:', companiesPath);
    process.exit(1);
  }
  
  const companiesData = fs.readFileSync(companiesPath, 'utf8');
  const companies = JSON.parse(companiesData);
  
  const stats = {
    tier1: 0,
    tier2: 0,
    tier3: 0,
    tier4: 0,
    tier5: 0,
    total: companies.length
  };
  
  const updatedCompanies = companies.map(company => {
    const newInterval = getTierInterval(company.name);
    const oldInterval = company.interval_minutes || 60;
    
    company.interval_minutes = newInterval;
    
    // Update priority based on tier
    if (newInterval === 60) {
      company.priority = 1;
      stats.tier1++;
    } else if (newInterval === 90) {
      company.priority = 2;
      stats.tier2++;
    } else if (newInterval === 120) {
      company.priority = 3;
      stats.tier3++;
    } else if (newInterval === 180) {
      company.priority = 4;
      stats.tier4++;
    } else {
      company.priority = 5;
      stats.tier5++;
    }
    
    if (oldInterval !== newInterval) {
      console.log(`Updated ${company.name}: ${oldInterval}min → ${newInterval}min (Tier ${company.priority})`);
    }
    
    return company;
  });
  
  // Sort by priority (lower priority number = higher priority)
  updatedCompanies.sort((a, b) => a.priority - b.priority);
  
  // Write updated companies.json
  fs.writeFileSync(companiesPath, JSON.stringify(updatedCompanies, null, 2), 'utf8');
  
  console.log('\n=== Tiered Scraping Statistics ===');
  console.log(`Tier 1 (60 min): ${stats.tier1} companies`);
  console.log(`Tier 2 (90 min): ${stats.tier2} companies`);
  console.log(`Tier 3 (120 min): ${stats.tier3} companies`);
  console.log(`Tier 4 (180 min): ${stats.tier4} companies`);
  console.log(`Tier 5 (240 min): ${stats.tier5} companies`);
  console.log(`Total: ${stats.total} companies`);
  console.log('\n✅ companies.json updated successfully!');
}

// Run the update
updateCompaniesWithTiers();
