"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ytdl_core_1 = require("@distube/ytdl-core");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function main() {
    const ytdl = new ytdl_core_1.Ytdl();
    const url = 'https://www.youtube.com/watch?v=6YxCUaOeGd0';
    console.log('Downloading audio with Ytdl class:', url);
    try {
        const stream = ytdl.download(url, { filter: 'audioonly', quality: 'highestaudio' });
        const outputPath = path_1.default.resolve('assets/jiren_raw.mp3');
        const writeStream = fs_1.default.createWriteStream(outputPath);
        stream.pipe(writeStream);
        writeStream.on('finish', () => {
            console.log('✅ Audio downloaded to:', outputPath);
        });
        stream.on('error', (err) => console.error('Stream err:', err.message));
    }
    catch (err) {
        console.error('Error with ytdl:', err.message);
    }
}
main();
