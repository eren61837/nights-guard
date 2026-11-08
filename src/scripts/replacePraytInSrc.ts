import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  'src/commands/aiKur.ts',
  'src/commands/aiLogo.ts',
  'src/commands/aiOnizle.ts',
  'src/commands/boost.ts',
  'src/commands/browser.ts',
  'src/commands/davet.ts',
  'src/commands/mesajGonder.ts',
  'src/commands/muzik.ts',
  'src/commands/plan.ts',
  'src/commands/seviye.ts',
  'src/commands/sunucuTemizle.ts',
  'src/commands/teamwork.ts',
  'src/commands/yardim.ts',
  'src/events/interactionCreate.ts',
];

for (const rel of filesToUpdate) {
  const fullPath = path.resolve(rel);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf-8');
    const original = content;
    // Replace case-insensitively or with proper casing
    content = content.replace(/PRAYT/g, 'NIGHTS');
    content = content.replace(/Prayt/g, 'Nights');
    content = content.replace(/prayt/g, 'nights');
    if (content !== original) {
      fs.writeFileSync(fullPath, content, 'utf-8');
      console.log(`✅ Updated: ${rel}`);
    }
  }
}
console.log('🎉 All command and event files updated to Nights!');
