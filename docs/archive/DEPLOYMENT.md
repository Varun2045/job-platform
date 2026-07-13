# Deployment Guide (Archived)

This guide details steps to deploy the Job Monitor Platform in production.

---

## 1. Cloud Mode (Supabase + Resend)

1. **Provision Database**:
   - Create a project on [Supabase](https://supabase.com).
   - Locate the JDBC/SQL connection parameters and database URL/Keys.
2. **Apply Schema**:
   - Run the tables initialization script in the Supabase SQL editor (creating tables: `companies_state`, `jobs`, `applications`, `user_resumes`, `notifications`).
3. **Environment Setup**:
   - Deploy Node.js application to your hosting platform (Vercel, Render, AWS Elastic Beanstalk, or VM).
   - Configure environment variables:
     ```env
     NODE_ENV=production
     SUPABASE_URL=https://your-proj.supabase.co
     SUPABASE_SERVICE_KEY=your-service-role-key
     RESEND_API_KEY=re_your_api_key
     SENDER_EMAIL=alerts@yourdomain.com
     RECIPIENT_EMAIL=you@domain.com
     ```

---

## 2. Docker Deployment

A `Dockerfile` is provided in the repository root for containerized environments.

1. **Build Container**:
   ```bash
   docker build -t job-monitor:latest .
   ```
2. **Run Container**:
   ```bash
   docker run -d \
     --name job-monitor \
     -p 3000:3000 \
     --env-file .env \
     job-monitor:latest
   ```

---

## 3. Playwright Linux Setup

If running inside a headless Linux VM or Docker container, ensure browser dependencies are installed:
```bash
npx playwright install --with-deps chromium
```
This installs the required Chromium libraries for browser scraper fallback runs.
