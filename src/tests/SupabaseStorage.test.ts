import { jest } from '@jest/globals';

let mockResolveValue: any = { data: null, error: null, count: 0 };

const queryBuilder: any = {};
queryBuilder.select = jest.fn().mockImplementation(() => queryBuilder);
queryBuilder.eq = jest.fn().mockImplementation(() => queryBuilder);
queryBuilder.is = jest.fn().mockImplementation(() => queryBuilder);
queryBuilder.delete = jest.fn().mockImplementation(() => queryBuilder);
queryBuilder.order = jest.fn().mockImplementation(() => queryBuilder);
queryBuilder.single = jest.fn().mockImplementation(() => queryBuilder);
queryBuilder.limit = jest.fn().mockImplementation(() => queryBuilder);
queryBuilder.insert = jest.fn().mockImplementation(() => queryBuilder);
queryBuilder.update = jest.fn().mockImplementation(() => queryBuilder);
queryBuilder.upsert = jest.fn().mockImplementation(() => queryBuilder);

queryBuilder.then = (resolve: any) => Promise.resolve(mockResolveValue).then(resolve);

const mockFrom = jest.fn<any>().mockImplementation(() => queryBuilder);
const mockRpc = jest.fn<any>().mockResolvedValue({ data: true, error: null } as any);

jest.unstable_mockModule('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: mockFrom,
    rpc: mockRpc,
  }),
}));

const { SupabaseStorage } = await import('../storage/SupabaseStorage.js');
const { config } = await import('../config/config.js');

describe('SupabaseStorage Unit Tests', () => {
  let storage: any;

  beforeAll(() => {
    config.supabaseUrl = 'https://test-id.supabase.co';
    config.supabaseServiceKey = 'test-secret';
    storage = new SupabaseStorage();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockResolveValue = { data: null, error: null, count: 0 };
  });

  it('should initialize and run connection check/migration check successfully', async () => {
    mockResolveValue = { data: [], error: null, count: 1 };
    await expect(storage.initialize()).resolves.not.toThrow();
  });

  it('should handle migration failure gracefully', async () => {
    mockResolveValue = { data: null, error: { message: 'DB Unreachable' } };
    await expect(storage.initialize()).rejects.toThrow('Failed to connect to Supabase');
  });

  it('should fetch company config', async () => {
    const mockCompany = { id: 'google', name: 'Google', enabled: true };
    mockResolveValue = { data: mockCompany, error: null };

    const result = await storage.getCompanyConfig('google');
    expect(result).toEqual(mockCompany);
  });

  it('should return null when company config error occurs', async () => {
    mockResolveValue = { data: null, error: { message: 'Query failed' } };
    const result = await storage.getCompanyConfig('google');
    expect(result).toBeNull();
  });

  it('should fetch enabled companies', async () => {
    const mockCompanies = [{ id: 'google', enabled: true }];
    mockResolveValue = { data: mockCompanies, error: null };

    const result = await storage.getEnabledCompanies();
    expect(result).toEqual(mockCompanies);
  });

  it('should fetch all companies', async () => {
    const mockCompanies = [{ id: 'google' }, { id: 'groww' }];
    mockResolveValue = { data: mockCompanies, error: null };

    const result = await storage.getAllCompanies();
    expect(result).toEqual(mockCompanies);
  });

  it('should update company scrape state', async () => {
    mockResolveValue = { error: null };
    await expect(storage.updateCompanyScrapeState('google', { consecutive_failures: 0 })).resolves.not.toThrow();
  });

  it('should fetch jobs state for a company', async () => {
    const mockJobs = [{ id: '123', title: 'SDE' }];
    mockResolveValue = { data: { jobs_data: mockJobs }, error: null };

    const result = await storage.getCompanyJobs('google');
    expect(result).toEqual(mockJobs);
  });

  it('should save jobs state for a company', async () => {
    mockResolveValue = { error: null };
    await expect(storage.saveCompanyJobs('google', [])).resolves.not.toThrow();
  });

  it('should check if a job has already been notified', async () => {
    mockResolveValue = { count: 1, error: null };
    const result = await storage.isJobNotified('hash123');
    expect(result).toBe(true);
  });

  it('should save notified job hash', async () => {
    mockResolveValue = { error: null };
    await expect(storage.saveJobNotified('hash123')).resolves.not.toThrow();
  });

  it('should get cached match score', async () => {
    mockResolveValue = { data: { score: 95 }, error: null };
    const result = await storage.getCachedScore('hash', 'backend', 'v1');
    expect(result).toBe(95);
  });

  it('should save match score cache', async () => {
    mockResolveValue = { error: null };
    await expect(storage.saveCachedScore('hash', 'backend', 95, 'v1')).resolves.not.toThrow();
  });

  it('should save run execution statistics', async () => {
    mockResolveValue = { error: null };
    await expect(storage.saveRunStats({ durationMs: 100 })).resolves.not.toThrow();
  });

  // Profiles
  it('should get and save user profiles', async () => {
    const profile = { name: 'Alice', role: 'User' };
    mockResolveValue = { data: profile, error: null };
    const res = await storage.getProfile('user-id');
    expect(res).toEqual(profile);

    mockResolveValue = { error: null };
    await expect(storage.saveProfile('user-id', profile)).resolves.not.toThrow();
  });

  // Resumes
  it('should get, save, and delete user resumes', async () => {
    const resumes = [{ profile_name: 'CV', content: 'SDE text' }];
    mockResolveValue = { data: resumes, error: null };
    const res = await storage.getUserResumes('user-id');
    expect(res.length).toBe(1);

    mockResolveValue = { error: null };
    await expect(storage.saveUserResume('user-id', 'CV', 'content')).resolves.not.toThrow();
    await expect(storage.deleteUserResume('user-id', 'CV')).resolves.not.toThrow();
  });

  // Saved Searches
  it('should manage saved searches', async () => {
    mockResolveValue = { data: [{ id: 's1', name: 'search' }], error: null };
    const res = await storage.getSavedSearches('user-id');
    expect(res.length).toBe(1);

    mockResolveValue = { error: null };
    await expect(storage.saveSavedSearch('user-id', 'search', {})).resolves.not.toThrow();
    await expect(storage.deleteSavedSearch('user-id', 's1')).resolves.not.toThrow();
  });

  // Watchlists
  it('should manage watchlists', async () => {
    mockResolveValue = { data: [{ id: 'w1', name: 'watch' }], error: null };
    const res = await storage.getWatchlists('user-id');
    expect(res.length).toBe(1);

    mockResolveValue = { error: null };
    await expect(storage.saveWatchlist('user-id', 'watch', {})).resolves.not.toThrow();
    await expect(storage.deleteWatchlist('user-id', 'w1')).resolves.not.toThrow();
  });

  // Notifications
  it('should manage user notifications', async () => {
    mockResolveValue = { data: [{ id: 'n1', title: 'New Job' }], error: null };
    const res = await storage.getUserNotifications('user-id');
    expect(res.length).toBe(1);

    mockResolveValue = { error: null };
    await expect(storage.saveUserNotification('user-id', 'New Job', 'Msg')).resolves.not.toThrow();
    await expect(storage.markNotificationRead('user-id', 'n1')).resolves.not.toThrow();
    await expect(storage.clearUserNotifications('user-id')).resolves.not.toThrow();
  });

  // Audit Logs
  it('should query and save audit logs', async () => {
    mockResolveValue = { data: [{ action: 'login' }], error: null };
    const logs = await storage.getAuditLogs('user-id');
    expect(logs.length).toBe(1);

    mockResolveValue = { error: null };
    await expect(storage.saveAuditLog('user-id', 'login', {}, '127.0.0.1')).resolves.not.toThrow();
  });

  // Feature Flags
  it('should get and set feature flags', async () => {
    mockResolveValue = { data: [{ key: 'f1', enabled: true }], error: null };
    const flags = await storage.getFeatureFlags();
    expect(flags.length).toBe(1);

    mockResolveValue = { data: { enabled: false }, error: null };
    const enabled = await storage.getFeatureFlag('f1');
    expect(enabled).toBe(false);

    mockResolveValue = { error: null };
    await expect(storage.setFeatureFlag('f1', true)).resolves.not.toThrow();
  });

  // Copilot Recommendations
  it('should manage recommendations', async () => {
    mockResolveValue = { data: [{ recommendations: ['rec1'] }], error: null };
    const recs = await storage.getCopilotRecommendations('user-id');
    expect(recs.length).toBe(1);

    mockResolveValue = { error: null };
    await expect(storage.saveCopilotRecommendations('user-id', ['rec1'])).resolves.not.toThrow();
  });

  // Learning Roadmaps
  it('should manage learning roadmaps', async () => {
    mockResolveValue = { data: { roadmap: { tasks: [] } }, error: null };
    const map = await storage.getLearningRoadmap('user-id');
    expect(map).toHaveProperty('tasks');

    mockResolveValue = { error: null };
    await expect(storage.saveLearningRoadmap('user-id', { tasks: [] })).resolves.not.toThrow();
  });

  // Mock Interview Sessions
  it('should manage interview sessions', async () => {
    mockResolveValue = { data: [{ id: 'i1' }], error: null };
    const sessions = await storage.getInterviewSessions('user-id');
    expect(sessions.length).toBe(1);

    mockResolveValue = { error: null };
    await expect(storage.saveInterviewSession('user-id', { id: 'i1', session_type: 'Coding' })).resolves.not.toThrow();
  });

  // Career Roadmaps
  it('should manage career roadmaps', async () => {
    mockResolveValue = { data: { roadmap_data: {} }, error: null };
    const map = await storage.getCareerRoadmap('user-id');
    expect(map).toBeDefined();

    mockResolveValue = { error: null };
    await expect(storage.saveCareerRoadmap('user-id', {})).resolves.not.toThrow();
  });

  // Daily Briefs
  it('should manage daily briefs', async () => {
    mockResolveValue = { data: { brief_data: {} }, error: null };
    const brief = await storage.getDailyBrief('user-id');
    expect(brief).toBeDefined();

    mockResolveValue = { error: null };
    await expect(storage.saveDailyBrief('user-id', {})).resolves.not.toThrow();
  });

  // Applications
  it('should manage applications', async () => {
    mockResolveValue = { data: [{ company: 'G' }], error: null };
    const apps = await storage.getApplications('user-id');
    expect(apps.length).toBe(1);

    mockResolveValue = { error: null };
    await expect(storage.saveApplication({ jobHash: 'h', company: 'G', jobId: '1', status: 'Applied' }, 'user-id')).resolves.not.toThrow();
  });
});
