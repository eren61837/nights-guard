"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function main() {
    const prompt = 'Nights luxury discord server icon, glowing neon crescent moon and starry night sky with modern letter N emblem, deep midnight blue, purple and cyan neon, ultra sleek minimalist typography';
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&seed=99421`;
    console.log('Fetching logo from:', url);
    try {
        const res = await axios_1.default.get(url, { responseType: 'arraybuffer', timeout: 20000 });
        console.log('Logo downloaded:', res.headers['content-type'], res.data.byteLength, 'bytes');
        const outPath = path_1.default.resolve('assets/nights_logo.jpg');
        fs_1.default.writeFileSync(outPath, Buffer.from(res.data));
        console.log('Saved to:', outPath);
    }
    catch (e) {
        console.error('Pollinations failed:', e.message);
    }
}
main();
