const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'storage', 'SupabaseStorage.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace err.message with (err as Error).message where err is unknown
content = content.replace(/err\.message/g, '(err as Error).message');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed err.message references in SupabaseStorage.ts');