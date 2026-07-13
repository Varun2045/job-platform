import { jest } from '@jest/globals';
import { Logger, LogLevel } from '../core/Logger.js';
import fs from 'fs';
import path from 'path';

describe('Logger Unit Tests', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    const logsDir = path.join(process.cwd(), 'logs');
    if (fs.existsSync(logsDir)) {
      const files = fs.readdirSync(logsDir);
      for (const f of files) {
        try {
          fs.unlinkSync(path.join(logsDir, f));
        } catch (e) {}
      }
    }
  });

  it('should log debug, info, warn level messages to console and file', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    Logger.debug('Debug msg', { key: 'val' });
    Logger.info('Info msg');
    Logger.warn('Warn msg');

    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalledTimes(1);

    logSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('should log error level messages with Error objects or strings', () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    Logger.error('Err msg', new Error('Fail'));
    Logger.critical('Critical msg', 'Fail String');

    expect(errSpy).toHaveBeenCalledTimes(2);

    errSpy.mockRestore();
  });

  it('should format company run stats', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    Logger.logCompanyRun('mockcorp', {
      durationMs: 1500,
      jobsFound: 5,
      newJobs: 2,
      scraper: 'GreenhouseScraper',
      status: 'success'
    });

    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should handle file append failures without crashing', () => {
    const appendSpy = jest.spyOn(fs, 'appendFileSync').mockImplementation(() => {
      throw new Error('Disk full');
    });
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    Logger.info('Test write fail');
    expect(errSpy).toHaveBeenCalledWith('FAILED TO WRITE TO DAILY LOG FILE:', expect.any(Error));

    appendSpy.mockRestore();
    errSpy.mockRestore();
  });
});
