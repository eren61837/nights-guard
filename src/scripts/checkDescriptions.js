const fs = require('fs');
const path = require('path');

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) {
            scanDir(full);
        } else if (f.endsWith('.ts') || f.endsWith('.js')) {
            const content = fs.readFileSync(full, 'utf8');
            // Check SlashCommandBuilder and SlashCommandSubcommandBuilder and addOption
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
                if (line.includes('setDescription(')) {
                    // Extract string inside setDescription('...') or setDescription("...")
                    const m = line.match(/setDescription\(\s*['"`](.*?)['"`]\s*\)/);
                    if (m && m[1]) {
                        if (m[1].length > 95) {
                            console.log(`[LONG DESC ${m[1].length} chars] ${f}:${idx + 1} -> "${m[1]}"`);
                        }
                    }
                }
            });
        }
    }
}

console.log('Checking all setDescription calls in src/...');
scanDir('./src');
console.log('Done checking descriptions.');
