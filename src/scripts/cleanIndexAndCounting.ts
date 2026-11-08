import fs from 'fs';
import path from 'path';

const files = ['src/index.ts', 'src/services/features/countingGame.ts'];

for (const f of files) {
  const p = path.resolve(f);
  let c = fs.readFileSync(p, 'utf-8');
  c = c.replace(/PRAYT/g, 'NIGHTS');
  c = c.replace(/Prayt/g, 'Nights');
  c = c.replace(/prayt/g, 'nights');
  fs.writeFileSync(p, c, 'utf-8');
  console.log(`✅ Cleaned: ${f}`);
}
