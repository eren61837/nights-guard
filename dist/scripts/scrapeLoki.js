"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
async function main() {
    try {
        const res = await axios_1.default.get('https://emoji.gg/search?q=loki', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
        });
        const html = res.data;
        const matches = html.match(/https:\/\/cdn3?\.emoji\.gg\/emojis\/[^"'\s]+/g) || [];
        const unique = [...new Set(matches)];
        console.log(`Found ${unique.length} CDN image URLs:`);
        unique.forEach((u) => console.log(u));
    }
    catch (e) {
        console.error('Error:', e.message);
    }
}
main();
