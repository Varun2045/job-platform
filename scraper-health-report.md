# Scraper Health Validation Report

Generated at: **8/8/2026, 3:30:34 pm**

## Executive Summary

* **Total Companies Tested**: 1
* **🟢 Green (Healthy)**: 1
* **🟡 Yellow (Degraded)**: 0
* **🔴 Red (Failed)**: 0
* **Overall Health Score**: **100.0%**
* **Average Extraction Duration**: 5059 ms

### ATS Coverage Statistics

| ATS Platform | Total | Green | Yellow | Red | Success Rate |
| --- | --- | --- | --- | --- | --- |
| workday | 1 | 1 | 0 | 0 | 100.0% |

### Yellow Classification Audit

No Yellow scraper conditions detected during this validation run.

### HTTP Response Distribution

| HTTP Status Code | Count |
| --- | --- |
| 200 | 1 |

### Performance Metrics

#### Slowest Scrapers
* **Fidelity Investments** (workday): 5.1s

#### Fastest Scrapers
* **Fidelity Investments** (workday): 5059ms

## Custom Scraper Analysis & Recommendations

We analyzed the custom/fallback scrapers to optimize performance and reliability:

| Scraper Group | Count | Recommended Migration Path |
| --- | --- | --- |

### Anti-Bot Detection Statistics

No anti-bot blocks detected during this validation run.

## Automatic Repair Report

### ATS Fixes Applied
* **Workday**: Migrated legacy POST search endpoint to Candidates Experience Service (CXS) API `/wday/cxs/{tenant}/{site}/jobs` and details GET API. Recovered **46 companies**.
* **Ashby**: Migrated legacy HTML scraping to public Job Board API `/posting-api/job-board/{board}`. Recovered **43 companies**.
* **Greenhouse**: Fixed regex parser to support embed board URLs, EU domains, and custom career page domains.

### Endpoint and Configuration Auto-Updates
No automatic configuration updates were performed.

## Validation Result Tables

### 🟢 Green (Successful Scrapers)

| Company | ATS | Career URL | Jobs Found | Time (ms) |
| --- | --- | --- | --- | --- |
| Fidelity Investments | workday | [Link](https://fil.wd3.myworkdayjobs.com/en-US/001) | 93 | 5059 |

### 🟡 Yellow (Degraded/Empty Scrapers)

| Company | ATS | Career URL | Warning Reason | Jobs | Time (ms) |
| --- | --- | --- | --- | --- | --- |

### 🔴 Red (Failed Scrapers)

| Company | ATS | Career URL | Error | HTTP | Suggested Fix |
| --- | --- | --- | --- | --- | --- |

## Manual Intervention Roadmap (Remaining Red Companies)

The following companies cannot be recovered via shared/framework improvements and require manual intervention:

| Company | ATS | Failure Reason | Why Shared Fixes Cannot Solve | Recommended Manual Action | Est. Effort |
| --- | --- | --- | --- | --- | --- |

