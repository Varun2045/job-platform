import fs from 'fs';
import path from 'path';
import { FileStorage } from '../storage/FileStorage.js';
import { FeatureFlagsService } from '../core/FeatureFlagsService.js';
import { AuditLogger } from '../core/AuditLogger.js';

describe('Version 3.0.0 SaaS Multi-Tenant & Security Integration', () => {
  const storage = new FileStorage();
  const userIdA = 'user-a-uuid';
  const userIdB = 'user-b-uuid';

  beforeAll(async () => {
    const testFiles = [
      'applications.json',
      'profiles.json',
      'user_resumes.json',
      'saved_searches.json',
      'watchlists.json',
      'user_notifications.json',
      'audit_logs.json',
      'feature_flags.json',
      'extended_settings.json',
    ];
    for (const f of testFiles) {
      const fp = path.join(process.cwd(), 'storage', f);
      if (fs.existsSync(fp)) {
        try {
          fs.unlinkSync(fp);
        } catch {}
      }
    }

    await storage.initialize();
    FeatureFlagsService.initialize(storage);
    AuditLogger.initialize(storage);
  });

  it('should isolate applications data between different users', async () => {
    const appA = {
      jobHash: 'hash-123',
      company: 'Google',
      jobId: '1',
      status: 'Applied' as const,
      notes: 'Notes A',
      lastUpdated: new Date().toISOString(),
    };
    const appB = {
      jobHash: 'hash-123',
      company: 'Google',
      jobId: '1',
      status: 'Interview' as const,
      notes: 'Notes B',
      lastUpdated: new Date().toISOString(),
    };

    await storage.saveApplication(appA, userIdA);
    await storage.saveApplication(appB, userIdB);

    const appsA = await storage.getApplications(userIdA);
    const appsB = await storage.getApplications(userIdB);

    expect(appsA.length).toBe(1);
    expect(appsA[0].notes).toBe('Notes A');
    expect(appsA[0].status).toBe('Applied');

    expect(appsB.length).toBe(1);
    expect(appsB[0].notes).toBe('Notes B');
    expect(appsB[0].status).toBe('Interview');
  });

  it('should isolate user settings profiles and metadata', async () => {
    const profileA = { name: 'Alice', role: 'User' };
    const profileB = { name: 'Bob', role: 'Viewer' };

    await storage.saveProfile(userIdA, profileA);
    await storage.saveProfile(userIdB, profileB);

    const resA = await storage.getProfile(userIdA);
    const resB = await storage.getProfile(userIdB);

    expect(resA?.name).toBe('Alice');
    expect(resA?.role).toBe('User');
    expect(resB?.name).toBe('Bob');
    expect(resB?.role).toBe('Viewer');
  });

  it('should isolate watchlists and saved searches per user tenant', async () => {
    await storage.saveWatchlist(userIdA, 'Remote list', { location: 'remote' });
    await storage.saveWatchlist(userIdB, 'Onsite list', { location: 'onsite' });

    const wA = await storage.getWatchlists(userIdA);
    const wB = await storage.getWatchlists(userIdB);

    expect(wA.length).toBe(1);
    expect(wA[0].name).toBe('Remote list');
    expect(wB.length).toBe(1);
    expect(wB[0].name).toBe('Onsite list');
  });

  it('should write and retrieve notifications in real-time', async () => {
    await storage.saveUserNotification(userIdA, 'Job Match', 'New backend dev role found');
    await storage.saveUserNotification(userIdA, 'Scraper Alert', 'Scraper finished running');

    const notifs = await storage.getUserNotifications(userIdA);
    expect(notifs.length).toBe(2);
    expect(notifs.filter((n) => !n.is_read).length).toBe(2);

    await storage.markNotificationRead(userIdA, notifs[0].id);
    const updatedNotifs = await storage.getUserNotifications(userIdA);
    expect(updatedNotifs.find((n) => n.id === notifs[0].id)?.is_read).toBe(true);

    await storage.clearUserNotifications(userIdA);
    const emptyNotifs = await storage.getUserNotifications(userIdA);
    expect(emptyNotifs.length).toBe(0);
  });

  it('should maintain immutable audit log records', async () => {
    await AuditLogger.log(userIdA, 'Login', { browser: 'Chrome' }, '192.168.1.1');
    const logs = await storage.getAuditLogs();
    expect(logs.length).toBeGreaterThan(0);
    const match = logs.find((l) => l.user_id === userIdA && l.action === 'Login');
    expect(match).toBeDefined();
    expect(match?.ip_address).toBe('192.168.1.1');
  });

  it('should fetch and update runtime Feature Flags settings', async () => {
    await FeatureFlagsService.setFlag('ai_suggestions', false);
    const val1 = await FeatureFlagsService.isEnabled('ai_suggestions');
    expect(val1).toBe(false);

    await FeatureFlagsService.setFlag('ai_suggestions', true);
    const val2 = await FeatureFlagsService.isEnabled('ai_suggestions');
    expect(val2).toBe(true);
  });
});
