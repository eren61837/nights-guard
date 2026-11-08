"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
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
    const fullPath = path_1.default.resolve(rel);
    if (fs_1.default.existsSync(fullPath)) {
        let content = fs_1.default.readFileSync(fullPath, 'utf-8');
        const original = content;
        // Replace case-insensitively or with proper casing
        content = content.replace(/PRAYT/g, 'NIGHTS');
        content = content.replace(/Prayt/g, 'Nights');
        content = content.replace(/prayt/g, 'nights');
        if (content !== original) {
            fs_1.default.writeFileSync(fullPath, content, 'utf-8');
            console.log(`✅ Updated: ${rel}`);
        }
    }
}
console.log('🎉 All command and event files updated to Nights!');
