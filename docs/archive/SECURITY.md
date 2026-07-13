# Security Architecture - Job Monitor Portal (Archived)

This document summarizes security configurations applied to the Job Monitor Portal.

## 1. Network & Header Protections

### Helmet Middleware
The server integrates Helmet middleware to enforce secure HTTP headers:
- **Content-Security-Policy (CSP)**: Restrictions mapping allowed scripts, font faces, and images domains.
- **X-Frame-Options**: Enforced to `SAMEORIGIN` to mitigate clickjacking attacks.
- **X-Content-Type-Options**: Set to `nosniff` preventing MIME type sniffing.

### CORS Whitelisting
Cross-Origin Resource Sharing is locked down to verified origin domains:
- Allowed development hosts: `localhost:5173`, `127.0.0.1:5173`, `localhost:3000`.
- Arbitrary untrusted origins are blocked with connection exceptions.

## 2. API Rate Limiting
Rate limiters protect the API gateway `/api/*`:
- Limits each unique client IP to 100 requests per 15 minutes window.
- Exceeded rate limits return a standard HTTP 429 status code.

## 3. Input Sanitization
To prevent XSS, SQL/Script injections, and HTML injection:
- The server recursively sweeps all strings in `req.body`, `req.query`, and `req.params`.
- Harmful HTML tags and script elements matching `<[^>]*>` regexes are completely stripped out before routing handlers.
