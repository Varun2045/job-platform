# 🌐 Supported Recruitment Platforms & Company Portals

This document lists all recruitment platforms, Applicant Tracking Systems (ATS), and company career portals supported by **Job Search Tracker v2.1.0**.

---

## ⚡ 1. Native ATS Parsers (Primary Fast Path)

These recruitment engines are extracted using native DOM parsers delivering ~15ms – 25ms extraction performance:

| ATS Engine | Parser Type | Average Speed | Example Companies |
| :--- | :--- | :--- | :--- |
| **Workday** | Native ATS | 18ms | Adobe, AMD, Cisco, Dell, IBM, Intel, NVIDIA, Salesforce, Tesla, Walmart |
| **Greenhouse** | Native ATS | 15ms | Airbnb, Canva, Cloudflare, Coinbase, Datadog, Figma, OpenAI, Stripe, Vercel |
| **Lever** | Native ATS | 16ms | Block, CircleCI, Discord, JetBrains, Miro, Rippling |
| **Ashby** | Native ATS | 14ms | Anthropic, Cursor, Linear, Perplexity, Ramp, Scale AI |
| **SmartRecruiters** | Native ATS | 20ms | Bosch, Freshworks, Ubisoft |
| **Taleo** | Native ATS | 25ms | Boeing, Caterpillar, FedEx, Lockheed Martin |
| **Oracle Cloud** | Native ATS | 22ms | Honeywell, JPMorgan Chase, KPMG, Oracle |

---

## 🤖 2. Dedicated Company Plugins (Priority 2 Fallback)

For custom corporate portals, dedicated Playwright extraction plugins exist for 50 major technology companies:

- **Big Tech**: Google, Microsoft, Amazon, Apple, Meta, NVIDIA, Adobe, Oracle, Cisco, IBM.
- **Enterprise Cloud**: Salesforce, ServiceNow, Atlassian, VMware, SAP, Snowflake, Databricks, MongoDB, Cloudflare, Elastic.
- **AI & Dev Tools**: OpenAI, Anthropic, Stripe, Figma, Notion, Vercel, GitHub, GitLab, JetBrains, HashiCorp.
- **FinTech & Internet**: Uber, Airbnb, Netflix, Spotify, PayPal, Coinbase, Robinhood, Block, DoorDash, LinkedIn.
- **Infrastructure & Security**: Intel, Qualcomm, AMD, Broadcom, ARM, Ericsson, Nokia, Palo Alto Networks, CrowdStrike, Zoom.

---

## 🌐 3. Generic Playwright Fallback (Priority 3)

For unsupported or highly custom URLs, the framework executes a generic heuristic DOM extractor with resource optimization (blocking images, media, fonts).
