const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'routes', 'apiV1Routes.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace Logger.error calls with err to cast err as Error
content = content.replace(/Logger\.error\([^,]+,\s*err\)/g, (match) => {
  return match.replace('err', 'err as Error');
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed Logger.error calls in apiV1Routes.ts');