import fs from 'fs';
import path from 'path';
import { FileStorage } from '../storage/FileStorage.js';

describe('Database & FileStorage V1.1 Migration Test Suite', () => {
  const storageDir = path.join(process.cwd(), 'storage');
  let storage: FileStorage;

  beforeEach(() => {
    storage = new FileStorage();
  });

  it('should initialize missing V1.1 JSON storage files on fresh installation', async () => {
    await storage.initialize();

    const expectedFiles = [
      'offers.json',
      'followups.json',
      'notification_preferences.json',
      'visa_sponsors.json',
      'export_jobs.json',
      'keyword_heatmaps.json',
      'recruiter_interactions.json',
    ];

    for (const fileName of expectedFiles) {
      const filePath = path.join(storageDir, fileName);
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    }
  });

  it('should support repeated initialize() calls without overwriting existing data', async () => {
    await storage.initialize();
    
    // Save test offer
    const testUserId = 'user-migration-test';
    await storage.saveOffer(testUserId, {
      id: 'offer-migration-1',
      applicationId: 'app-mig-1',
      baseSalary: 145000,
      location: 'Remote',
      remoteStatus: 'Remote',
      status: 'Active',
    });

    // Re-initialize storage
    await storage.initialize();

    // Verify existing offer data is intact
    const offers = await storage.getOffers(testUserId);
    expect(offers.length).toBeGreaterThan(0);
    expect(offers[0].baseSalary).toBe(145000);

    // Cleanup
    await storage.deleteOffer(testUserId, 'offer-migration-1');
  });

  it('should migrate V1.0 application objects to default stageOrder = 0.0 without data loss', async () => {
    const appsPath = path.join(storageDir, 'applications.json');
    
    // Inject legacy V1.0 application lacking stageOrder field
    const legacyApps = [
      {
        jobHash: 'hash-legacy-1',
        company: 'LegacyCorp',
        job_id: 'j-1',
        status: 'Saved',
        notes: 'V1.0 application record',
      },
    ];
    fs.writeFileSync(appsPath, JSON.stringify(legacyApps, null, 2), 'utf-8');

    // Run initialization/migration
    await storage.initialize();

    // Verify stageOrder default populated
    const updatedContent = fs.readFileSync(appsPath, 'utf-8');
    const parsedApps = JSON.parse(updatedContent);
    const target = parsedApps.find((a: any) => a.jobHash === 'hash-legacy-1');
    expect(target).toBeDefined();
    expect(target.stageOrder).toBe(0.0);
    expect(target.company).toBe('LegacyCorp');
  });

  it('should verify SQL DDL migration file syntax structure', () => {
    const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', 'V1.1__kanban_crm_offers.sql');
    expect(fs.existsSync(sqlPath)).toBe(true);

    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    expect(sqlContent).toContain('CREATE TABLE IF NOT EXISTS offers');
    expect(sqlContent).toContain('CREATE TABLE IF NOT EXISTS followups');
    expect(sqlContent).toContain('CREATE TABLE IF NOT EXISTS notification_preferences');
    expect(sqlContent).toContain('CREATE TABLE IF NOT EXISTS visa_sponsors');
    expect(sqlContent).toContain('ALTER TABLE job_monitor_applications');
    expect(sqlContent).toContain('CREATE INDEX IF NOT EXISTS');
  });
});
