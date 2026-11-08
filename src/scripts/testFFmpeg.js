const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function getBinaries() {
    const isWin = process.platform === 'win32';
    let ytdlp = isWin ? path.resolve('yt-dlp.exe') : path.resolve('yt-dlp');
    let ffmpeg = isWin ? path.resolve('ffmpeg.exe') : path.resolve('ffmpeg');

    if (!fs.existsSync(ytdlp)) ytdlp = 'yt-dlp';
    if (!fs.existsSync(ffmpeg)) ffmpeg = 'ffmpeg';

    return { ytdlp, ffmpeg };
}

async function testFFmpeg() {
    const { ffmpeg } = getBinaries();
    console.log('Testing FFmpeg binary:', ffmpeg);

    const proc = spawn(ffmpeg, ['-version']);
    let out = '';
    proc.stdout.on('data', d => out += d.toString());
    proc.on('close', code => {
        console.log('FFmpeg exit code:', code, '| version line:', out.split('\n')[0]);
    });
}

testFFmpeg();
