import fs from 'fs';
import path from 'path';

export interface CsvJob {
  company: string;
  title: string;
  location: string;
  score: number;
  status: string;
  url: string;
  datePosted: string;
  dateFound: string;
}

export class CsvExporter {
  public static export(jobs: CsvJob[]): void {
    const storageDir = path.join(process.cwd(), 'storage');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    const filePath = path.join(storageDir, 'jobs.csv');
    const headers = ['Company', 'Title', 'Location', 'Score', 'Status', 'Apply URL', 'Date Posted', 'Date Found'];
    const rows = jobs.map((j) => [
      this.escape(j.company),
      this.escape(j.title),
      this.escape(j.location),
      (j.score ?? 0).toString(),
      this.escape(j.status),
      this.escape(j.url),
      this.escape(j.datePosted),
      this.escape(j.dateFound),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    fs.writeFileSync(filePath, csvContent, 'utf-8');
  }

  private static escape(str: string): string {
    if (!str) return '';
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }
}
