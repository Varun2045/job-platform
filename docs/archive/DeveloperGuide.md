# Developer Guide (Archived)

Orientation guide for engineers contributing to the Job Monitor Platform.

---

## 1. Codebase Structure

- `src/core/`: Contains application bootstrap, metrics exporters, logging, and orchestrator run pipelines.
- `src/companies/`: Scraper Registry, Greenhouse/Lever parser modules, normalizer algorithms, and Cheerio fallback scraper.
- `src/notifications/`: Multi-channel email alerts formatting and transmission handlers.
- `src/storage/`: Supabase and FileStorage data adapter implementations.
- `src/tests/`: Integration, unit, E2E, performance load, and fault tolerance test suites.

---

## 2. Test Guidelines

All tests must run sequentially due to shared file storage resources during local testing runs:

```bash
# Run unit and integration tests sequentially
npm test -- --runInBand

# Run playwright tests
npx playwright test
```

### Adding new Scraper Plugins:
1. Implement the `Scraper` interface from `src/companies/Scraper.ts`.
2. Register the class inside `src/companies/ScraperRegistry.ts`.
3. Provide comprehensive mock HTML unit tests verifying discovery and enrichment selectors.
