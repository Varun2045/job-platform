# Heroku Deployment Guide

## Environment Variables Configuration

### Core & Security Variables
```bash
# Application Environment
heroku config:set NODE_ENV=production

# Security Secrets (REQUIRED - minimum 32 characters)
heroku config:set JWT_SECRET=your_super_secret_jwt_key_32bytes_minimum_for_production_security
heroku config:set SESSION_SECRET=your_super_secret_session_key_32bytes_minimum_for_production_security

# CORS Configuration
heroku config:set CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Rate Limiting
heroku config:set RATE_LIMIT_WINDOW_MS=900000
heroku config:set RATE_LIMIT_MAX_REQUESTS=100
```

### Database & Supabase Integration
```bash
# PostgreSQL (Heroku Postgres addon)
heroku config:set DATABASE_URL=postgres://user:password@host:5432/dbname?sslmode=require

# Supabase Configuration (if using Supabase instead of Heroku Postgres)
heroku config:set STORAGE_MODE=supabase
heroku config:set SUPABASE_URL=https://your-project.supabase.co
heroku config:set SUPABASE_ANON_KEY=your_supabase_anon_key
heroku config:set SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Circuit Breaker & Resiliency Configuration
```bash
# Circuit Breaker Settings
heroku config:set CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
heroku config:set CIRCUIT_BREAKER_RESET_TIMEOUT_MS=30000
heroku config:set CIRCUIT_BREAKER_HALF_OPEN_MAX_CALLS=3
```

### Playwright Configuration
```bash
# Playwright Browser Pool Settings
heroku config:set PLAYWRIGHT_TIMEOUT=30000
heroku config:set PLAYWRIGHT_CONCURRENCY=2
heroku config:set PLAYWRIGHT_HEADLESS=true
```

### AI & LLM Providers
```bash
# OpenAI Configuration
heroku config:set OPENAI_API_KEY=sk-proj-your-openai-api-key

# Gemini Configuration (alternative)
heroku config:set GEMINI_API_KEY=your-gemini-api-key
```

### Email & Notifications
```bash
# Resend Email Service
heroku config:set RESEND_API_KEY=re_your_resend_api_key
heroku config:set EMAIL_FROM=alerts@yourdomain.com
heroku config:set NOTIFICATION_EMAIL_SENDER=alerts@yourdomain.com
heroku config:set NOTIFICATION_EMAIL_RECIPIENT=user@example.com

# Telegram Bot
heroku config:set TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
heroku config:set TELEGRAM_CHAT_ID=-100123456789
```

### Feature Flags
```bash
# Feature Flags Configuration
heroku config:set FEATURE_RESUME_MATCHING=true
heroku config:set FEATURE_DASHBOARD=true
heroku config:set FEATURE_SCREENSHOTS=true
heroku config:set FEATURE_PLAYWRIGHT=true
heroku config:set FEATURE_EMAIL=true
heroku config:set FEATURE_EXPLAINABLE_AI=true
heroku config:set FEATURE_ADVANCED_TAGS=true
heroku config:set FEATURE_MULTI_DEPARTMENT=true
heroku config:set FEATURE_RULE_ENGINE=true
heroku config:set FEATURE_WEIGHTED_KEYWORDS=true
```

### Monitoring & APM Integration
```bash
# New Relic APM (optional)
heroku config:set NEW_RELIC_LICENSE_KEY=your_new_relic_license_key
heroku config:set NEW_RELIC_APP_NAME=job-platform-prod

# Datadog APM (alternative)
heroku config:set DATADOG_API_KEY=your_datadog_api_key
heroku config:set DATADOG_SITE=datadoghq.com
heroku config:set DD_ENV=production
heroku config:set DD_SERVICE=job-platform-backend
```

## Deployment Commands

### Initial Setup
```bash
# Login to Heroku
heroku login

# Create new Heroku app
heroku create job-platform-prod

# Or use existing app
heroku git:remote -a job-platform-prod

# Add Playwright buildpack (required for headless Chrome)
heroku buildpacks:add --index 1 https://github.com/mxschmitt/heroku-buildpack-playwright.git
heroku buildpacks:add --index 2 heroku/nodejs

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Set buildpacks
heroku buildpacks:set https://github.com/mxschmitt/heroku-buildpack-playwright.git
heroku buildpacks:add heroku/nodejs
```

### Configuration Setup
```bash
# Set production environment variables
heroku config:set NODE_ENV=production
heroku config:set LOG_LEVEL=info

# Set security secrets (use heroku config:protect for sensitive values)
heroku config:set JWT_SECRET=your_production_jwt_secret_minimum_32_chars
heroku config:set SESSION_SECRET=your_production_session_secret_minimum_32_chars

# Set storage mode
heroku config:set STORAGE_MODE=supabase

# Configure Playwright for Heroku
heroku config:set PLAYWRIGHT_CONCURRENCY=2
heroku config:set PLAYWRIGHT_HEADLESS=true
```

### Deployment
```bash
# Push to Heroku main branch
git push heroku main

# Or deploy from specific branch
git push heroku your-branch:main

# Scale dynos if needed
heroku ps:scale web=1 worker=1

# View logs
heroku logs --tail

# Check application status
heroku ps
heroku config
```

### Post-Deployment Verification
```bash
# Check if application is running
heroku ps

# Check recent logs for errors
heroku logs --tail --num 50

# Test health endpoint
curl https://job-platform-prod.herokuapp.com/health

# Test readiness endpoint  
curl https://job-platform-prod.herokuapp.com/ready

# Check application metrics
heroku ps --type web
```

## Scaling Considerations

### Web Dynos
```bash
# Scale based on traffic
heroku ps:scale web=1:Standard-1X    # Basic (1GB RAM, 1 CPU)
heroku ps:scale web=1:Standard-2X    # Medium (2.5GB RAM, 2 CPUs)
heroku ps:scale web=1:Performance-M   # Performance (8GB RAM, 4 CPUs)

# Auto-scaling with performance dynos
heroku addons:create heroku-postgresql:standard-0
heroku ps:scale web=1:Performance-M
```

### Worker Dynos
```bash
# Scale worker for background scraping
heroku ps:scale worker=1:Standard-1X

# For high-volume scraping
heroku ps:scale worker=2:Standard-1X
```

## Troubleshooting

### Common Issues

**Issue**: Application fails to start with JWT_SECRET validation error
```bash
# Solution: Set proper JWT_SECRET
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
```

**Issue**: Playwright buildpack fails
```bash
# Solution: Ensure buildpacks are in correct order
heroku buildpacks
heroku buildpacks:clear
heroku buildpacks:add https://github.com/mxschmitt/heroku-buildpack-playwright.git
heroku buildpacks:add heroku/nodejs
```

**Issue**: Memory errors during scraping
```bash
# Solution: Reduce Playwright concurrency or upgrade dyno size
heroku config:set PLAYWRIGHT_CONCURRENCY=1
heroku ps:scale web=1:Standard-2X
```

**Issue**: Database connection errors
```bash
# Solution: Check DATABASE_URL and connection pooling
heroku config:get DATABASE_URL
heroku pg:info
```

### Performance Monitoring

```bash
# Check dyno performance
heroku ps --type web

# View application metrics
heroku addons:attach heroku-postgresql --app job-platform-prod
heroku pg:psql --app job-platform-prod

# Monitor real-time metrics
heroku logs --tail --app job-platform-prod
```

## Security Best Practices for Heroku

1. **Use Heroku Config Vars**: Never commit secrets to git
2. **Enable SSL**: Ensure SSL is configured for all domains
3. **Use Private Spaces**: For sensitive data, consider Heroku Private Spaces
4. **Regular Updates**: Keep buildpacks and dependencies updated
5. **Access Control**: Use Heroku SSO for team access management
6. **Audit Logs**: Regularly review Heroku audit logs for suspicious activity

## Backup Strategy

```bash
# Enable automated backups for PostgreSQL
heroku addons:create heroku-postgresql:standard-0
heroku pg:backups schedule --at '02:00 America/Los_Angeles' --app job-platform-prod

# Manual backup
heroku pg:backups:capture --app job-platform-prod

# Restore from backup
heroku pg:backups:restore --app job-platform-prod BACKUP_ID
```

## Continuous Deployment

### GitHub Actions Integration
```yaml
# .github/workflows/deploy.yml
name: Deploy to Heroku
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: akhileshns/heroku-deploy@v3.13.15
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: "job-platform-prod"
          heroku_email: "your-email@example.com"
```

### Automated Testing Before Deployment
```bash
# Add to package.json scripts
"predeploy": "npm run lint && npm run test"
"deploy": "git push heroku main"
```

## Maintenance Windows

```bash
# Put app into maintenance mode
heroku maintenance:on

# Run migrations or maintenance tasks
heroku run node dist/cli/admin.js migrate

# Disable maintenance mode
heroku maintenance:off
```

## Resource Optimization

### Memory Management
```bash
# Monitor memory usage
heroku logs --tail | grep "memory"

# Adjust Playwright concurrency based on dyno size
# Standard-1X: PLAYWRIGHT_CONCURRENCY=2
# Standard-2X: PLAYWRIGHT_CONCURRENCY=3
# Performance-M: PLAYWRIGHT_CONCURRENCY=4
```

### Connection Pooling
```bash
# Configure database connection pool
heroku config:set DATABASE_POOL_MIN=2
heroku config:set DATABASE_POOL_MAX=20
```

This deployment guide ensures a secure, performant, and maintainable Heroku deployment for the Job Platform.
