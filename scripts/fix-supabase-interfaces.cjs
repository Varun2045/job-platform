const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'storage', 'SupabaseStorage.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Import the missing types at the top
const importLine = "import { StorageProvider, Offer, FollowUp, NotificationPreference, VisaSponsor, SavedExtensionJob, JobAnalysis, ExtendedSettings, ReferralContact } from './StorageProvider.js';";

if (!content.includes('JobAnalysis')) {
  content = content.replace(
    "import { StorageProvider, Offer, FollowUp, NotificationPreference, VisaSponsor, SavedExtensionJob } from './StorageProvider.js';",
    importLine
  );
}

// Replace Record<string, unknown> with proper interface types
content = content.replace(/public async saveJobAnalysis\(analysis: Record<string, unknown>\)/g, 'public async saveJobAnalysis(analysis: JobAnalysis)');
content = content.replace(/public async saveExtendedSettings\(settings: Record<string, unknown>/g, 'public async saveExtendedSettings(settings: ExtendedSettings');
content = content.replace(/public async saveReferral\(userId: string, referral: Record<string, unknown>\)/g, 'public async saveReferral(userId: string, referral: ReferralContact)');
content = content.replace(/public async saveVisaSponsor\(sponsor: Record<string, unknown>\)/g, 'public async saveVisaSponsor(sponsor: VisaSponsor)');
content = content.replace(/public async saveExtensionJob\(job: Record<string, unknown>\): Promise<Record<string, unknown>>/g, 'public async saveExtensionJob(job: SavedExtensionJob): Promise<SavedExtensionJob>');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed interface types in SupabaseStorage.ts');