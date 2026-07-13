# System Operations & Monitoring

Information on telemetry, log profiles, and dashboard integrations.

---

## 1. Logging Configurations

The logger output format and minimum verbosity level are managed via:
- `src/core/Logger.ts`

### Log Levels
- `DEBUG`: Verbose tracing of raw scraper loads, parser links matching, and similarity weight matrix evaluations.
- `INFO`: Normal status updates (job found count, scraper batch runs, email dispatches).
- `WARN`: Recoverable errors (scraping failures, network socket timeouts, skipped emails).
- `ERROR`: Unrecoverable execution errors (invalid database access credentials, SMTP server connection failures).
- `CRITICAL`: System startup crashes or configuration load blocks.

---

## 2. Telemetry and Prometheus Exporter

Prometheus metrics are written to `storage/metrics.prom` on every successful run:

### Key Metrics
- `job_monitor_scrape_duration_seconds`: Total duration of the orchestrator run in seconds.
- `job_monitor_companies_checked_total`: Number of enabled companies processed.
- `job_monitor_discovered_jobs_total`: Total count of jobs found on career pages.
- `job_monitor_matched_jobs_total`: Number of postings matching user resume thresholds.
- `job_monitor_failures_total`: Total count of scraper execution failures.

You can configure Prometheus to scrape these status metrics by configuring a file exporter or point your agent to the `/health` REST endpoint.
