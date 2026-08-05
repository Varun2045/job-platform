const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function getTsFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getTsFiles(fullPath));
    } else if (item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function countAnyTypes(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = content.match(/: any/g);
  return matches ? matches.length : 0;
}

const tsFiles = getTsFiles(srcDir);
let totalAnyCount = 0;
const fileCounts = [];

for (const file of tsFiles) {
  const count = countAnyTypes(file);
  if (count > 0) {
    totalAnyCount += count;
    fileCounts.push({ file: path.relative(srcDir, file), count });
  }
}

fileCounts.sort((a, b) => b.count - a.count);

console.log(`Total : any types found: ${totalAnyCount}`);
console.log('\nFiles with most : any types:');
fileCounts.slice(0, 20).forEach(({ file, count }) => {
  console.log(`  ${file}: ${count}`);
});