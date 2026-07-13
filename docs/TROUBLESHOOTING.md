# Troubleshooting Runbook

Solutions to common issues encountered during setup or operation.

---

## 1. E2E Browser Assets Fail to Load

### Symptom:
E2E Playwright tests fail with network asset load errors, or dashboard components fail to render CSS styling.

### Cause:
CORS restrictions blocking localhost cross-origin requests on dynamic testing ports.

### Solution:
Verify that loopback addresses are properly permitted by the server. Ensure that the CORS middleware whitelists local origins on any port:
```typescript
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
```

---

## 2. SMTP Notification Fails / Scraper Crashes

### Symptom:
Scraper run halts unexpectedly, throwing `SMTP Connection Refused` or `Resend API timeout` exceptions.

### Cause:
The email provider was unreachable, and the email dispatch block was not caught, preventing post-run statistics from writing to storage.

### Solution:
Ensure the email dispatch block in `index.ts` is wrapped in a try/catch block so that notification provider issues are logged as warning states without blocking database metrics writing or backups.
