# Operations Runbook

Operational procedures for administering the Job Monitor Platform.

---

## 1. Running the Scraper Orchestrator Manually

To force-run a scrape of career boards outside the normal cron interval:

1. SSH into the production server or navigate to the runtime directory.
2. Execute the CLI monitor utility:
   ```bash
   npm run monitor
   ```
3. Observe the outputs written to the stdout log or `storage/logs/` directories.

---

## 2. Setting Scraper Circuit Breaker Override

If a company board scraper has been suspended due to continuous network failures, you can manually reset its suspension in the database:

### Supabase Cloud:
Execute SQL in the database manager:
```sql
UPDATE companies_state 
SET consecutive_failures = 0, 
    api_suspended_until = NULL 
WHERE id = 'target-company-id';
```

### Local Mode (FileStorage):
1. Open `storage/companies_state.json`.
2. Locate the company block by `id`.
3. Set `"consecutive_failures": 0` and `"api_suspended_until": null`.
4. Save the file.
