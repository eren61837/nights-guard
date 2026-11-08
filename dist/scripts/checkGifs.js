"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const urls = [
    'https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif',
    'https://media.giphy.com/media/EPfV3ijMQVl60/giphy.gif',
    'https://media.giphy.com/media/ErZ8hv5eO92JW/giphy.gif',
    'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZqOHo0bTJ5eWpkaWZ1Z29reTFrMmtnOGUza2Q1bDJqZ214NnB3dyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L1R1tvI9svkIWwpVYr/giphy.gif',
];
async function main() {
    for (const u of urls) {
        try {
            const res = await axios_1.default.head(u);
            console.log('STATUS:', res.status, u);
        }
        catch (e) {
            console.log('FAIL:', e.message, u);
        }
    }
}
main();
