const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'storage', 'AsyncFileStorage.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Revert broken changes back to working state
content = content.replace(/writeAtomic\(filePath: string, data: unknown\)/g, 'writeAtomic(filePath: string, data: any)');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Restored AsyncFileStorage.ts to working state');