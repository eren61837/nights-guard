"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yt_search_1 = __importDefault(require("yt-search"));
async function main() {
    const r = await (0, yt_search_1.default)('jiren dance im so in love with you');
    console.log('Results count:', r.videos.length);
    r.videos.slice(0, 8).forEach(v => {
        console.log(`- ${v.title} | Duration: ${v.timestamp} | URL: ${v.url}`);
    });
}
main();
