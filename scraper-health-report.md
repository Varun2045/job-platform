# Scraper Health Validation Report

Generated at: **8/8/2026, 4:26:58 pm**

## Executive Summary

* **Total Companies Tested**: 369
* **🟢 GREEN (Healthy)**: 246
* **🟡 YELLOW (Degraded)**: 4
* **🔴 RED (Failed)**: 2
* **🛡️ EXTERNAL_BLOCK (Protected)**: 117
* **Overall Health Score**: **66.7%**
* **Average Extraction Duration**: 4090 ms

### ATS Coverage Statistics

| ATS Platform | Total | Green | Yellow | Red | External Block | Success Rate |
| --- | --- | --- | --- | --- | --- | --- |
| greenhouse | 50 | 46 | 3 | 0 | 1 | 92.0% |
| ashby | 42 | 29 | 0 | 0 | 13 | 69.0% |
| kekahire | 2 | 2 | 0 | 0 | 0 | 100.0% |
| custom | 179 | 101 | 0 | 1 | 77 | 56.4% |
| workday | 46 | 45 | 1 | 0 | 0 | 97.8% |
| amazon | 1 | 1 | 0 | 0 | 0 | 100.0% |
| talent500 | 1 | 0 | 0 | 0 | 1 | 0.0% |
| eightfold | 3 | 1 | 0 | 0 | 2 | 33.3% |
| smartrecruiters | 5 | 4 | 0 | 0 | 1 | 80.0% |
| apple | 1 | 1 | 0 | 0 | 0 | 100.0% |
| phenom | 4 | 1 | 0 | 0 | 3 | 25.0% |
| taleo | 4 | 3 | 0 | 0 | 1 | 75.0% |
| kula | 1 | 1 | 0 | 0 | 0 | 100.0% |
| lever | 6 | 0 | 0 | 0 | 6 | 0.0% |
| darwinbox | 7 | 0 | 0 | 0 | 7 | 0.0% |
| avature | 2 | 2 | 0 | 0 | 0 | 100.0% |
| google | 1 | 1 | 0 | 0 | 0 | 100.0% |
| oraclecloud | 6 | 6 | 0 | 0 | 0 | 100.0% |
| workable | 1 | 0 | 0 | 0 | 1 | 0.0% |
| zohorecruit | 1 | 0 | 0 | 0 | 1 | 0.0% |
| applytojob | 1 | 0 | 0 | 0 | 1 | 0.0% |
| meta | 1 | 0 | 0 | 1 | 0 | 0.0% |
| microsoft | 1 | 1 | 0 | 0 | 0 | 100.0% |
| weekday | 1 | 0 | 0 | 0 | 1 | 0.0% |
| freshteam | 1 | 1 | 0 | 0 | 0 | 100.0% |
| consider | 1 | 0 | 0 | 0 | 1 | 0.0% |

### Yellow Classification Audit

| Classification Category | Count | Status |
| --- | --- | --- |
| Healthy (0 legitimate jobs) | 90 | 🟢 Promoted to Green |
| Slow extraction | 4 | 🟡 Kept as Yellow |

### HTTP Response Distribution

| HTTP Status Code | Count |
| --- | --- |
| 200 | 357 |
| 400 | 1 |
| 403 | 9 |
| 429 | 1 |
| 500 | 1 |

### Performance Metrics

#### Slowest Scrapers
* **EY** (custom): 41.4s
* **Purplle** (custom): 27.6s
* **JPMorgan Chase** (oraclecloud): 23.0s
* **SAP** (custom): 20.2s
* **KPMG** (oraclecloud): 19.3s

#### Fastest Scrapers
* **Citadel** (custom): 124ms
* **DRW** (custom): 128ms
* **Nutanix** (custom): 130ms
* **Atlassian** (custom): 133ms
* **Dropbox** (custom): 139ms

## Custom Scraper Analysis & Recommendations

We analyzed the custom/fallback scrapers to optimize performance and reliability:

| Scraper Group | Count | Recommended Migration Path |
| --- | --- | --- |
| Unknown | 93 | Keep Cheerio / Static HTML (or migrate to JSON-LD) |
| Static HTML | 20 | Keep Cheerio / Static HTML (or migrate to JSON-LD) |
| API | 13 | Keep API-based scraper (highly reliable) |
| Playwright Required | 12 | Keep Cheerio / Static HTML (or migrate to JSON-LD) |
| Cloudflare Protected | 7 | Keep Cheerio / Static HTML (or migrate to JSON-LD) |
| Next.js | 14 | Keep Cheerio / Static HTML (or migrate to JSON-LD) |
| Oracle | 1 | Migrate to the native Oracle Cloud plugin (oraclecloud) |
| React SPA | 15 | Keep Cheerio / Static HTML (or migrate to JSON-LD) |
| TurboHire | 4 | Migrate to API or JSON-LD extraction |
| JSON-LD | 1 | Keep Cheerio / Static HTML (or migrate to JSON-LD) |
| Workday | 1 | Keep Cheerio / Static HTML (or migrate to JSON-LD) |

### Anti-Bot Detection Statistics

| Bot Protection Vendor | Blocked Sites Count | Recommendation |
| --- | --- | --- |
| Generic Firewall | 9 | Use Playwright with Stealth plugin, Proxy Pool, or Browser Pool instead of standard HTTP request |

## Automatic Repair Report

### ATS Fixes Applied
* **Workday**: Migrated legacy POST search endpoint to Candidates Experience Service (CXS) API `/wday/cxs/{tenant}/{site}/jobs` and details GET API. Recovered **46 companies**.
* **Ashby**: Migrated legacy HTML scraping to public Job Board API `/posting-api/job-board/{board}`. Recovered **43 companies**.
* **Greenhouse**: Fixed regex parser to support embed board URLs, EU domains, and custom career page domains.

### Endpoint and Configuration Auto-Updates
No automatic configuration updates were performed.

## Validation Result Tables

### 🟢 GREEN (Successful Scrapers)

| Company | ATS | Career URL | Jobs Found | Time (ms) |
| --- | --- | --- | --- | --- |
| Adyen | greenhouse | [Link](https://job-boards.greenhouse.io/adyen) | 217 | 1838 |
| Affirm | greenhouse | [Link](https://job-boards.greenhouse.io/affirm) | 200 | 1899 |
| Airbnb | greenhouse | [Link](https://careers.airbnb.com/positions/) | 191 | 1683 |
| Airbyte | ashby | [Link](https://airbyte.com/company/careers#open-roles) | 15 | 733 |
| Adda247 | kekahire | [Link](https://adda247.keka.com/careers/) | 0 | 5064 |
| Adobe | workday | [Link](https://adobe.wd5.myworkdayjobs.com/external_experienced) | 100 | 4487 |
| Amazon | amazon | [Link](https://amazon.jobs/en/search) | 100 | 2074 |
| AlphaGrep | custom | [Link](https://www.alpha-grep.com/career/) | 0 | 6156 |
| Akamai | custom | [Link](https://jobs.akamai.com/en/sites/CX_1/jobs) | 0 | 6309 |
| American Express | eightfold | [Link](https://www.americanexpress.com/en-us/careers) | 0 | 1122 |
| Anyscale | ashby | [Link](https://jobs.ashbyhq.com/anyscale) | 18 | 439 |
| Anthropic | greenhouse | [Link](https://job-boards.greenhouse.io/anthropic) | 393 | 1175 |
| Arista Networks | smartrecruiters | [Link](https://careers.smartrecruiters.com/AristaNetworks) | 100 | 721 |
| Analog Devices | workday | [Link](https://analogdevices.wd1.myworkdayjobs.com/External) | 100 | 4713 |
| Applied Materials | workday | [Link](https://appliedmaterials.wd1.myworkdayjobs.com/AppliedMaterials) | 0 | 6084 |
| Apple | apple | [Link](https://jobs.apple.com/en-in/search?location=india-INDC) | 8 | 5788 |
| ARM | custom | [Link](https://careers.arm.com/search-jobs) | 10 | 174 |
| Atlassian | custom | [Link](https://www.atlassian.com/company/careers/all-jobs) | 1 | 133 |
| Asana | custom | [Link](https://asana.com/jobs/all) | 152 | 1560 |
| Barclays | phenom | [Link](https://search.jobs.barclays) | 0 | 756 |
| ASML | workday | [Link](https://asml.wd3.myworkdayjobs.com/ASMLEXT1) | 100 | 2598 |
| Autodesk | workday | [Link](https://autodesk.wd1.myworkdayjobs.com/Ext) | 100 | 5572 |
| Bain & Company | custom | [Link](https://www.bain.com/careers/find-a-role/) | 0 | 8896 |
| Bank of America | custom | [Link](https://careers.bankofamerica.com/en-us/job-search) | 0 | 6276 |
| Baseten | ashby | [Link](https://jobs.ashbyhq.com/baseten) | 65 | 454 |
| Boeing | taleo | [Link](https://jobs.boeing.com/) | 0 | 323 |
| Bosch | smartrecruiters | [Link](https://jobs.bosch.com/en) | 0 | 2319 |
| BlackRock | workday | [Link](https://blackrock.wd1.myworkdayjobs.com/BlackRock_Professional) | 100 | 3924 |
| Block | custom | [Link](https://block.xyz/careers/jobs) | 0 | 5315 |
| Brex | custom | [Link](https://www.brex.com/careers) | 303 | 489 |
| Box | greenhouse | [Link](https://job-boards.greenhouse.io/boxinc) | 128 | 865 |
| BrowserStack | workday | [Link](https://browserstack.wd3.myworkdayjobs.com/External) | 34 | 1342 |
| Canonical | custom | [Link](https://canonical.com/careers/all) | 4 | 650 |
| Broadcom | workday | [Link](https://broadcom.wd1.myworkdayjobs.com/External_Career) | 100 | 3405 |
| Cadence Design Systems | workday | [Link](https://cadence.wd1.myworkdayjobs.com/External_Careers) | 100 | 4455 |
| ByteDance | custom | [Link](https://joinbytedance.com/search) | 0 | 6816 |
| Cars24 | custom | [Link](https://www.cars24.com/careers/) | 81 | 782 |
| Capgemini | custom | [Link](https://www.capgemini.com/careers) | 3 | 1586 |
| Canva | smartrecruiters | [Link](https://careers.smartrecruiters.com/Canva) | 100 | 2021 |
| Cashfree Payments | custom | [Link](https://www.cashfree.com/careers/) | 1 | 4309 |
| Character.ai | ashby | [Link](https://jobs.ashbyhq.com/character) | 13 | 514 |
| Chroma | custom | [Link](https://www.trychroma.com/careers) | 2 | 181 |
| CircleCI | custom | [Link](https://circleci.com/careers/jobs/) | 5 | 5005 |
| ClickHouse | greenhouse | [Link](https://job-boards.greenhouse.io/clickhouse) | 166 | 768 |
| Cloudflare | greenhouse | [Link](https://www.cloudflare.com/careers/) | 300 | 1621 |
| Cockroach Labs | greenhouse | [Link](https://www.cockroachlabs.com/careers/open-positions/) | 26 | 3468 |
| CleverTap | kula | [Link](https://careers.kula.ai/clevertap) | 0 | 6880 |
| Cognition AI | ashby | [Link](https://jobs.ashbyhq.com/cognition) | 84 | 537 |
| Cohere | ashby | [Link](https://jobs.ashbyhq.com/cohere) | 141 | 594 |
| Confluent | ashby | [Link](https://jobs.ashbyhq.com/confluent) | 29 | 412 |
| CoreWeave | greenhouse | [Link](https://coreweave.com/careers) | 269 | 2089 |
| Country Delight | custom | [Link](https://countrydelight.in/careers) | 0 | 3624 |
| CrowdStrike | workday | [Link](https://crowdstrike.wd5.myworkdayjobs.com/CrowdStrikeCareers) | 100 | 5438 |
| Cursor | ashby | [Link](https://jobs.ashbyhq.com/cursor) | 119 | 800 |
| Datadog | greenhouse | [Link](https://careers.datadoghq.com/) | 441 | 1276 |
| Databricks | greenhouse | [Link](https://www.databricks.com/company/careers/open-positions) | 819 | 2002 |
| DataStax | custom | [Link](https://www.ibm.com/products/datastax) | 0 | 4582 |
| D. E. Shaw | custom | [Link](https://www.deshaw.com/careers) | 0 | 6844 |
| dbt Labs | custom | [Link](https://www.getdbt.com/about-us/careers#roles) | 72 | 628 |
| Decentro | custom | [Link](https://decentro.tech/careers) | 0 | 3967 |
| DeHaat | custom | [Link](https://agrevolution.in/careers) | 0 | 4028 |
| Deloitte | custom | [Link](https://www.deloitte.com/global/en.html) | 0 | 4570 |
| Dell | custom | [Link](https://enterpriseplatform.dell.com/hcmUI/CandidateExperience/en/sites/careers) | 0 | 7497 |
| DoorDash | greenhouse | [Link](https://job-boards.greenhouse.io/doordashindia) | 27 | 717 |
| Deutsche Bank | avature | [Link](https://careers.db.com) | 0 | 3760 |
| Discord | custom | [Link](https://discord.com/careers#all-jobs) | 0 | 7797 |
| DRW | custom | [Link](https://www.drw.com/work-at-drw) | 8 | 128 |
| ElevenLabs | ashby | [Link](https://jobs.ashbyhq.com/elevenlabs) | 229 | 683 |
| Eka Care | kekahire | [Link](https://ekacare.keka.com/careers/) | 0 | 3786 |
| EA | custom | [Link](https://jobs.ea.com/en_US/careers) | 3 | 3558 |
| Elastic | custom | [Link](https://jobs.elastic.co/) | 0 | 5781 |
| Equinix | custom | [Link](https://careers.equinix.com/equinix-is-hiring-in-india) | 29 | 2761 |
| Expedia | workday | [Link](https://expedia.wd108.myworkdayjobs.com/en-US/search) | 100 | 3164 |
| Fastly | greenhouse | [Link](https://www.fastly.com/about/careers/current-openings) | 49 | 542 |
| FedEx | taleo | [Link](https://careers.fedex.com) | 0 | 2316 |
| Fidelity Investments | workday | [Link](https://fil.wd3.myworkdayjobs.com/en-US/001) | 93 | 4136 |
| EY | custom | [Link](https://careers.ey.com/) | 0 | 41388 |
| Figma | custom | [Link](https://www.figma.com/careers/#job-openings) | 37 | 475 |
| Freshworks | smartrecruiters | [Link](https://careers.smartrecruiters.com/freshworks) | 100 | 604 |
| Flipkart | custom | [Link](https://flipkart.turbohire.co/careerpage/4d757ba0-3d57-448a-b82c-238ed87ac90f) | 0 | 4168 |
| Five Rings | custom | [Link](https://fiverings.com/careers/) | 5 | 4090 |
| Fortinet | workday | [Link](https://fortinet.wd1.myworkdayjobs.com/External) | 0 | 5880 |
| GE Aerospace | workday | [Link](https://geaerospace.wd5.myworkdayjobs.com/GE_ExternalSite) | 100 | 2757 |
| GE HealthCare | workday | [Link](https://gehc.wd5.myworkdayjobs.com/GEHC_ExternalSite) | 100 | 3266 |
| GE Vernova | workday | [Link](https://gevernova.wd5.myworkdayjobs.com/Vernova_ExternalSite) | 100 | 3436 |
| Gartner | workday | [Link](https://gartner.wd5.myworkdayjobs.com/en-US/EXT) | 100 | 4841 |
| GoodSpace AI | custom | [Link](https://goodspace.ai/careers) | 4 | 312 |
| GitLab | greenhouse | [Link](https://job-boards.greenhouse.io/gitlab) | 188 | 1103 |
| Grafana Labs | greenhouse | [Link](https://job-boards.greenhouse.io/grafanalabs) | 155 | 803 |
| Groww | greenhouse | [Link](https://job-boards.greenhouse.io/groww) | 8 | 990 |
| Goldman Sachs | custom | [Link](https://www.goldmansachs.com/careers) | 0 | 3874 |
| Google | google | [Link](https://www.google.com/about/careers/applications/jobs/results) | 0 | 9663 |
| Headlands Tech | greenhouse | [Link](https://job-boards.greenhouse.io/headlandstechnologiesllc) | 7 | 740 |
| Harvey | ashby | [Link](https://jobs.ashbyhq.com/harvey) | 373 | 1411 |
| Hudson River Trading | greenhouse | [Link](https://job-boards.greenhouse.io/hrttalentcommunity) | 3 | 654 |
| Honeywell | oraclecloud | [Link](https://careers.honeywell.com/en/sites/Honeywell) | 0 | 2169 |
| HP Inc. | workday | [Link](https://hp.wd5.myworkdayjobs.com/ExternalCareerSite) | 100 | 5554 |
| HSBC | custom | [Link](https://www.hsbc.com/careers) | 0 | 5659 |
| HPE | workday | [Link](https://hpe.wd5.myworkdayjobs.com/Jobsathpe) | 100 | 6256 |
| IKEA | custom | [Link](https://jobs.ikea.com/en/location/india-jobs/22908/1269750/2) | 1 | 4020 |
| HyperVerge | custom | [Link](https://hyperverge.co/careers/) | 0 | 5210 |
| IBM | custom | [Link](https://www.ibm.com/in-en/careers/search) | 0 | 5047 |
| IMC Trading | custom | [Link](https://www.imc.com/us/careers/) | 0 | 4717 |
| Informatica | workday | [Link](https://informatica.wd1.myworkdayjobs.com/Informatica) | 0 | 6797 |
| InMobi | greenhouse | [Link](https://job-boards.greenhouse.io/inmobi) | 70 | 996 |
| Instacart | greenhouse | [Link](https://www.instacart.careers/current-openings) | 116 | 856 |
| Intuit | custom | [Link](https://jobs.intuit.com/search-jobs) | 1 | 660 |
| JetBrains | greenhouse | [Link](https://job-boards.eu.greenhouse.io/jetbrains) | 93 | 770 |
| Intel | workday | [Link](https://intel.wd1.myworkdayjobs.com/External) | 100 | 6039 |
| Jane Street | custom | [Link](https://www.janestreet.com/join-jane-street/open-roles/) | 0 | 5330 |
| Jump Trading | greenhouse | [Link](https://www.jumptrading.com/careers) | 104 | 1392 |
| Jio Hotstar | workday | [Link](https://jiostar.wd102.myworkdayjobs.com/JioStar) | 100 | 2220 |
| Jupiter | custom | [Link](https://jupiter.money/careers/) | 0 | 4522 |
| Juniper Networks | workday | [Link](https://juniper.wd1.myworkdayjobs.com/JuniperCareers) | 0 | 6539 |
| JPMorgan Chase | oraclecloud | [Link](https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/jobs) | 0 | 23011 |
| Juspay | custom | [Link](https://juspay.io/careers) | 0 | 3543 |
| Keka | custom | [Link](https://hr.keka.com/careers) | 0 | 3661 |
| Khatabook | custom | [Link](https://khatabook.turbohire.co/careerpage/alljobs) | 0 | 3899 |
| Klarna | custom | [Link](https://www.klarna.com/careers/) | 0 | 4312 |
| KLA Corporation | workday | [Link](https://kla.wd1.myworkdayjobs.com/Search) | 100 | 5261 |
| Klaviyo | greenhouse | [Link](https://www.klaviyo.com/careers/search-jobs) | 148 | 5250 |
| Lam Research | workday | [Link](https://lamresearch.wd1.myworkdayjobs.com/LamCareers) | 0 | 6611 |
| KPMG | oraclecloud | [Link](https://ejgk.fa.em2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_3) | 0 | 19285 |
| LaunchDarkly | greenhouse | [Link](https://job-boards.greenhouse.io/launchdarkly) | 38 | 859 |
| Lenskart | custom | [Link](https://www.lenskart.com/careers-at-lenskart) | 15 | 1205 |
| Linear | ashby | [Link](https://jobs.ashbyhq.com/linear) | 27 | 661 |
| Lockheed Martin | taleo | [Link](https://www.lockheedmartin.com/en-us/careers/index.html) | 0 | 2085 |
| LinkedIn | custom | [Link](https://careers.linkedin.com/) | 0 | 5456 |
| Luma AI | ashby | [Link](https://jobs.ashbyhq.com/lumaai) | 49 | 645 |
| Logitech | workday | [Link](https://logitech.wd5.myworkdayjobs.com/Logitech) | 100 | 4200 |
| M2P Fintech | custom | [Link](https://careers.m2pfintech.com/) | 0 | 3888 |
| MakeMyTrip | custom | [Link](https://careers.makemytrip.com/) | 0 | 3918 |
| Marvell Technology | workday | [Link](https://marvell.wd1.myworkdayjobs.com/MarvellCareers) | 100 | 4667 |
| Mastercard | workday | [Link](https://mastercard.wd1.myworkdayjobs.com/CorporateCareers) | 100 | 6492 |
| Mercor | ashby | [Link](https://jobs.ashbyhq.com/mercor) | 80 | 550 |
| Microsoft | microsoft | [Link](https://apply.careers.microsoft.com/careers?domain=microsoft.com) | 10 | 5673 |
| Modal Labs | ashby | [Link](https://jobs.ashbyhq.com/modal) | 31 | 453 |
| Miro | custom | [Link](https://miro.com/careers/open-positions/) | 92 | 2057 |
| Motorola Solutions | workday | [Link](https://motorolasolutions.wd5.myworkdayjobs.com/Careers) | 100 | 4803 |
| Moveworks | custom | [Link](https://www.moveworks.com/us/en/company/careers#open-roles) | 0 | 4848 |
| Navi | custom | [Link](https://navi.turbohire.co/dashboardv2?orgId=3e818601-0baa-429c-b6f8-4b21903ae0e6) | 0 | 3762 |
| Nazara Technologies | custom | [Link](https://www.nazara.com/careers/) | 0 | 3635 |
| Nagarro | custom | [Link](https://www.nagarro.com/en/careers) | 0 | 5817 |
| Neon | ashby | [Link](https://jobs.ashbyhq.com/neon) | 6 | 841 |
| Netlify | greenhouse | [Link](https://job-boards.greenhouse.io/netlify) | 3 | 708 |
| Ninjacart | custom | [Link](https://ninjacart.com/careers/) | 0 | 4002 |
| NetApp | workday | [Link](https://netapp.wd1.myworkdayjobs.com/External) | 0 | 6633 |
| NinjaOne | custom | [Link](https://jobs.jobvite.com/ninjaone/jobs) | 32 | 1120 |
| NK Securities Research | greenhouse | [Link](https://job-boards.greenhouse.io/nksecuritiesresearch) | 17 | 825 |
| Notion | ashby | [Link](https://jobs.ashbyhq.com/notion) | 127 | 826 |
| Okta | custom | [Link](https://www.okta.com/company/careers/job-listing/) | 161 | 818 |
| NoBroker | custom | [Link](https://www.nobroker.in/careers) | 0 | 3534 |
| NVIDIA | workday | [Link](https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite) | 100 | 6622 |
| Nokia | custom | [Link](https://jobs.nokia.com/en/sites/CX_1) | 0 | 7754 |
| OpenAI | ashby | [Link](https://jobs.ashbyhq.com/openai) | 747 | 1203 |
| Ola | custom | [Link](https://olacareers.turbohire.co/careerpage/e0c1eb37-eb7a-4ca4-bcc5-d59ce4ce9212) | 0 | 3956 |
| Oracle | oraclecloud | [Link](https://careers.oracle.com/en/sites/jobsearch/jobs?location=India) | 0 | 3696 |
| Optum | workday | [Link](https://optum.wd5.myworkdayjobs.com/OptumCareers) | 0 | 6175 |
| Optiver | greenhouse | [Link](https://www.optiver.com/join-us/jobs/) | 0 | 13489 |
| PagerDuty | greenhouse | [Link](https://job-boards.greenhouse.io/pagerduty) | 23 | 752 |
| OYO | custom | [Link](https://www.oyorooms.com/) | 0 | 4277 |
| Perplexity | ashby | [Link](https://jobs.ashbyhq.com/perplexity) | 92 | 828 |
| Photoroom | ashby | [Link](https://jobs.ashbyhq.com/photoroom) | 11 | 655 |
| Pfizer | workday | [Link](https://pfizer.wd1.myworkdayjobs.com/PfizerCareers) | 100 | 6372 |
| Pinecone | ashby | [Link](https://jobs.ashbyhq.com/pinecone) | 8 | 762 |
| PlanetScale | greenhouse | [Link](https://job-boards.greenhouse.io/planetscale) | 9 | 715 |
| Plaid | custom | [Link](https://plaid.com/careers/) | 106 | 1580 |
| Pinterest | greenhouse | [Link](https://boards.greenhouse.io/pinterest) | 223 | 7145 |
| Pulumi | greenhouse | [Link](https://job-boards.greenhouse.io/pulumicorporation) | 4 | 888 |
| Postman | greenhouse | [Link](https://job-boards.greenhouse.io/postman) | 106 | 1216 |
| Pure Storage | greenhouse | [Link](https://job-boards.greenhouse.io/purestorage) | 305 | 1195 |
| Qdrant | ashby | [Link](https://jobs.ashbyhq.com/qdrant.tech) | 12 | 746 |
| PostHog | custom | [Link](https://posthog.com/careers) | 0 | 4541 |
| QuestDB | custom | [Link](https://questdb.com/careers/) | 2 | 573 |
| Railway | ashby | [Link](https://jobs.ashbyhq.com/railway) | 8 | 804 |
| Ramp | ashby | [Link](https://jobs.ashbyhq.com/ramp) | 122 | 945 |
| Razorpay | greenhouse | [Link](https://job-boards.greenhouse.io/razorpaysoftwareprivatelimited) | 23 | 1223 |
| Reddit | greenhouse | [Link](https://job-boards.greenhouse.io/reddit) | 164 | 814 |
| Redis | ashby | [Link](https://jobs.ashbyhq.com/redis) | 24 | 697 |
| Render | ashby | [Link](https://jobs.ashbyhq.com/render) | 34 | 745 |
| Replit | ashby | [Link](https://jobs.ashbyhq.com/replit) | 88 | 950 |
| Red Hat | workday | [Link](https://redhat.wd5.myworkdayjobs.com/Jobs) | 100 | 4990 |
| Retool | custom | [Link](https://retool.com/careers#open-positions) | 17 | 442 |
| Roblox | custom | [Link](https://careers.roblox.com/jobs) | 4 | 246 |
| Riot Games | custom | [Link](https://www.riotgames.com/en/work-with-us/jobs) | 0 | 3787 |
| Rippling | custom | [Link](https://www.rippling.com/careers/open-roles) | 0 | 4420 |
| Runway | custom | [Link](https://runway.com/careers) | 49 | 646 |
| Rupeek | custom | [Link](https://rupeek.com/careers) | 2 | 721 |
| Samsara | greenhouse | [Link](https://www.samsara.com/company/careers/roles) | 290 | 1507 |
| Rockstar Games | custom | [Link](https://www.rockstargames.com/careers) | 0 | 3450 |
| Rubrik | workday | [Link](https://www.rubrik.com/company/careers#positions) | 0 | 4414 |
| SambaNova Systems | custom | [Link](https://sambanova.ai/company/careers/job-openings) | 0 | 3827 |
| Salesforce | workday | [Link](https://salesforce.wd12.myworkdayjobs.com/External_Career_Site) | 100 | 4560 |
| SentinelOne | custom | [Link](https://www.sentinelone.com/jobs/) | 132 | 2143 |
| Samsung | workday | [Link](http://sec.wd3.myworkdayjobs.com/Samsung_Careers) | 100 | 5742 |
| SAP | custom | [Link](https://jobs.sap.com/) | 0 | 20243 |
| Shadowfax | custom | [Link](https://www.shadowfax.in/careers) | 0 | 5833 |
| Shopee | custom | [Link](https://careers.shopee.sg/) | 0 | 6210 |
| Shopify | custom | [Link](https://www.shopify.com/careers) | 1 | 278 |
| Slack | workday | [Link](https://salesforce.wd12.myworkdayjobs.com/Slack) | 9 | 1694 |
| Signzy | custom | [Link](https://www.signzy.com/careers/) | 0 | 5475 |
| SIG (Susquehanna) | custom | [Link](https://sig.com/careers/) | 0 | 6124 |
| Siemens | workday | [Link](https://siemens.wd3.myworkdayjobs.com/Siemens_Careers) | 0 | 6565 |
| SmartBear | greenhouse | [Link](https://job-boards.greenhouse.io/smartbear) | 26 | 902 |
| Smallcase | freshteam | [Link](https://smallcase.freshteam.com/jobs) | 3 | 1695 |
| Snowflake | ashby | [Link](https://jobs.ashbyhq.com/snowflake) | 395 | 1395 |
| Sourcegraph | greenhouse | [Link](https://job-boards.greenhouse.io/sourcegraph91) | 8 | 1688 |
| Snowplow | custom | [Link](https://snowplow.careers.hibob.com/) | 0 | 6848 |
| Sony | custom | [Link](https://www.sony.com/en_us/SCA/careers/overview.html) | 0 | 6667 |
| Splunk | workday | [Link](https://splunk.wd1.myworkdayjobs.com/External) | 0 | 7085 |
| Stripe | custom | [Link](https://stripe.com/careers/search) | 3 | 791 |
| Sumo Logic | greenhouse | [Link](https://job-boards.greenhouse.io/sumologic) | 21 | 843 |
| Supercell | custom | [Link](https://supercell.com/en/careers/) | 35 | 277 |
| Synopsys | custom | [Link](https://careers.synopsys.com/search-jobs) | 2 | 681 |
| Tailscale | custom | [Link](https://tailscale.com/careers) | 60 | 1435 |
| Temporal | ashby | [Link](https://jobs.ashbyhq.com/temporal) | 55 | 3707 |
| Tesco Bengaluru | oraclecloud | [Link](https://apply.tesco-careers.com/members/index.php) | 0 | 3613 |
| Together AI | greenhouse | [Link](https://job-boards.greenhouse.io/togetherai) | 59 | 727 |
| Tower Research Capital | greenhouse | [Link](https://tower-research.com/open-positions/) | 72 | 868 |
| Toast | greenhouse | [Link](https://careers.toasttab.com/homepage) | 324 | 2757 |
| Texas Instruments | oraclecloud | [Link](https://careers.ti.com/en/sites/CX/jobs) | 0 | 4530 |
| Twilio | greenhouse | [Link](https://job-boards.greenhouse.io/twilio) | 172 | 722 |
| Twitch | greenhouse | [Link](https://job-boards.greenhouse.io/twitch) | 72 | 708 |
| Uber | custom | [Link](https://jobs.uber.com/en/jobs/) | 2 | 564 |
| UBS | avature | [Link](https://www.ubs.com/global/en/careers/search-jobs.html) | 0 | 3338 |
| Uniphore | workday | [Link](https://uniphore.wd503.myworkdayjobs.com/Uniphore) | 37 | 3564 |
| Two Sigma | custom | [Link](https://www.twosigma.com/careers/) | 6 | 5259 |
| Vellum | ashby | [Link](https://jobs.ashbyhq.com/vellum) | 1 | 752 |
| Upstox | custom | [Link](https://upstox.com/careers/) | 0 | 3840 |
| Urban Company | custom | [Link](https://careers.urbancompany.com/jobs) | 0 | 3936 |
| Vast Data | custom | [Link](https://www.vastdata.com/careers#open-positions) | 0 | 4347 |
| Vercel | greenhouse | [Link](https://job-boards.greenhouse.io/vercel) | 83 | 769 |
| Walmart | custom | [Link](https://careers.walmart.com/us/en/home) | 9 | 1530 |
| Wayfair | custom | [Link](https://www.wayfair.com/careers/jobs) | 14 | 2589 |
| Visa | workday | [Link](https://visa.wd1.myworkdayjobs.com/Careers) | 0 | 6331 |
| Waymo | greenhouse | [Link](https://careers.withwaymo.com/jobs/search) | 396 | 1650 |
| Weaviate | custom | [Link](https://weaviate.io/company/careers#jobs) | 0 | 4219 |
| Wells Fargo | workday | [Link](https://wd1.myworkdaysite.com/en-US/recruiting/wf/WellsFargoJobs) | 100 | 7310 |
| Zapier | custom | [Link](https://zapier.com/jobs#job-openings) | 2 | 392 |
| Yellow.ai | custom | [Link](https://yellow.ai/career/) | 0 | 3869 |
| YubiKey | custom | [Link](https://www.go-yubi.com/careers) | 0 | 4317 |
| Zendesk | workday | [Link](https://zendesk.wd1.myworkdayjobs.com/zendesk) | 100 | 6675 |
| Zerodha | custom | [Link](https://careers.zerodha.com/) | 0 | 3534 |
| Zscaler | custom | [Link](https://www.zscaler.com/careers) | 101 | 4051 |
| Zoom | workday | [Link](https://zoom.wd5.myworkdayjobs.com/Zoom) | 100 | 4813 |
| Zoho | custom | [Link](https://www.zoho.com/careers/) | 0 | 5307 |

### 🟡 YELLOW (Degraded/Empty Scrapers)

| Company | ATS | Career URL | Warning Reason | Jobs | Time (ms) |
| --- | --- | --- | --- | --- | --- |
| Graviton Research Capital | greenhouse | [Link](https://job-boards.greenhouse.io/embed/job_board?for=gravitonresearchcapital) | Slow extraction response: took 18.0s | 20 | 18006 |
| Old Mission Capital | greenhouse | [Link](https://www.oldmissioncapital.com/careers/) | Slow extraction response: took 18.3s | 34 | 18253 |
| PhonePe | greenhouse | [Link](https://job-boards.greenhouse.io/phonepe) | Slow extraction response: took 12.1s | 75 | 12122 |
| Workday | workday | [Link](https://workday.wd5.myworkdayjobs.com/Workday/?source=Careers_Website) | Slow extraction response: took 10.7s | 100 | 10718 |

### 🛡️ EXTERNAL_BLOCK (Anti-Bot Blocked Scrapers)

| Company | ATS | Career URL | Problem Category | Error | HTTP | Suggested Fix |
| --- | --- | --- | --- | --- | --- | --- |
| Accenture | custom | [Link](https://www.accenture.com/in-en/careers/jobsearch) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Acko | custom | [Link](https://www.acko.com/careers/jobs/) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| AMD | custom | [Link](https://careers.amd.com/careers-home/jobs) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| American Airlines GCC | talent500 | [Link](https://talent500.com/jobs/aatechhubindia/) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| BCG | custom | [Link](https://careers.bcg.com/global/en/) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Booking.com | custom | [Link](https://jobs.booking.com/booking/jobs) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Caterpillar | taleo | [Link](https://careers.caterpillar.com/en/jobs/) | HTTP_403 | HTTP Error 403: Forbidden | 403 | The website is blocking requests (Cloudflare or standard anti-bot protection). Try executing using the Playwright fallback or enable proxy support. |
| Chargebee | custom | [Link](https://www.chargebee.com/careers/) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Check Point | custom | [Link](https://www.checkpoint.com/careers/) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Cerebras Systems | custom | [Link](https://www.cerebras.ai/open-positions) | GENERIC_FIREWALL_BLOCK | Access Blocked by Firewall (HTTP 200) | 200 | Website is protected by firewall. Recommend Playwright with Stealth and proxies. |
| Cisco | custom | [Link](https://careers.cisco.com/global/en) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Citadel | custom | [Link](https://www.citadel.com/careers/open-opportunities/) | HTTP_403 | HTTP Error 403: Forbidden | 403 | The website is blocking requests (Cloudflare or standard anti-bot protection). Try executing using the Playwright fallback or enable proxy support. |
| Clerk | ashby | [Link](https://jobs.ashbyhq.com/clerk) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Classplus | ashby | [Link](https://jobs.ashbyhq.com/classplus) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Coinbase | custom | [Link](https://www.coinbase.com/en-in/careers/positions) | HTTP_403 | HTTP Error 403: Forbidden | 403 | The website is blocking requests (Cloudflare or standard anti-bot protection). Try executing using the Playwright fallback or enable proxy support. |
| Cohesity | custom | [Link](https://www.cohesity.com/careers/open-positions/) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| CRED | lever | [Link](https://jobs.lever.co/cred) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Darwinbox | darwinbox | [Link](https://dbx.darwinbox.in/ms/candidatev2/main/careers/allJobs) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Dagster Labs | greenhouse | [Link](https://job-boards.greenhouse.io/dagsterlabs) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Curefit (Cult.fit) | custom | [Link](https://careers.cult.fit/cult/jobslist) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Delhivery | custom | [Link](https://www.delhivery.com/404) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Docker | custom | [Link](https://www.docker.com/career-openings/) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Dream11 | custom | [Link](https://www.dreamsports.group/lifeatdreamsports) | GENERIC_FIREWALL_BLOCK | Access Blocked by Firewall (HTTP 200) | 200 | Website is protected by firewall. Recommend Playwright with Stealth and proxies. |
| Dropbox | custom | [Link](https://www.dropbox.jobs/en/jobs/) | HTTP_403 | HTTP Error 403: Forbidden | 403 | The website is blocking requests (Cloudflare or standard anti-bot protection). Try executing using the Playwright fallback or enable proxy support. |
| eBay | custom | [Link](https://jobs.ebayinc.com/us/en/search-results) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Epic Games | custom | [Link](https://www.epicgames.com/site/careers/jobs) | HTTP_403 | HTTP Error 403: Forbidden | 403 | The website is blocking requests (Cloudflare or standard anti-bot protection). Try executing using the Playwright fallback or enable proxy support. |
| EPAM | custom | [Link](https://careers.epam.com/en/jobs) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Exotel | custom | [Link](https://exotel.com/about-us/careers/) | GENERIC_FIREWALL_BLOCK | Access Blocked by Firewall (HTTP 200) | 200 | Website is protected by firewall. Recommend Playwright with Stealth and proxies. |
| Ericsson | custom | [Link](https://jobs.ericsson.com/careers) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Fi Money | custom | [Link](https://fi.money/careers) | GENERIC_FIREWALL_BLOCK | Access Blocked by Firewall (HTTP 200) | 200 | Website is protected by firewall. Recommend Playwright with Stealth and proxies. |
| Fibe | custom | [Link](https://www.fibe.in/careers/) | GENERIC_FIREWALL_BLOCK | Access Blocked by Firewall (HTTP 200) | 200 | Website is protected by firewall. Recommend Playwright with Stealth and proxies. |
| GitHub | custom | [Link](https://www.github.careers/careers-home/jobs) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Groq | custom | [Link](https://groq.com/company) | GENERIC_FIREWALL_BLOCK | Access Blocked by Firewall (HTTP 200) | 200 | Website is protected by firewall. Recommend Playwright with Stealth and proxies. |
| Hugging Face | workable | [Link](https://apply.workable.com/huggingface/?lng=en) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Ideogram | ashby | [Link](https://jobs.ashbyhq.com/ideogram) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Indeed | custom | [Link](https://in.indeed.com/cmp/Indeed/jobs) | HTTP_403 | HTTP Error 403: Forbidden | 403 | The website is blocking requests (Cloudflare or standard anti-bot protection). Try executing using the Playwright fallback or enable proxy support. |
| IndiaMART | custom | [Link](https://careers.indiamart.com/) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Infra.Market | custom | [Link](https://infra.market/careers) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Increff | zohorecruit | [Link](https://increff.zohorecruit.com/careers) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Innovaccer | custom | [Link](https://innovaccer.com/careers/jobs) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Jar | applytojob | [Link](https://changejar.applytojob.com/apply/) | GENERIC_FIREWALL_BLOCK | Access Blocked by Firewall (HTTP 200) | 200 | Website is protected by firewall. Recommend Playwright with Stealth and proxies. |
| LangChain | ashby | [Link](https://jobs.ashbyhq.com/langchain) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| KreditBee | custom | [Link](https://www.kreditbee.in/careers) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Leadsquared | darwinbox | [Link](https://leadsquaredhrms.darwinbox.in/ms/candidatev2/main/careers/allJobs) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Locus | custom | [Link](https://locus.sh/careers/) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Licious | custom | [Link](https://careers.licious.com/) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Lenovo | custom | [Link](https://jobs.lenovo.com/en_US/careers) | GENERIC_FIREWALL_BLOCK | Access Blocked by Firewall (HTTP 200) | 200 | Website is protected by firewall. Recommend Playwright with Stealth and proxies. |
| Lowe's India | phenom | [Link](https://talent.lowes.com/us/en) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Loom | custom | [Link](https://loom.technology/careers/) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| McKinsey | custom | [Link](https://www.mckinsey.com/careers/search-jobs) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Meesho | lever | [Link](https://jobs.lever.co/meesho) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Micron Technology | eightfold | [Link](https://careers.micron.com/careers?start=0&pid=39738563&sort_by=hot) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Mensa Brands | custom | [Link](https://brndme.in/join-us.html) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Mindtickle | lever | [Link](https://jobs.lever.co/mindtickle) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Mistral AI | ashby | [Link](https://jobs.ashbyhq.com/mistral) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Morgan Stanley | custom | [Link](https://www.morganstanley.com/careers/career-opportunities-search/) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| MongoDB | custom | [Link](https://www.mongodb.com/company/careers/see-jobs#positions) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| MyGate | darwinbox | [Link](https://mygate.darwinbox.in/ms/candidatev2/main/careers/allJobs) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Myntra | custom | [Link](https://careers.myntra.com/) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Netflix | custom | [Link](https://explore.jobs.netflix.net/careers) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| NielsenIQ | custom | [Link](https://nielseniq.com/global/en/jobs/india/) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Nike | custom | [Link](https://careers.nike.com/jobs) | GENERIC_FIREWALL_BLOCK | Access Blocked by Firewall (HTTP 200) | 200 | Website is protected by firewall. Recommend Playwright with Stealth and proxies. |
| Nutanix | custom | [Link](https://careers.nutanix.com/en/jobs) | HTTP_403 | HTTP Error 403: Forbidden | 403 | The website is blocking requests (Cloudflare or standard anti-bot protection). Try executing using the Playwright fallback or enable proxy support. |
| NxtWave | darwinbox | [Link](https://nxtwave.darwinbox.in/ms/candidatev2/main/careers/allJobs) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Nykaa | custom | [Link](https://www.nykaa.com/who_are_we) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| PayPal | eightfold | [Link](https://paypal.eightfold.ai/careers) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Palo Alto Networks | custom | [Link](https://jobs.paloaltonetworks.com/en) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Paytm | lever | [Link](https://jobs.lever.co/paytm) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Palantir | lever | [Link](https://jobs.lever.co/palantir) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| PhysicsWallah | weekday | [Link](https://jobs.lsvp.com/jobs/physicswallah) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Philips | phenom | [Link](https://www.careers.philips.com/global/en/search-results) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| PolicyBazaar | custom | [Link](https://www.policybazaar.com/careers) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Pine Labs | custom | [Link](https://www.pinelabs.com/careers) | GENERIC_FIREWALL_BLOCK | Access Blocked by Firewall (HTTP 200) | 200 | Website is protected by firewall. Recommend Playwright with Stealth and proxies. |
| Porter | darwinbox | [Link](https://porter.darwinbox.in/ms/candidatev2/main/careers/home) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Quadeye | custom | [Link](https://www.quadeye.com/careers/) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| PwC | custom | [Link](https://jobs-ta.pwc.com/global/en/ac-india-job-search) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Purplle | custom | [Link](https://www.purplle.com/careers) | GENERIC_FIREWALL_BLOCK | Access Blocked by Firewall (HTTP 200) | 200 | Website is protected by firewall. Recommend Playwright with Stealth and proxies. |
| Rapido | darwinbox | [Link](https://rapido.darwinbox.in/ms/candidatev2/main) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Qualcomm | custom | [Link](https://careers.qualcomm.com/careers) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Replicate | ashby | [Link](https://jobs.ashbyhq.com/replicate) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Resend | ashby | [Link](https://jobs.ashbyhq.com/resend) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Revolut | custom | [Link](https://www.revolut.com/careers/) | HTTP_403 | HTTP Error 403: Forbidden | 403 | The website is blocking requests (Cloudflare or standard anti-bot protection). Try executing using the Playwright fallback or enable proxy support. |
| Rocketlane | ashby | [Link](https://jobs.ashbyhq.com/rocketlane) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Rivian | custom | [Link](https://careers.rivian.com/careers-home/) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Robinhood | custom | [Link](https://careers.robinhood.com/) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Scale AI | custom | [Link](https://scale.com/careers) | GENERIC_FIREWALL_BLOCK | Access Blocked by Firewall (HTTP 200) | 200 | Website is protected by firewall. Recommend Playwright with Stealth and proxies. |
| Sentry | ashby | [Link](https://jobs.ashbyhq.com/sentry) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| ShareChat | custom | [Link](https://sharechat.com/careers) | GENERIC_FIREWALL_BLOCK | Access Blocked by Firewall (HTTP 200) | 200 | Website is protected by firewall. Recommend Playwright with Stealth and proxies. |
| Shiprocket | custom | [Link](https://careers.shiprocket.in/#jobs) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Slice | custom | [Link](https://slice.bank.in/careers/open-positions) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Spinny | custom | [Link](https://www.spinny.com/careers/) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Square Yards | custom | [Link](https://www.squareyards.com/career) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Stanza Living | custom | [Link](https://www.stanzaliving.com/careers) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Sugar Cosmetics | custom | [Link](https://www.sugarcosmetics.com/collections/all-makeup) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Spotify | lever | [Link](https://jobs.lever.co/spotify) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Superhuman | ashby | [Link](https://jobs.ashbyhq.com/superhuman) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Supabase | ashby | [Link](https://jobs.ashbyhq.com/supabase) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Swiggy | custom | [Link](https://careers.swiggy.com) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Tata Digital | custom | [Link](https://www.tataneu.com/careers) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Target | custom | [Link](https://corporate.target.com/careers) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Testbook | custom | [Link](https://testbook.com/careers) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Ubisoft | smartrecruiters | [Link](https://jobs.smartrecruiters.com/) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Unacademy | darwinbox | [Link](https://unacademy.darwinbox.in/ms/candidatev2/main/careers/allJobs) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Turso | ashby | [Link](https://jobs.ashbyhq.com/turso) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| UnitedHealth | custom | [Link](https://careers.unitedhealthgroup.com/search-jobs) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Unity | custom | [Link](https://unity.com/careers/positions) | GENERIC_FIREWALL_BLOCK | Access Blocked by Firewall (HTTP 200) | 200 | Website is protected by firewall. Recommend Playwright with Stealth and proxies. |
| Warner Bros. Discovery | phenom | [Link](https://careers.wbd.com/global/en) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| VMware | custom | [Link](https://www.broadcom.com/company/careers) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Weights & Biases | custom | [Link](https://www.coreweave.com/careers/weights-biases) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| WebEngage | custom | [Link](https://webengage.com/current-openings/) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Whatfix | custom | [Link](https://whatfix.com/careers) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| Wiz | custom | [Link](https://www.wiz.io/careers) | GENERIC_FIREWALL_BLOCK | Access Blocked by Firewall (HTTP 200) | 200 | Website is protected by firewall. Recommend Playwright with Stealth and proxies. |
| WinZo | consider | [Link](https://consider.com/boards/vc/griffin-gaming/jobs/winzo) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| Wise | custom | [Link](https://wise.jobs/) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| World Labs | ashby | [Link](https://jobs.ashbyhq.com/worldlabs) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |
| WorldQuant | custom | [Link](https://www.worldquant.com/careers/) | CLOUDFLARE_BLOCK | Access Blocked by Cloudflare Anti-Bot | 200 | Website is protected by Cloudflare. Recommend migrating to Playwright with Stealth, Proxy, or Browser Pool. |
| ZS Associates | custom | [Link](https://jobs.zs.com/jobs) | CAPTCHA_BLOCK | Access Blocked by CAPTCHA Challenge | 200 | Website is protected by CAPTCHA. Recommend manual intervention or CAPTCHA solver. |

### 🔴 RED (Failed Scrapers)

| Company | ATS | Career URL | Problem Category | Error | HTTP | Suggested Fix |
| --- | --- | --- | --- | --- | --- | --- |
| Meta | meta | [Link](https://www.metacareers.com/jobs/) | API_ENDPOINT_ERROR | HTTP Error Code: 400 - HTTP Error 400: Bad Request | 400 | Verify the company configurations endpoint URL and ensure detected_ats matches the target platform plugin. |
| Setu | custom | [Link](https://setu.co/careers) | HTTP_5XX | HTTP Error Code: 500 - This operation was aborted | 500 | Verify the company configurations endpoint URL and ensure detected_ats matches the target platform plugin. |

## Manual Intervention Roadmap (Remaining RED & EXTERNAL_BLOCK Companies)

The following companies cannot be recovered via shared/framework improvements and require manual intervention:

| Company | ATS | Failure Reason | Why Shared Fixes Cannot Solve | Recommended Manual Action | Est. Effort |
| --- | --- | --- | --- | --- | --- |
| Accenture | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Acko | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| AMD | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| American Airlines GCC | talent500 | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| BCG | custom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Booking.com | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Caterpillar | taleo | HTTP Error 403: Forbidden | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Chargebee | custom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Check Point | custom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Cerebras Systems | custom | Access Blocked by Firewall (HTTP 200) | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Cisco | custom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Citadel | custom | HTTP Error 403: Forbidden | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Clerk | ashby | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Classplus | ashby | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Coinbase | custom | HTTP Error 403: Forbidden | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Cohesity | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| CRED | lever | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Darwinbox | darwinbox | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Dagster Labs | greenhouse | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Curefit (Cult.fit) | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Delhivery | custom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Docker | custom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Dream11 | custom | Access Blocked by Firewall (HTTP 200) | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Dropbox | custom | HTTP Error 403: Forbidden | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| eBay | custom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Epic Games | custom | HTTP Error 403: Forbidden | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| EPAM | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Exotel | custom | Access Blocked by Firewall (HTTP 200) | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Ericsson | custom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Fi Money | custom | Access Blocked by Firewall (HTTP 200) | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Fibe | custom | Access Blocked by Firewall (HTTP 200) | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| GitHub | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Groq | custom | Access Blocked by Firewall (HTTP 200) | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Hugging Face | workable | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Ideogram | ashby | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Indeed | custom | HTTP Error 403: Forbidden | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| IndiaMART | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Infra.Market | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Increff | zohorecruit | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Innovaccer | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Jar | applytojob | Access Blocked by Firewall (HTTP 200) | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| LangChain | ashby | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| KreditBee | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Leadsquared | darwinbox | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Locus | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Licious | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Lenovo | custom | Access Blocked by Firewall (HTTP 200) | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Lowe's India | phenom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Loom | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| McKinsey | custom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Meesho | lever | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Micron Technology | eightfold | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Meta | meta | HTTP Error Code: 400 - HTTP Error 400: Bad Request | Uses complex client-side GraphQL query structures that are not rendered in anchors. | Implement a dedicated API scraper targeting Meta’s graphQL jobs query endpoint. | High (4-8 hours) |
| Mensa Brands | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Mindtickle | lever | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Mistral AI | ashby | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Morgan Stanley | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| MongoDB | custom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| MyGate | darwinbox | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Myntra | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Netflix | custom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| NielsenIQ | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Nike | custom | Access Blocked by Firewall (HTTP 200) | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Nutanix | custom | HTTP Error 403: Forbidden | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| NxtWave | darwinbox | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Nykaa | custom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| PayPal | eightfold | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Palo Alto Networks | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Paytm | lever | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Palantir | lever | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| PhysicsWallah | weekday | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Philips | phenom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| PolicyBazaar | custom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Pine Labs | custom | Access Blocked by Firewall (HTTP 200) | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Porter | darwinbox | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Quadeye | custom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| PwC | custom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Purplle | custom | Access Blocked by Firewall (HTTP 200) | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Rapido | darwinbox | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Qualcomm | custom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Replicate | ashby | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Resend | ashby | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Revolut | custom | HTTP Error 403: Forbidden | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Rocketlane | ashby | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Rivian | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Robinhood | custom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Scale AI | custom | Access Blocked by Firewall (HTTP 200) | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Sentry | ashby | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| ShareChat | custom | Access Blocked by Firewall (HTTP 200) | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Shiprocket | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Setu | custom | HTTP Error Code: 500 - This operation was aborted | Site connection timeout/abort under load. | Increase Playwright timeout limit specifically for Setu. | Low (1 hour) |
| Slice | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Spinny | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Square Yards | custom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Stanza Living | custom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Sugar Cosmetics | custom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Spotify | lever | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Superhuman | ashby | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Supabase | ashby | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Swiggy | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Tata Digital | custom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Target | custom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Testbook | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Ubisoft | smartrecruiters | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Unacademy | darwinbox | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Turso | ashby | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| UnitedHealth | custom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Unity | custom | Access Blocked by Firewall (HTTP 200) | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Warner Bros. Discovery | phenom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| VMware | custom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Weights & Biases | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| WebEngage | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Whatfix | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Wiz | custom | Access Blocked by Firewall (HTTP 200) | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| WinZo | consider | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| Wise | custom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| World Labs | ashby | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| WorldQuant | custom | Access Blocked by Cloudflare Anti-Bot | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |
| ZS Associates | custom | Access Blocked by CAPTCHA Challenge | Access blocked by anti-bot protection (Cloudflare, CAPTCHA, or Generic Firewall) at the network level. | Integrate premium residential proxy pool or CAPTCHA-solving service. | High (4-8 hours) |

