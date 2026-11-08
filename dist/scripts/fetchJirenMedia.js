"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
async function test() {
    const urls = [
        'https://tenor.com/view/jiren-dance-dragon-ball-gif-11116244670923055375',
        'https://tenor.com/view/jiren-dancing-dragon-ball-gif-28771146',
        'https://tenor.com/view/jiren-dance-gif-3868662319080709088',
        'https://tenor.com/view/dance-jiren-dragonball-gif-8461539401738734919'
    ];
    for (const u of urls) {
        try {
            const res = await axios_1.default.get(u, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
            const gifMatches = res.data.match(/https:\/\/c\.tenor\.com\/[^"']+\.gif|https:\/\/media\.tenor\.com\/[^"']+\.gif/g);
            const mp4Matches = res.data.match(/https:\/\/media\.tenor\.com\/[^"']+\.mp4/g);
            console.log('---', u);
            console.log('GIF:', gifMatches ? Array.from(new Set(gifMatches)).slice(0, 3) : 'none');
            console.log('MP4:', mp4Matches ? Array.from(new Set(mp4Matches)).slice(0, 2) : 'none');
        }
        catch (e) {
            console.log('Error for', u, e.message);
        }
    }
}
test();
