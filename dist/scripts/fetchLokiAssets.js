"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
async function checkUrl(url) {
    try {
        const res = await axios_1.default.head(url);
        console.log(url, 'STATUS:', res.status, res.headers['content-type'], res.headers['content-length']);
        return true;
    }
    catch (e) {
        console.log(url, 'FAILED:', e.message);
        return false;
    }
}
async function main() {
    await checkUrl('https://raw.githubusercontent.com/jmeridth/emojis/master/loki.png');
    await checkUrl('https://raw.githubusercontent.com/katerberg/emojis/master/loki.png');
}
main();
