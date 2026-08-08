# Heroku Scheduler Setup

This project uses Heroku Scheduler for automated tasks that run at specific times.

## Scheduled Tasks

### 1. Midnight Database Refresh (12:00 AM)
- **Command:** `npm run midnight:scrape:now`
- **Frequency:** Daily at 12:00 AM
- **Purpose:** Forces all companies to be scraped to refresh the database
- **Description:** Complete database refresh for all 369 companies

### 2. Daily Job Digest (10:00 PM)
- **Command:** `npm run daily:digest:now`
- **Frequency:** Daily at 10:00 PM
- **Purpose:** Sends daily job summary via Telegram
- **Description:** Send job digest with new jobs from last 24 hours

## Setup Instructions

### 1. Add Heroku Scheduler Add-on

```bash
heroku addons:create scheduler:standard -a job-platform
```

### 2. Configure Scheduled Jobs

#### Option A: Using Heroku Dashboard
1. Go to your Heroku app dashboard
2. Navigate to "Resources" tab
3. Find "Heroku Scheduler" and click on it
4. Add two jobs:

**Job 1 - Midnight Database Refresh:**
- **Name:** midnight-database-refresh
- **Frequency:** Daily
- **Command:** `npm run midnight:scrape:now`
- **Next Run:** 12:00 AM (set to your timezone)

**Job 2 - Daily Job Digest:**
- **Name:** daily-job-digest
- **Frequency:** Daily
- **Command:** `npm run daily:digest:now`
- **Next Run:** 10:00 PM (set to your timezone)

#### Option B: Using Heroku CLI

```bash
# Get scheduler information
heroku scheduler:show -a job-platform

# Add midnight job (Note: CLI scheduler setup is limited, use dashboard for detailed configuration)
```

### 3. Verify Configuration

Check that both jobs are configured correctly:

```bash
heroku scheduler -a job-platform
```

## Important Notes

- **Timezone:** Heroku Scheduler uses UTC by default. Adjust times accordingly for your local timezone.
- **Memory Usage:** The midnight scraper will use significant memory as it scrapes all 369 companies. Monitor your Heroku dyno performance.
- **Telegram Notifications:** Ensure TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are configured for daily digests.
- **Overlapping Jobs:** Ensure jobs don't overlap in time to avoid resource conflicts.

## Manual Testing

You can test the scheduled tasks manually before configuring the scheduler:

```bash
# Test midnight scraper
heroku run "npm run midnight:scrape:now" -a job-platform

# Test daily digest
heroku run "npm run daily:digest:now" -a job-platform
```

## Monitoring

Monitor the execution of scheduled tasks:

```bash
# View recent scheduler runs
heroku scheduler:history -a job-platform

# Check logs
heroku logs --tail -a job-platform
```

## Alternative: Using Cron Expressions

If you prefer more granular control, consider using the Heroku Cron add-on or implementing a custom cron-based solution within the application.