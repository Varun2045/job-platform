import fs from 'fs';
import path from 'path';
import { StorageProvider } from '../storage/StorageProvider.js';
import { Logger } from './Logger.js';

export interface SystemBackupPayload {
  version: string;
  timestamp: string;
  companies: any[];
  applications: any[];
  extendedSettings: any | null;
  analyses: any[];
}

export class BackupService {
  public static async exportBackup(storage: StorageProvider): Promise<SystemBackupPayload> {
    Logger.info('Initiating system database and configuration backup export...');
    const companies = await storage.getAllCompanies();
    const applications = await storage.getApplications();
    const extendedSettings = await storage.getExtendedSettings();

    const analyses: any[] = [];
    for (const comp of companies) {
      try {
        const jobs = await storage.getCompanyJobs(comp.id);
        for (const job of jobs) {
          const analysis = await storage.getJobAnalysis(job.jobHash);
          if (analysis) {
            analyses.push(analysis);
          }
        }
      } catch {}
    }

    return {
      version: '2.2.0',
      timestamp: new Date().toISOString(),
      companies,
      applications,
      extendedSettings,
      analyses,
    };
  }

  public static async importBackup(storage: StorageProvider, backup: SystemBackupPayload): Promise<void> {
    Logger.info(`Restoring system configuration and database states from backup timestamped ${backup.timestamp}...`);

    // 1. Restore Extended Settings
    if (backup.extendedSettings) {
      await storage.saveExtendedSettings(backup.extendedSettings);
    }

    // 2. Restore Companies configs
    for (const company of backup.companies) {
      if (typeof (storage as any).client !== 'undefined' && !(storage as any).config?.isLocal) {
        const supabase = (storage as any).client;
        const payload = { ...company };
        delete payload.last_seen_timestamp;
        await supabase.from('job_monitor_companies').upsert(payload);
      } else {
        const configPath = path.join(process.cwd(), 'storage', 'companies.json');
        let current: any[] = [];
        if (fs.existsSync(configPath)) {
          current = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        }
        const idx = current.findIndex((c) => c.id === company.id);
        if (idx !== -1) {
          current[idx] = company;
        } else {
          current.push(company);
        }
        fs.writeFileSync(configPath, JSON.stringify(current, null, 2), 'utf-8');
      }
    }

    // 3. Restore Applications
    for (const app of backup.applications) {
      await storage.saveApplication(app);
    }

    // 4. Restore Job Analyses
    for (const analysis of backup.analyses) {
      await storage.saveJobAnalysis(analysis);
    }

    Logger.info('System restore operation finalized successfully.');
  }

  public static async triggerAutoBackup(storage: StorageProvider): Promise<void> {
    try {
      const backupDir = path.join(process.cwd(), 'storage', 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const backup = await this.exportBackup(storage);
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `backup-${dateStr}-${Date.now()}.json`;
      const backupPath = path.join(backupDir, filename);

      fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), 'utf-8');
      Logger.info(`Automatic daily backup successfully saved to: ${backupPath}`);

      const files = fs
        .readdirSync(backupDir)
        .filter((f) => f.startsWith('backup-') && f.endsWith('.json'))
        .map((f) => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time);

      if (files.length > 5) {
        const filesToDelete = files.slice(5);
        for (const f of filesToDelete) {
          fs.unlinkSync(path.join(backupDir, f.name));
          Logger.info(`Purged old system backup: ${f.name}`);
        }
      }
    } catch (e: any) {
      Logger.error('Failed to trigger automatic system backup', e);
    }
  }
}
