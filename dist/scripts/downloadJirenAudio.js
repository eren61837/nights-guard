"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const play_dl_1 = __importDefault(require("play-dl"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function downloadJirenAudio() {
    const url = 'https://www.youtube.com/watch?v=6YxCUaOeGd0';
    console.log('Downloading audio from:', url);
    try {
        const stream = await play_dl_1.default.stream(url);
        const outputPath = path_1.default.resolve('assets/jiren_raw.opus');
        const writeStream = fs_1.default.createWriteStream(outputPath);
        stream.stream.pipe(writeStream);
        writeStream.on('finish', () => {
            console.log('✅ Audio saved to:', outputPath);
        });
    }
    catch (err) {
        console.error('Error with playdl:', err.message);
    }
}
downloadJirenAudio();
