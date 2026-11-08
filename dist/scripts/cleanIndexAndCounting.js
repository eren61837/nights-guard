"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const files = ['src/index.ts', 'src/services/features/countingGame.ts'];
for (const f of files) {
    const p = path_1.default.resolve(f);
    let c = fs_1.default.readFileSync(p, 'utf-8');
    c = c.replace(/PRAYT/g, 'NIGHTS');
    c = c.replace(/Prayt/g, 'Nights');
    c = c.replace(/prayt/g, 'nights');
    fs_1.default.writeFileSync(p, c, 'utf-8');
    console.log(`✅ Cleaned: ${f}`);
}
