#!/usr/bin/env node

/**
 * Automated script to replace 'any' types with proper TypeScript types
 * This is a helper script to speed up type safety improvements
 */

const fs = require('fs');
const path = require('path');

const COMMON_REPLACEMENTS = [
  // Error handling
  {
    pattern: /catch \(err: any\)/g,
    replacement: 'catch (err: unknown)',
    files: ['src/server.ts']
  },
  {
    pattern: /err: any/g,
    replacement: 'err as Error',
    files: ['src/server.ts']
  },
  // Job arrays
  {
    pattern: /: any\[\]/g,
    replacement: '[]',
    files: ['src/server.ts']
  },
  // Generic objects
  {
    pattern: /: any(?=[,\);\)])/g,
    replacement: ': Record<string, unknown>',
    files: ['src/server.ts']
  },
  // Cache maps
  {
    pattern: /Map<string, \{ data: any; expiry: number \}>/g,
    replacement: 'Map<string, { data: unknown; expiry: number }>',
    files: ['src/server.ts']
  },
  {
    pattern: /Map<string, \{ data: any; timestamp: number \}>/g,
    replacement: 'Map<string, { data: unknown; timestamp: number }>',
    files: ['src/server.ts']
  },
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changes = 0;

  COMMON_REPLACEMENTS.forEach(({ pattern, replacement }) => {
    const matches = content.match(pattern);
    if (matches) {
      content = content.replace(pattern, replacement);
      changes += matches.length;
    }
  });

  if (changes > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${changes} type issues in ${filePath}`);
  } else {
    console.log(`ℹ️  No changes needed in ${filePath}`);
  }

  return changes;
}

// Process server.ts
const serverPath = path.join(process.cwd(), 'src/server.ts');
console.log('Fixing TypeScript types in server.ts...');
const totalChanges = fixFile(serverPath);
console.log(`\n🎉 Total changes: ${totalChanges}`);