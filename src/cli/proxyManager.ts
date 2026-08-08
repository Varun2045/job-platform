#!/usr/bin/env node

import { ProxyCollector } from '../core/proxy/ProxyCollector.js';
import { ProxyValidator } from '../core/proxy/ProxyValidator.js';
import { ProxyPoolManager } from '../core/proxy/ProxyPoolManager.js';
import { Logger } from '../core/Logger.js';
import { config } from '../config/config.js';
import fs from 'fs';
import path from 'path';

/**
 * CLI Tool for Proxy Management
 * 
 * Usage:
 * node dist/cli/proxyManager.js collect
 * node dist/cli/proxyManager.js validate
 * node dist/cli/proxyManager.js build-pool
 * node dist/cli/proxyManager.js export-heroku
 * node dist/cli/proxyManager.js full-pipeline
 */

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'collect':
      await collectProxies();
      break;
    case 'validate':
      await validateProxies();
      break;
    case 'build-pool':
      await buildPool();
      break;
    case 'export-heroku':
      const count = process.argv[3] ? parseInt(process.argv[3], 10) : 10;
      await exportForHeroku(count);
      break;
    case 'full-pipeline':
      await fullPipeline();
      break;
    default:
      printUsage();
  }
  process.exit(0);
}

function printUsage() {
  console.log(`
Proxy Manager CLI

Usage:
  node dist/cli/proxyManager.js collect        - Collect proxies from all sources
  node dist/cli/proxyManager.js validate       - Validate collected proxies
  node dist/cli/proxyManager.js build-pool     - Build proxy pool from validated proxies
  node dist/cli/proxyManager.js export-heroku  - Export pool for Heroku Config Vars
  node dist/cli/proxyManager.js full-pipeline  - Run complete pipeline (collect → validate → build → export)

Examples:
  node dist/cli/proxyManager.js full-pipeline
  node dist/cli/proxyManager.js export-heroku 20
  `);
}

async function collectProxies() {
  console.log('\n=== Phase 1: Collect Proxies ===\n');
  
  const collector = ProxyCollector.getInstance();
  const proxies = await collector.collectFromAllSources();
  
  const outputFile = path.join(process.cwd(), 'proxy-candidates.json');
  fs.writeFileSync(outputFile, JSON.stringify(proxies, null, 2));
  
  console.log(`\n✓ Collected ${proxies.length} proxy candidates`);
  console.log(`✓ Saved to: ${outputFile}\n`);
}

async function validateProxies() {
  console.log('\n=== Phase 2: Validate Proxies ===\n');
  
  // Load collected proxies
  const inputFile = path.join(process.cwd(), 'proxy-candidates.json');
  if (!fs.existsSync(inputFile)) {
    console.error('Error: proxy-candidates.json not found. Run "collect" first.');
    process.exit(1);
  }
  
  const proxies = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  
  // Limit validation candidates count for efficiency (default 150)
  const limit = process.env.PROXY_VALIDATION_LIMIT ? parseInt(process.env.PROXY_VALIDATION_LIMIT, 10) : 150;
  const slicedProxies = proxies.slice(0, limit);
  console.log(`Loaded ${proxies.length} proxy candidates. Slicing to first ${slicedProxies.length} candidates for validation.\n`);
  
  const validator = ProxyValidator.getInstance({
    timeoutMs: 15000,
    maxLatencyMs: 10000,
    concurrency: 5,
  });
  
  const results = await validator.validateProxies(slicedProxies);
  const stats = validator.getStatistics(results);
  
  // Save validation results
  const outputFile = path.join(process.cwd(), 'proxy-validation-results.json');
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  
  console.log('\n=== Validation Statistics ===');
  console.log(`Total: ${stats.total}`);
  console.log(`Working: ${stats.working}`);
  console.log(`Failed: ${stats.failed}`);
  console.log(`Average Latency: ${stats.avgLatencyMs}ms`);
  console.log(`HTTPS Support: ${stats.httpsSupportCount}`);
  console.log(`\n✓ Results saved to: ${outputFile}\n`);
}

async function buildPool() {
  console.log('\n=== Phase 3: Build Proxy Pool ===\n');
  
  // Load validation results
  const inputFile = path.join(process.cwd(), 'proxy-validation-results.json');
  if (!fs.existsSync(inputFile)) {
    console.error('Error: proxy-validation-results.json not found. Run "validate" first.');
    process.exit(1);
  }
  
  const results = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  console.log(`Loaded ${results.length} validation results\n`);
  
  const poolManager = ProxyPoolManager.getInstance({
    maxPoolSize: 100,
    cooldownMs: 300000,
    maxFailures: 3,
    healthCheckIntervalMs: 600000,
  });
  
  poolManager.initializePool(results);
  
  const stats = poolManager.getPoolStats();
  console.log('\n=== Pool Statistics ===');
  console.log(`Total: ${stats.total}`);
  console.log(`Healthy: ${stats.healthy}`);
  console.log(`Unhealthy: ${stats.unhealthy}`);
  console.log(`On Cooldown: ${stats.onCooldown}`);
  console.log(`Average Latency: ${stats.avgLatencyMs}ms`);
  console.log(`\n✓ Pool built successfully\n`);
}

async function exportForHeroku(maxProxies: number = 20) {
  console.log('\n=== Phase 5: Export for Heroku ===\n');
  
  // Load validation results to initialize the pool before exporting
  const inputFile = path.join(process.cwd(), 'proxy-validation-results.json');
  let results = [];
  if (fs.existsSync(inputFile)) {
    results = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  }
  
  const poolManager = ProxyPoolManager.getInstance();
  if (results.length > 0) {
    poolManager.initializePool(results);
  }
  const proxies = poolManager.exportForHeroku(maxProxies);
  
  console.log(`Exporting ${proxies.length} proxies for Heroku\n`);
  
  console.log('=== Heroku Config Vars ===\n');
  for (let i = 0; i < proxies.length; i++) {
    console.log(`PROXY_POOL_${i + 1}=${proxies[i]}`);
  }
  
  console.log('\nPROXY_PROVIDER=custom\n');
  
  // Save to file
  const outputFile = path.join(process.cwd(), 'heroku-proxy-config.txt');
  const content = proxies.map((p, i) => `PROXY_POOL_${i + 1}=${p}`).join('\n') + '\nPROXY_PROVIDER=custom\n';
  fs.writeFileSync(outputFile, content);
  
  console.log(`\n✓ Export saved to: ${outputFile}`);
  console.log('\nTo add to Heroku, run:');
  console.log('heroku config:set PROXY_POOL_1=http://... -a your-app-name');
  console.log('heroku config:set PROXY_POOL_2=http://... -a your-app-name');
  console.log('...');
  console.log('heroku config:set PROXY_PROVIDER=custom -a your-app-name\n');
}

async function fullPipeline() {
  console.log('\n=== Full Proxy Pipeline ===\n');
  console.log('Phase 1: Collect\n');
  await collectProxies();
  
  console.log('\nPhase 2: Validate\n');
  await validateProxies();
  
  console.log('\nPhase 3: Build Pool\n');
  await buildPool();
  
  console.log('\nPhase 4: Export for Heroku\n');
  const maxProxies = parseInt(process.argv[3]) || 20;
  await exportForHeroku(maxProxies);
  
  console.log('\n=== Pipeline Complete ===\n');
  console.log('Next steps:');
  console.log('1. Review heroku-proxy-config.txt');
  console.log('2. Add proxies to Heroku Config Vars');
  console.log('3. Restart your Heroku app\n');
}

main().catch(error => {
  Logger.error('Proxy Manager CLI failed:', error);
  process.exit(1);
});