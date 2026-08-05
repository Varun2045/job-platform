const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'utils', 'errors.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Revert back to any types
content = content.replace(/public details\?: Record<string, unknown>/g, 'public details?: any');
content = content.replace(/details\?: Record<string, unknown>/g, 'details?: any');
content = content.replace(/req: { path\?: string; method\?: string; logger\?: { error: \(message: string, error: Error, meta\?: Record<string, unknown>\) => void } }/g, 'req: any');
content = content.replace(/res: { status: \(code: number\) => { json: \(data: unknown\) => void } }/g, 'res: any');
content = content.replace(/next: \(error\?: Error\) => void/g, 'next: any');
content = content.replace(/req: unknown, res: unknown, next: \(error\?: Error\) => void/g, 'req: any, res: any, next: any');
content = content.replace(/error: unknown/g, 'error: any');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Restored errors.ts to working state');