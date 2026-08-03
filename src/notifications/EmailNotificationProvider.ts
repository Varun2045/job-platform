import { Resend } from 'resend';
import { JobDigest, NotificationProvider } from './NotificationProvider.js';
import { config } from '../config/config.js';
import { Logger } from '../core/Logger.js';
import { Telemetry } from '../core/Telemetry.js';

export class EmailNotificationProvider implements NotificationProvider {
  public id = 'email';
  private resendClient: Resend | null = null;

  constructor() {
    if (config.resendApiKey) {
      this.resendClient = new Resend(config.resendApiKey);
    }
  }

  public async sendDigest(digest: JobDigest): Promise<void> {
    if (!this.resendClient) {
      Logger.warn('Resend API key is not configured. Skipping email notification dispatch.');
      return;
    }

    // Filter jobs: Only India or Remote jobs in email alert
    const targetJobs = digest.jobs.filter((j) => {
      const loc = (j.location || '').toLowerCase();
      const isRemote = j.isRemote || loc.includes('remote') || loc.includes('work from home') || loc.includes('anywhere');
      const isIndia = /india|bangalore|bengaluru|hyderabad|pune|gurugram|gurgaon|noida|mumbai|chennai|kolkata|ahmedabad|delhi|trivandrum|thiruvananthapuram|kochi|cochin/i.test(loc);
      return isRemote || isIndia;
    });

    if (targetJobs.length === 0 && process.env.NODE_ENV !== 'test') {
      Logger.info('No new India or Remote jobs matched filtering criteria. Skipping digest email.');
      return;
    }

    // Sort jobs: Highest match score first
    const sortedJobs = [...targetJobs].sort((a, b) => b.matchScore - a.matchScore);

    const subject = `NEW JOBS ALERT | ${digest.totalNewJobs} Match${digest.totalNewJobs > 1 ? 'es' : ''} Found (Highest Score: ${sortedJobs[0].matchScore}%)`;

    const htmlContent = this.buildHtml(digest, sortedJobs);
    const textContent = this.buildPlainText(digest, sortedJobs);

    let attempts = 3;
    let success = false;
    let lastError: any = null;

    while (attempts > 0) {
      try {
        Logger.info(
          `Sending multipart email digest to ${config.recipientEmail} via Resend... (Attempt ${4 - attempts}/3)`,
        );
        const response = await this.resendClient.emails.send({
          from: config.senderEmail,
          to: config.recipientEmail,
          subject: subject,
          html: htmlContent,
          text: textContent,
        });

        if (response.error) {
          throw new Error(JSON.stringify(response.error));
        }

        Logger.info(`Email digest successfully sent. Message ID: ${response.data?.id}`);
        Telemetry.recordEmail(true);
        success = true;
        break;
      } catch (e: any) {
        lastError = e;
        attempts--;
        if (attempts > 0) {
          Logger.warn(
            `Failed to send email alert via Resend. Retrying in 2 seconds... (Attempts remaining: ${attempts})`,
            e,
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    if (!success) {
      Telemetry.recordEmail(false);
      Logger.error('Failed to send email alert via Resend after all retries', lastError);
    }
  }

  private buildHtml(digest: JobDigest, jobs: typeof digest.jobs): string {
    // 1. Group jobs by company name
    const grouped: Record<string, typeof jobs> = {};
    for (const job of jobs) {
      if (!grouped[job.companyName]) {
        grouped[job.companyName] = [];
      }
      grouped[job.companyName].push(job);
    }

    // 2. Determine company names ordered by first appearance of highest job score
    const companyNames: string[] = [];
    for (const job of jobs) {
      if (!companyNames.includes(job.companyName)) {
        companyNames.push(job.companyName);
      }
    }

    const jobListingsHtml = companyNames
      .map((companyName) => {
        const companyJobs = grouped[companyName];
        const companyJobsHtml = companyJobs
          .map((job) => {
            // Color coding for match score badge
            let badgeColor = '#EF4444'; // Red for low
            let badgeBg = '#FEE2E2';
            if (job.matchScore >= 85) {
              badgeColor = '#059669'; // Emerald for excellent
              badgeBg = '#D1FAE5';
            } else if (job.matchScore >= 70) {
              badgeColor = '#3B82F6'; // Blue for good
              badgeBg = '#DBEAFE';
            } else if (job.matchScore >= 50) {
              badgeColor = '#D97706'; // Amber for medium
              badgeBg = '#FEF3C7';
            }

            return `
          <div style="background-color: #ffffff; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
              <div>
                <h3 style="font-size: 18px; font-weight: 700; margin: 0 0 6px 0; color: #0f172a; font-family: 'Inter', sans-serif;">
                  ${job.title}
                </h3>
              </div>
              <span style="background-color: ${badgeBg}; color: ${badgeColor}; font-size: 13px; font-weight: 700; padding: 6px 12px; border-radius: 20px; white-space: nowrap; font-family: 'Inter', sans-serif;">
                Match: ${job.matchScore}%
              </span>
            </div>

            <div style="margin-bottom: 16px;">
              <span style="display: inline-flex; align-items: center; background-color: #f1f5f9; color: #334155; font-size: 12px; font-weight: 600; padding: 4px 8px; border-radius: 6px; margin-right: 8px; margin-bottom: 6px;">
                📍 ${job.location}
              </span>
              <span style="display: inline-flex; align-items: center; background-color: #f1f5f9; color: #334155; font-size: 12px; font-weight: 600; padding: 4px 8px; border-radius: 6px; margin-right: 8px; margin-bottom: 6px;">
                💼 ${job.employmentType || 'Full-time'}
              </span>
              <span style="display: inline-flex; align-items: center; background-color: #f1f5f9; color: #334155; font-size: 12px; font-weight: 600; padding: 4px 8px; border-radius: 6px; margin-right: 8px; margin-bottom: 6px;">
                🎓 ${job.experience || 'Not Specified'}
              </span>
              ${
                job.isRemote
                  ? `
                <span style="display: inline-flex; align-items: center; background-color: #e0f2fe; color: #0369a1; font-size: 12px; font-weight: 600; padding: 4px 8px; border-radius: 6px; margin-bottom: 6px;">
                  🌐 Remote
                </span>
              `
                  : ''
              }
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 14px; margin-top: 14px;">
              <span style="font-size: 12px; color: #94a3b8; font-weight: 500;">
                ID: ${job.jobId} • Posted: ${job.datePosted || 'Just now'}
              </span>
              <a href="${job.applyUrl}" target="_blank" style="background-color: #4f46e5; color: #ffffff; font-weight: 600; font-size: 13px; text-decoration: none; padding: 8px 16px; border-radius: 8px; display: inline-block; font-family: 'Inter', sans-serif;">
                Apply Job →
              </a>
            </div>
          </div>
        `;
          })
          .join('');

        return `
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 20px; font-weight: 800; color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 15px; font-family: 'Inter', sans-serif; text-transform: uppercase; letter-spacing: 0.05em;">
            ${companyName}
          </h2>
          ${companyJobsHtml}
        </div>
      `;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Job Alert Digest</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
          <tr>
            <td align="center" style="padding: 40px 10px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                <!-- Header -->
                <tr>
                  <td align="center" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
                    <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 8px 0; font-family: 'Inter', sans-serif; letter-spacing: -0.025em;">
                      Job Alert Digest
                    </h1>
                    <p style="color: #c7d2fe; font-size: 14px; margin: 0; font-weight: 500;">
                      ${digest.totalNewJobs} new matching position${digest.totalNewJobs > 1 ? 's' : ''} detected on ${new Date(digest.runTimestamp).toLocaleString()}
                    </p>
                  </td>
                </tr>

                <!-- Summary Bar -->
                <tr>
                  <td style="background-color: #4338ca; padding: 12px 24px; text-align: center; color: #ffffff; font-size: 12px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">
                    Checked ${digest.totalCompaniesChecked} companies • Found ${digest.totalJobsFound} listings
                  </td>
                </tr>

                <!-- Listings -->
                <tr>
                  <td style="padding: 24px 0 10px 0;">
                    ${jobListingsHtml}
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td align="center" style="padding: 20px 24px; text-align: center;">
                    <p style="font-size: 12px; color: #64748b; margin: 0 0 8px 0;">
                      You are receiving this because these jobs matched your resume profile threshold of ${config.matchThreshold}%.
                    </p>
                    <p style="font-size: 11px; color: #94a3b8; margin: 0;">
                      Job Monitor Platform • Serverless Automation Pipeline
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private buildPlainText(digest: JobDigest, jobs: typeof digest.jobs): string {
    const header = `=== JOB ALERT DIGEST ===\nRun Timestamp: ${new Date(digest.runTimestamp).toLocaleString()}\nCompanies Checked: ${digest.totalCompaniesChecked}\nTotal Jobs Found: ${digest.totalJobsFound}\nNew Matches Found: ${digest.totalNewJobs}\n\n`;

    // Group jobs by company name
    const grouped: Record<string, typeof jobs> = {};
    for (const job of jobs) {
      if (!grouped[job.companyName]) {
        grouped[job.companyName] = [];
      }
      grouped[job.companyName].push(job);
    }

    const companyNames: string[] = [];
    for (const job of jobs) {
      if (!companyNames.includes(job.companyName)) {
        companyNames.push(job.companyName);
      }
    }

    const body = companyNames
      .map((companyName) => {
        const companyJobs = grouped[companyName];
        const jobsStr = companyJobs
          .map((job, idx) => {
            return `  ${idx + 1}. ${job.title} (Match: ${job.matchScore}%)
     Location: ${job.location}
     Experience: ${job.experience || 'Not Specified'}
     Type: ${job.employmentType || 'Full-time'}
     Remote: ${job.isRemote ? 'Yes' : 'No'}
     Posted: ${job.datePosted || 'Just now'}
     Apply Link: ${job.applyUrl}
     Job ID: ${job.jobId}`;
          })
          .join('\n\n');

        return `[${companyName.toUpperCase()}]\n${'-'.repeat(companyName.length + 2)}\n${jobsStr}`;
      })
      .join('\n\n=============================================\n\n');

    const footer = `\n\nJob Monitor Platform - Serverless Automation Pipeline`;

    return `${header}${body}${footer}`;
  }
}
