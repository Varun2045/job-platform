# Proxy Pool Management System

Complete proxy collection, validation, and rotation system for advanced scraping.

## Overview

This system implements a comprehensive proxy management pipeline:

1. **Collect** - Fetch proxies from multiple free sources
2. **Validate** - Test each proxy for connectivity, latency, and HTTPS support
3. **Manage** - Track healthy/unhealthy proxies with automatic recovery
4. **Integrate** - Seamlessly integrate with existing HttpClient
5. **Deploy** - Export validated proxies for Heroku Config Vars

## Architecture

```
ProxyScrape ─┐
GeoNode ─────┼──> Collector ──> Validator ──> ProxyPoolManager ──> HttpClient
FreeProxy ───┘                                        │
                                                     ↓
                                              Job Scraper
```

## Components

### 1. ProxyCollector
Fetches proxy candidates from multiple sources:
- **ProxyScrape** - Free proxy API
- **GeoNode** - Free proxy API with metadata
- **Free-Proxy-List** - Scrapes free proxy list

**Location:** `src/core/proxy/ProxyCollector.ts`

### 2. ProxyValidator
Tests each proxy for:
- HTTP/HTTPS connectivity
- Latency (must be < 5000ms)
- External IP verification
- Reliability

**Location:** `src/core/proxy/ProxyValidator.ts`

### 3. ProxyPoolManager
Manages proxy pool with:
- Round-robin rotation
- Failure tracking (max 3 failures)
- Automatic cooldown (5 minutes)
- Health recovery (re-test after cooldown)
- Latency-based selection

**Location:** `src/core/proxy/ProxyPoolManager.ts`

### 4. CLI Tool
Command-line interface for proxy management:
- `collect` - Fetch proxies
- `validate` - Test proxies
- `build-pool` - Create pool
- `export-heroku` - Export for deployment
- `full-pipeline` - Run complete pipeline

**Location:** `src/cli/proxyManager.ts`

## Usage

### Quick Start - Full Pipeline

Run the complete pipeline to collect, validate, and export proxies:

```bash
# Build the project first
npm run build

# Run full pipeline
node dist/cli/proxyManager.js full-pipeline

# Export top 20 proxies for Heroku
node dist/cli/proxyManager.js export-heroku 20
```

### Step-by-Step

#### Step 1: Collect Proxies
```bash
node dist/cli/proxyManager.js collect
```
Output: `proxy-candidates.json` (raw proxy list)

#### Step 2: Validate Proxies
```bash
node dist/cli/proxyManager.js validate
```
Output: `proxy-validation-results.json` (validation results)

#### Step 3: Build Pool
```bash
node dist/cli/proxyManager.js build-pool
```
Output: In-memory proxy pool with health tracking

#### Step 4: Export for Heroku
```bash
node dist/cli/proxyManager.js export-heroku 20
```
Output: `heroku-proxy-config.txt` (Heroku Config Vars format)

## Integration with HttpClient

### Automatic Proxy Rotation

The proxy pool automatically integrates with HttpClient:

```typescript
import { HttpClient } from './core/HttpClient.js';
import { ProxyPoolManager } from './core/proxy/ProxyPoolManager.js';

// Initialize proxy pool
const poolManager = ProxyPoolManager.getInstance();
HttpClient.configureAdvancedProxyPool(poolManager);

// Make request with proxy rotation
const httpClient = new HttpClient();
const response = await httpClient.get(
  'https://example.com/jobs',
  {},
  {
    useProxyRotation: true,
  }
);
```

### Manual Proxy Configuration

```typescript
// Simple string array (no health tracking)
HttpClient.configureProxyPool([
  'http://proxy1.example.com:8080',
  'http://proxy2.example.com:8080',
]);
```

## Deployment to Heroku

### Step 1: Run Full Pipeline
```bash
node dist/cli/proxyManager.js full-pipeline
```

### Step 2: Review Exported Config
```bash
cat heroku-proxy-config.txt
```

### Step 3: Add to Heroku Config Vars

**Option A: Using Heroku CLI**
```bash
# Add each proxy
heroku config:set PROXY_POOL_1=http://proxy1:8080 -a your-app-name
heroku config:set PROXY_POOL_2=http://proxy2:8080 -a your-app-name
heroku config:set PROXY_POOL_3=http://proxy3:8080 -a your-app-name
# ... add more as needed

# Set provider
heroku config:set PROXY_PROVIDER=custom -a your-app-name
```

**Option B: Using Heroku Dashboard**
1. Go to https://dashboard.heroku.com/apps/your-app-name/settings
2. Scroll to "Config Vars"
3. Click "Reveal Config Vars"
4. Click "Edit"
5. Add variables from `heroku-proxy-config.txt`

### Step 4: Restart App
```bash
heroku restart -a your-app-name
```

## Configuration

### ProxyCollector
No configuration needed - uses default sources.

### ProxyValidator
```typescript
const validator = ProxyValidator.getInstance({
  timeoutMs: 10000,      // 10 second timeout
  maxLatencyMs: 5000,    // 5 second max latency
  testEndpoint: 'http://ifconfig.me/ip',
  concurrency: 10,        // Test 10 proxies at once
});
```

### ProxyPoolManager
```typescript
const poolManager = ProxyPoolManager.getInstance({
  maxPoolSize: 100,              // Max proxies in pool
  cooldownMs: 300000,            // 5 minute cooldown
  maxFailures: 3,                // Max failures before unhealthy
  healthCheckIntervalMs: 600000, // 10 minute health check
});
```

## Proxy Pool Behavior

### Healthy Proxy Selection
- Prioritizes least recently used
- Sorts by latency (fastest first)
- Skips proxies on cooldown

### Failure Handling
- First failure: Increment failure count
- Second failure: Increment failure count
- Third failure: Mark unhealthy, start cooldown
- After cooldown: Re-test, recover if working

### Automatic Recovery
- Proxies on cooldown are automatically re-tested
- Successful test restores proxy to healthy status
- Failed test extends cooldown

## Performance

### Expected Results
- **Collection:** 1000-5000 raw proxies
- **Validation:** 50-200 working proxies (5-10% success rate)
- **Pool Size:** 50-200 healthy proxies
- **Latency:** 500-3000ms average

### Time Estimates
- Collection: 10-30 seconds
- Validation: 5-15 minutes (depends on concurrency)
- Total pipeline: 5-20 minutes

## Troubleshooting

### No Proxies Collected
- Check internet connection
- Verify proxy sources are accessible
- Try running collector individually

### Low Validation Success Rate
- Increase timeout in ProxyValidator config
- Increase maxLatencyMs threshold
- Try running validation again

### Proxies Not Working in Scraping
- Check if proxies support HTTPS
- Verify proxy URLs are correct
- Check HttpClient logs for specific errors
- Try manual testing with curl

### Heroku Config Vars Limit
- Heroku has a limit on Config Vars (typically 200)
- Export fewer proxies (10-20 instead of 50-100)
- Use highest quality proxies only

## Advanced Usage

### Custom Proxy Sources
Extend ProxyCollector to add custom sources:

```typescript
private async fetchFromCustomSource(): Promise<ProxyCandidate[]> {
  // Your custom logic
}
```

### Custom Validation Logic
Extend ProxyValidator for custom tests:

```typescript
private async customTest(proxy: ProxyCandidate): Promise<boolean> {
  // Your custom validation
}
```

### Programmatic Pool Management
```typescript
import { ProxyCollector, ProxyValidator, ProxyPoolManager } from './core/proxy/index.js';

const collector = ProxyCollector.getInstance();
const validator = ProxyValidator.getInstance();
const poolManager = ProxyPoolManager.getInstance();

// Collect
const proxies = await collector.collectFromAllSources();

// Validate
const results = await validator.validateProxies(proxies);

// Build pool
poolManager.initializePool(results);

// Use pool
const proxy = poolManager.getNextProxy();
```

## Files Created

- `src/core/proxy/ProxyCollector.ts` - Proxy collection logic
- `src/core/proxy/ProxyValidator.ts` - Proxy validation logic
- `src/core/proxy/ProxyPoolManager.ts` - Pool management logic
- `src/core/proxy/index.ts` - Export barrel
- `src/cli/proxyManager.ts` - CLI tool
- `PROXY_SYSTEM.md` - This documentation

## Integration with Existing Features

The proxy system works seamlessly with:
- ✅ Mobile App API Spoofing
- ✅ XML Sitemap Parsing
- ✅ Cloudflare Token Harvesting
- ✅ CAPTCHA Solving (if configured)
- ✅ Browser Fingerprint Evasion
- ✅ Cloudflare Turnstile Bypass

All features work together for maximum scraping success rate.
