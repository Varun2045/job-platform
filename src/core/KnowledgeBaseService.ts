import { StorageProvider } from '../storage/StorageProvider.js';
import { Logger } from './Logger.js';

export interface KBResult {
  category: 'Job' | 'Company' | 'Interview' | 'Resume';
  title: string;
  subtitle: string;
  snippet: string;
}

export class KnowledgeBaseService {
  public static async searchKB(userId: string, queryStr: string, storage: StorageProvider): Promise<KBResult[]> {
    try {
      const queryLower = queryStr.toLowerCase();
      const results: KBResult[] = [];

      const companies = await storage.getAllCompanies();
      const applications = await storage.getApplications(userId);
      const resumes = await storage.getUserResumes(userId);

      // 1. Search companies registry
      companies.forEach((c) => {
        if (c.name.toLowerCase().includes(queryLower)) {
          results.push({
            category: 'Company',
            title: c.name,
            subtitle: `ATS: ${c.detected_ats || 'Unknown'}`,
            snippet: `Enabled: ${c.enabled}. Total failures: ${c.total_failures || 0}. Last successful scrape: ${c.last_successful_scrape || 'N/A'}`,
          });
        }
      });

      // 2. Search jobs details in active company lists
      for (const comp of companies) {
        const jobs = await storage.getCompanyJobs(comp.id);
        jobs.forEach((j) => {
          if (j.title.toLowerCase().includes(queryLower) || (j.description || '').toLowerCase().includes(queryLower)) {
            results.push({
              category: 'Job',
              title: j.title,
              subtitle: `${j.company} - ${j.location}`,
              snippet: (j.description || '').substring(0, 150) + '...',
            });
          }
        });
      }

      // 3. Search applications status tracking
      applications.forEach((a) => {
        if (a.company.toLowerCase().includes(queryLower) || (a.notes || '').toLowerCase().includes(queryLower)) {
          results.push({
            category: 'Interview',
            title: `Application at ${a.company}`,
            subtitle: `Status: ${a.status}`,
            snippet: a.notes || 'No active recruiter response logs.',
          });
        }
      });

      // 4. Search resumes
      resumes.forEach((r) => {
        if (r.profileName.toLowerCase().includes(queryLower) || r.content.toLowerCase().includes(queryLower)) {
          results.push({
            category: 'Resume',
            title: r.profileName,
            subtitle: `Created at: ${new Date(r.created_at || '').toLocaleDateString()}`,
            snippet: r.content.substring(0, 150) + '...',
          });
        }
      });

      return results.slice(0, 10);
    } catch (e) {
      Logger.error(`Failed to run KnowledgeBase search for query "${queryStr}"`, e as Error);
      return [];
    }
  }
}
