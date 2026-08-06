const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SERVICE_KEY must be set in .env");
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const seedPath = path.join(__dirname, '..', 'config', 'companies.json');
  if (!fs.existsSync(seedPath)) {
    console.error(`ERROR: Seed file not found at ${seedPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(seedPath, 'utf-8');
  const seedConfigs = JSON.parse(raw);

  console.log(`Syncing ${seedConfigs.length} companies from config/companies.json into Supabase...`);

  const dbRows = seedConfigs.map((c) => ({
    id: c.id,
    name: c.name,
    enabled: c.enabled,
    priority: c.priority,
    interval_minutes: c.interval_minutes,
    api_endpoint: c.api_endpoint || null,
    detected_ats: c.detected_ats || null,
    resume_profiles: c.resume_profiles || [],
    consecutive_failures: c.consecutive_failures || 0,
    max_jobs_to_fetch: c.max_jobs_to_fetch ?? null,
    max_pages: c.max_pages ?? null,
    scrape_timeout: c.scrape_timeout ?? null,
    retry_count: c.retry_count ?? null,
    preferred_scraper: c.preferred_scraper ?? null,
  }));

  const { error: upsertError } = await client
    .from('job_monitor_companies')
    .upsert(dbRows, { onConflict: 'id' });

  if (upsertError) {
    console.error('Failed to sync companies in database:', upsertError);
    process.exit(1);
  } else {
    console.log(`Successfully synced all ${dbRows.length} companies into database.`);
  }

  // Double check Anyscale specifically
  const { data, error } = await client
    .from('job_monitor_companies')
    .select('id, name, api_endpoint, detected_ats')
    .eq('id', 'anyscale')
    .single();

  if (error) {
    console.error('Failed to fetch Anyscale row:', error);
  } else {
    console.log('Verified Anyscale row in Supabase:', data);
  }
}

main().catch(err => {
  console.error('Migration script crashed:', err);
  process.exit(1);
});
