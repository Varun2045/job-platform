describe('Config Module Tests', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should load config in local mode if Supabase credentials are missing', async () => {
    process.env.SUPABASE_URL = '';
    process.env.SUPABASE_SERVICE_KEY = '';
    process.env.NODE_ENV = 'development';
    process.env.GITHUB_ACTIONS = '';

    // Cache bust dynamic import in Node ESM
    const importPath = '../config/config.js?cachebust=1';
    const { config } = await import(importPath as any);
    expect(config.isLocal).toBe(true);
    expect(config.supabaseUrl).toBe('');
  });

  it('should throw error in production if required variables are missing', async () => {
    process.env.NODE_ENV = 'production';
    process.env.SUPABASE_URL = ''; // Missing
    process.env.SUPABASE_SERVICE_KEY = 'secret';

    const importPath = '../config/config.js?cachebust=2';
    await expect(import(importPath as any)).rejects.toThrow('Environment variable "SUPABASE_URL" is required');
  });

  it('should normalize weights correctly if they do not sum to 100', async () => {
    process.env.WEIGHT_SKILLS = '50';
    process.env.WEIGHT_TITLE = '50';
    process.env.WEIGHT_EXPERIENCE = '50';
    process.env.WEIGHT_LOCATION = '50';
    process.env.WEIGHT_TFIDF = '50'; // total = 250
    process.env.NODE_ENV = 'development';

    const importPath = '../config/config.js?cachebust=3';
    const { config } = await import(importPath as any);
    const weights = config.weights;
    const sum = weights.skills + weights.title + weights.experience + weights.location + weights.tfidf;
    expect(sum).toBe(100);
  });
});
