const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'routes', 'apiV1Routes.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace err.message with (err as Error).message
content = content.replace(/err\.message/g, '(err as Error).message');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed err.message references in apiV1Routes.ts');