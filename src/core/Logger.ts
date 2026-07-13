import fs from 'fs';
import path from 'path';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  message: string;
  company?: string;
  durationMs?: number;
  jobsFound?: number;
  newJobs?: number;
  scraper?: string;
  status?: string;
  error?: string;
  [key: string]: any;
}

export class Logger {
  private static getLogFilePath(): string {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const today = new Date().toISOString().split('T')[0];
    return path.join(logsDir, `${today}.json`);
  }

  private static log(level: LogLevel, message: string, meta: Record<string, any> = {}) {
    const timestamp = new Date().toISOString();
    
    // Construct structured log object
    const structuredLog: StructuredLog = {
      timestamp,
      level,
      message,
      ...meta,
    };

    // Human-readable console log format
    const metaString = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
    const consoleMessage = `[${timestamp}] [${level}] ${message}${metaString}`;
    
    if (level === LogLevel.ERROR || level === LogLevel.CRITICAL) {
      console.error(consoleMessage);
    } else if (level === LogLevel.WARN) {
      console.warn(consoleMessage);
    } else {
      console.log(consoleMessage);
    }

    // Append to JSON log file
    try {
      const logFile = Logger.getLogFilePath();
      fs.appendFileSync(logFile, JSON.stringify(structuredLog) + '\n', 'utf-8');
    } catch (e) {
      console.error('FAILED TO WRITE TO DAILY LOG FILE:', e);
    }
  }

  public static debug(message: string, meta?: Record<string, any>) {
    Logger.log(LogLevel.DEBUG, message, meta);
  }

  public static info(message: string, meta?: Record<string, any>) {
    Logger.log(LogLevel.INFO, message, meta);
  }

  public static warn(message: string, meta?: Record<string, any>) {
    Logger.log(LogLevel.WARN, message, meta);
  }

  public static error(message: string, error?: Error | string, meta?: Record<string, any>) {
    const errorMeta = error instanceof Error 
      ? { error: error.message, stack: error.stack }
      : error ? { error } : {};
    Logger.log(LogLevel.ERROR, message, { ...errorMeta, ...meta });
  }

  public static critical(message: string, error?: Error | string, meta?: Record<string, any>) {
    const errorMeta = error instanceof Error 
      ? { error: error.message, stack: error.stack }
      : error ? { error } : {};
    Logger.log(LogLevel.CRITICAL, message, { ...errorMeta, ...meta });
  }

  // Helper for company-specific metrics logging
  public static logCompanyRun(company: string, stats: {
    durationMs: number;
    jobsFound: number;
    newJobs: number;
    scraper: string;
    status: string;
    error?: string;
  }) {
    Logger.info(`Scraped company: ${company}`, {
      company,
      ...stats,
    });
  }
}
