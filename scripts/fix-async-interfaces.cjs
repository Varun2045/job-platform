const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'storage', 'AsyncFileStorage.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace Record<string, unknown> with proper interface types
content = content.replace(/public async saveProfile\(userId: string, profile: Record<string, unknown>\)/g, 'public async saveProfile(userId: string, profile: Record<string, unknown>)');
content = content.replace(/public async saveSavedSearch\(userId: string, name: string, filters: Record<string, unknown>\)/g, 'public async saveSavedSearch(userId: string, name: string, filters: Record<string, unknown>)');
content = content.replace(/public async saveWatchlist\(userId: string, name: string, filters: Record<string, unknown>\)/g, 'public async saveWatchlist(userId: string, name: string, filters: Record<string, unknown>)');
content = content.replace(/public async saveAuditLog\(userId: string \| null, action: string, details: Record<string, unknown>/g, 'public async saveAuditLog(userId: string | null, action: string, details: Record<string, unknown>');
content = content.replace(/public async saveCopilotRecommendations\(userId: string, recommendations: Record<string, unknown>\[\]\)/g, 'public async saveCopilotRecommendations(userId: string, recommendations: Record<string, unknown>[])');
content = content.replace(/public async saveLearningRoadmap\(userId: string, roadmap: Record<string, unknown>\)/g, 'public async saveLearningRoadmap(userId: string, roadmap: Record<string, unknown>)');
content = content.replace(/public async saveInterviewSession\(userId: string, session: Record<string, unknown>\)/g, 'public async saveInterviewSession(userId: string, session: Record<string, unknown>)');
content = content.replace(/public async saveCareerRoadmap\(userId: string, roadmap: Record<string, unknown>\)/g, 'public async saveCareerRoadmap(userId: string, roadmap: Record<string, unknown>)');
content = content.replace(/public async saveDailyBrief\(userId: string, brief: Record<string, unknown>\)/g, 'public async saveDailyBrief(userId: string, brief: Record<string, unknown>)');
content = content.replace(/public async saveApplicationQueueItem\(userId: string, item: Record<string, unknown>\)/g, 'public async saveApplicationQueueItem(userId: string, item: Record<string, unknown>)');
content = content.replace(/public async saveCalendarEvent\(userId: string, event: Record<string, unknown>\)/g, 'public async saveCalendarEvent(userId: string, event: Record<string, unknown>)');
content = content.replace(/public async saveExport\(userId: string, exportItem: Record<string, unknown>\)/g, 'public async saveExport(userId: string, exportItem: Record<string, unknown>)');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed interface types in AsyncFileStorage.ts');