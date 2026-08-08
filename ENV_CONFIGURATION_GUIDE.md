# Environment Configuration Guide for Advanced Scraping Features

This guide explains the environment variables needed for the newly implemented advanced scraping features.

## Quick Setup

### 1. Redis Configuration (Optional but Recommended)

For distributed Cloudflare token caching across multiple instances:

```env
REDIS_URL=redis://localhost:6379
```

Or use individual variables:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0
```

**Note:** If Redis is not configured, the system will fall back to in-memory caching automatically.

### 2. CAPTCHA Solving Configuration (Optional)

For automatic CAPTCHA solving with 2Captcha or Anti-Captcha:

```env
CAPTCHA_API_KEY=your_api_key_here
CAPTCHA_PROVIDER=2captcha
```

**Providers:**
- `2captcha` - https://2captcha.com
- `anticaptcha` - https://anti-captcha.com

**Note:** Leave empty to disable CAPTCHA solving. Without this, CAPTCHAs will need to be handled manually.

### 3. Proxy Configuration (Optional)

For proxy rotation and IP distribution:

```env
PROXY_POOL_1=http://proxy1.example.com:8080
PROXY_POOL_2=http://proxy2.example.com:8080
PROXY_POOL_3=http://proxy3.example.com:8080
```

With authentication:
```env
PROXY_USERNAME=your_username
PROXY_PASSWORD=your_password
PROXY_PROVIDER=custom
```

**Providers:**
- `brightdata` - Bright Data proxies
- `smartproxy` - SmartProxy proxies
- `custom` - Custom proxy list

## Feature-Specific Requirements

### Features That Work Out-of-the-Box ✅

These features require no additional configuration:

1. **Mobile App API Spoofing** - Works with default headers
2. **XML Sitemap Parsing** - Uses Cheerio (already installed)
3. **HTTP/2 Support** - Uses got library (already installed)
4. **User-Agent Client Hints** - Implemented in HttpClient
5. **Persistent User Profiles** - Uses Playwright (already installed)
6. **CDP Connection** - Uses Playwright (already installed)
7. **Sticky Session Management** - Implemented in HttpClient
8. **Jitter and Backoff Intervals** - Implemented in HttpClient
9. **Browser Fingerprint Evasion** - Uses Playwright (already installed)
10. **Cloudflare Turnstile Bypass** - Uses Playwright (already installed)

### Features That Require Configuration 🔧

#### Cloudflare Token Harvesting
- **Required:** Redis (optional, falls back to in-memory)
- **Environment Variables:** `REDIS_URL` or `REDIS_HOST` + `REDIS_PORT`
- **Purpose:** Distributed caching of Cloudflare challenge tokens

#### CAPTCHA Solving
- **Required:** CAPTCHA service API key
- **Environment Variables:** `CAPTCHA_API_KEY`, `CAPTCHA_PROVIDER`
- **Purpose:** Automatic solving of reCAPTCHA, hCaptcha, and image CAPTCHAs

#### Proxy Rotation
- **Required:** Proxy URLs (optional)
- **Environment Variables:** `PROXY_POOL_*`, `PROXY_USERNAME`, `PROXY_PASSWORD`
- **Purpose:** IP rotation and traffic distribution

## Minimal Configuration

For a basic setup with all features working (using in-memory fallbacks):

```env
# No additional configuration needed!
# All features will work with in-memory caching and no proxies.
```

## Production Configuration

For production use with distributed caching and CAPTCHA solving:

```env
# Redis for distributed token caching
REDIS_URL=redis://your-redis-instance:6379

# CAPTCHA solving
CAPTCHA_API_KEY=your_2captcha_api_key
CAPTCHA_PROVIDER=2captcha

# Proxy rotation (optional but recommended)
PROXY_POOL_1=http://user:pass@proxy1.example.com:8080
PROXY_POOL_2=http://user:pass@proxy2.example.com:8080
PROXY_POOL_3=http://user:pass@proxy3.example.com:8080
PROXY_USERNAME=user
PROXY_PASSWORD=pass
PROXY_PROVIDER=custom
```

## Testing Configuration

To test specific features:

### Test Redis Connection
```env
REDIS_URL=redis://localhost:6379
```

### Test CAPTCHA Solving
```env
CAPTCHA_API_KEY=test_api_key
CAPTCHA_PROVIDER=2captcha
```

### Test Proxy Rotation
```env
PROXY_POOL_1=http://localhost:8080
```

## Troubleshooting

### Redis Connection Fails
- Ensure Redis is running: `redis-server`
- Check connection string format
- System will fall back to in-memory cache automatically

### CAPTCHA Solving Not Working
- Verify API key is correct
- Check account balance
- Ensure provider is supported (2Captcha or Anti-Captcha)

### Proxy Rotation Not Working
- Verify proxy URLs are accessible
- Check authentication credentials
- Test proxies manually first

## Security Notes

1. **Never commit `.env` files** to version control
2. **Use strong passwords** for Redis and proxy authentication
3. **Rotate API keys** regularly
4. **Use environment-specific configurations** (dev, staging, production)
5. **Monitor usage** of CAPTCHA services to avoid unexpected charges

## Dependencies

The following dependency was added to support these features:

```json
{
  "dependencies": {
    "redis": "^4.6.12"
  },
  "devDependencies": {
    "@types/redis": "^4.0.11"
  }
}
```

Install with:
```bash
npm install
```

## Next Steps

1. Copy `.env.example` to `.env`
2. Configure the variables you need
3. Run `npm install` to add Redis dependency
4. Run `npm run build` to compile TypeScript
5. Start the server: `npm start`

## Additional Resources

- **Redis Documentation:** https://redis.io/docs/
- **2Captcha API:** https://2captcha.com/2captcha-api
- **Anti-Captcha API:** https://anti-captcha.com/apidoc
- **Playwright Documentation:** https://playwright.dev/docs/emulation