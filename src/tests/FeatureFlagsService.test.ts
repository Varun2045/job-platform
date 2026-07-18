import { jest } from '@jest/globals';
import { FeatureFlagsService } from '../core/FeatureFlagsService.js';
import { StorageProvider } from '../storage/StorageProvider.js';

describe('FeatureFlagsService Unit Tests', () => {
  it('should default to true if uninitialized', async () => {
    (FeatureFlagsService as any).storage = undefined;
    const enabled = await FeatureFlagsService.isEnabled('f1');
    expect(enabled).toBe(true);

    await expect(FeatureFlagsService.setFlag('f1', false)).resolves.not.toThrow();
  });

  it('should resolve flags from storage', async () => {
    const mockStorage = {
      getFeatureFlag: async (key: string) => key === 'f-on',
      setFeatureFlag: jest.fn(),
    } as unknown as StorageProvider;

    FeatureFlagsService.initialize(mockStorage);

    expect(await FeatureFlagsService.isEnabled('f-on')).toBe(true);
    expect(await FeatureFlagsService.isEnabled('f-off')).toBe(false);

    await FeatureFlagsService.setFlag('f-new', true);
    expect(mockStorage.setFeatureFlag).toHaveBeenCalledWith('f-new', true);
  });

  it('should default to true on storage read errors', async () => {
    const mockStorage = {
      getFeatureFlag: async () => {
        throw new Error('Timeout');
      },
      setFeatureFlag: async () => {
        throw new Error('Save Error');
      },
    } as unknown as StorageProvider;

    FeatureFlagsService.initialize(mockStorage);

    const enabled = await FeatureFlagsService.isEnabled('any');
    expect(enabled).toBe(true);

    await expect(FeatureFlagsService.setFlag('any', false)).resolves.not.toThrow();
  });
});
