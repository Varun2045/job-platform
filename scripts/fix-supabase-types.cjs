const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'storage', 'SupabaseStorage.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace generic payload: any with Record<string, unknown>
content = content.replace(/const payload: any = \{/g, 'const payload: Record<string, unknown> = {');
content = content.replace(/\.map\(\(row: any\) => \{/g, '.map((row: Record<string, unknown>) => {');
content = content.replace(/\.map\(\(r: any\) => \{/g, '.map((r: Record<string, unknown>) => {');
content = content.replace(/\.map\(\(row: any\) =>/g, '.map((row: Record<string, unknown>) =>');
content = content.replace(/\.map\(\(r: any\) =>/g, '.map((r: Record<string, unknown>) =>');
content = content.replace(/public async saveJobAnalysis\(analysis: any\)/g, 'public async saveJobAnalysis(analysis: Record<string, unknown>)');
content = content.replace(/public async saveExtendedSettings\(settings: any/g, 'public async saveExtendedSettings(settings: Record<string, unknown>');
content = content.replace(/public async saveProfile\(userId: string, profile: any\)/g, 'public async saveProfile(userId: string, profile: Record<string, unknown>)');
content = content.replace(/public async saveSavedSearch\(userId: string, name: string, filters: any\)/g, 'public async saveSavedSearch(userId: string, name: string, filters: Record<string, unknown>)');
content = content.replace(/public async saveWatchlist\(userId: string, name: string, filters: any\)/g, 'public async saveWatchlist(userId: string, name: string, filters: Record<string, unknown>)');
content = content.replace(/public async saveAuditLog\(userId: string \| null, action: string, details: any/g, 'public async saveAuditLog(userId: string | null, action: string, details: Record<string, unknown>');
content = content.replace(/public async saveCopilotRecommendations\(userId: string, recommendations: any\[\]/g, 'public async saveCopilotRecommendations(userId: string, recommendations: Record<string, unknown>[])');
content = content.replace(/public async saveLearningRoadmap\(userId: string, roadmap: any\)/g, 'public async saveLearningRoadmap(userId: string, roadmap: Record<string, unknown>)');
content = content.replace(/public async saveInterviewSession\(userId: string, session: any\)/g, 'public async saveInterviewSession(userId: string, session: Record<string, unknown>)');
content = content.replace(/public async saveCareerRoadmap\(userId: string, roadmap: any\)/g, 'public async saveCareerRoadmap(userId: string, roadmap: Record<string, unknown>)');
content = content.replace(/public async saveDailyBrief\(userId: string, brief: any\)/g, 'public async saveDailyBrief(userId: string, brief: Record<string, unknown>)');
content = content.replace(/public async saveApplicationQueueItem\(userId: string, item: any\)/g, 'public async saveApplicationQueueItem(userId: string, item: Record<string, unknown>)');
content = content.replace(/public async saveRecruiter\(userId: string, recruiter: any\)/g, 'public async saveRecruiter(userId: string, recruiter: Record<string, unknown>)');
content = content.replace(/public async saveReferral\(userId: string, referral: any\)/g, 'public async saveReferral(userId: string, referral: Record<string, unknown>)');
content = content.replace(/public async saveCalendarEvent\(userId: string, event: any\)/g, 'public async saveCalendarEvent(userId: string, event: Record<string, unknown>)');
content = content.replace(/public async saveExport\(userId: string, exportItem: any\)/g, 'public async saveExport(userId: string, exportItem: Record<string, unknown>)');
content = content.replace(/public async saveCoverLetter\(userId: string, coverLetter: any\)/g, 'public async saveCoverLetter(userId: string, coverLetter: Record<string, unknown>)');
content = content.replace(/private parseRecruiterNotes\(notesStr: string \| undefined\): any/g, 'private parseRecruiterNotes(notesStr: string | undefined): Record<string, unknown>');
content = content.replace(/\.filter\(\(r: any\) =>/g, '.filter((r: Record<string, unknown>) =>');
content = content.replace(/\.forEach\(\(r: any\) =>/g, '.forEach((r: Record<string, unknown>) =>');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed any types in SupabaseStorage.ts');