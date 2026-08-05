const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'storage', 'AsyncFileStorage.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace remaining : any types with Record<string, unknown> for non-interface methods
content = content.replace(/saveProfile\(userId: string, profile: any\)/g, 'saveProfile(userId: string, profile: Record<string, unknown>)');
content = content.replace(/saveSavedSearch\(userId: string, name: string, filters: any\)/g, 'saveSavedSearch(userId: string, name: string, filters: Record<string, unknown>)');
content = content.replace(/saveWatchlist\(userId: string, name: string, filters: any\)/g, 'saveWatchlist(userId: string, name: string, filters: Record<string, unknown>)');
content = content.replace(/saveAuditLog\(userId: string \| null, action: string, details: any/g, 'saveAuditLog(userId: string | null, action: string, details: Record<string, unknown>');
content = content.replace(/saveCopilotRecommendations\(userId: string, recommendations: any\[\]/g, 'saveCopilotRecommendations(userId: string, recommendations: Record<string, unknown>[]');
content = content.replace(/saveLearningRoadmap\(userId: string, roadmap: any\)/g, 'saveLearningRoadmap(userId: string, roadmap: Record<string, unknown>)');
content = content.replace(/saveInterviewSession\(userId: string, session: any\)/g, 'saveInterviewSession(userId: string, session: Record<string, unknown>)');
content = content.replace(/saveCareerRoadmap\(userId: string, roadmap: any\)/g, 'saveCareerRoadmap(userId: string, roadmap: Record<string, unknown>)');
content = content.replace(/saveDailyBrief\(userId: string, brief: any\)/g, 'saveDailyBrief(userId: string, brief: Record<string, unknown>)');
content = content.replace(/saveApplicationQueueItem\(userId: string, item: any\)/g, 'saveApplicationQueueItem(userId: string, item: Record<string, unknown>)');
content = content.replace(/saveCalendarEvent\(userId: string, event: any\)/g, 'saveCalendarEvent(userId: string, event: Record<string, unknown>)');
content = content.replace(/saveExport\(userId: string, exportItem: any\)/g, 'saveExport(userId: string, exportItem: Record<string, unknown>)');
content = content.replace(/writeAtomic\(filePath: string, data: any\)/g, 'writeAtomic(filePath: string, data: unknown)');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed remaining any types in AsyncFileStorage.ts');