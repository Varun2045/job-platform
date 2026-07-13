# Production Release Checklist (v4.1.0)

Pre-flight checklist before launching the repository publicly.

---

## 1. Secrets and Credentials
- [ ] **No Hardcoded Keys**: Verify `.env` configuration contains no keys checked into Git.
- [ ] **API Tokens Validation**: Ensure Resend API keys and Supabase credentials are valid and active.

## 2. Database & Storage Setup
- [ ] **PostgreSQL Advisory Lock Check**: Verify Supabase can handle PG connection pools.
- [ ] **Initialize Tables**: Run schema definitions on the production database.
- [ ] **Clean Up Test Seeding**: Delete any mock users, resumes, or scraped companies from production state tables.

## 3. Automation & Deployment
- [ ] **Docker Containers**: Verify container build is successful: `docker build -t job-monitor:latest .`.
- [ ] **Continuous Integration**: Ensure GitHub Actions build and lint workflows pass.
- [ ] **Advisory Lock Check**: Verify that multiple workers cannot execute scrapes concurrently.

## 4. Operational Monitoring
- [ ] **Prometheus metrics**: Verify `storage/metrics.prom` logs metrics successfully.
- [ ] **Uptime Telemetry**: Connect health checks `/health` to alerts monitor.
- [ ] **Log Levels**: Ensure standard configuration uses `INFO` logging (not `DEBUG`) in production.

## 5. Security & Visibility
- [ ] **CORS Settings**: Verify CORS only permits whitelisted loopbacks and specified production origins.
- [ ] **GitHub Security Scanning**: Enable Dependabot and secret scanning.
- [ ] **Repository Visibility**: Check public fork permissions.
