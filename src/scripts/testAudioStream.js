const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function getBinaries() {
    const isWin = process.platform === 'win32';
    let ytdlp = isWin ? path.resolve('yt-dlp.exe') : path.resolve('yt-dlp');
    let ffmpeg = isWin ? path.resolve('ffmpeg.exe') : path.resolve('ffmpeg');

    if (!fs.existsSync(ytdlp)) ytdlp = 'yt-dlp';
    if (!fs.existsSync(ffmpeg)) ffmpeg = 'ffmpeg';

    if (!isWin) {
        try { fs.chmodSync(ytdlp, 0o755); } catch(e) {}
        try { fs.chmodSync(ffmpeg, 0o755); } catch(e) {}
    }

    return { ytdlp, ffmpeg };
}

async function getAudioDirectUrl(query) {
    const { ytdlp } = getBinaries();

    // 1. First attempt: YouTube with android/ios/web client
    const tryExtract = (targetQuery) => {
        return new Promise((resolve, reject) => {
            const args = [
                '-f', 'ba/b/bestaudio',
                '-g',
                '--no-playlist',
                '--default-search', 'ytsearch',
                '--extractor-args', 'youtube:player_client=android,ios,web',
                targetQuery
            ];

            const proc = spawn(ytdlp, args);
            let out = '';
            let err = '';

            proc.stdout.on('data', d => out += d.toString());
            proc.stderr.on('data', d => err += d.toString());

            proc.on('close', code => {
                const url = out.trim().split('\n')[0];
                if (code === 0 && url && url.startsWith('http')) {
                    resolve(url);
                } else {
                    reject(new Error(err || 'Failed to extract URL'));
                }
            });

            proc.on('error', reject);
        });
    };

    try {
        console.log(`[Music] YouTube üzerinden ses aranıyor: "${query}"...`);
        const url = await tryExtract(query);
        console.log('[Music] ✅ YouTube ses URL alındı!');
        return url;
    } catch (ytErr) {
        console.warn(`[Music] ⚠️ YouTube engellendi veya hata verdi (${ytErr.message.slice(0, 80)}...). SoundCloud yedeğine geçiliyor...`);
        const scQuery = `scsearch:${query.replace(/https?:\/\/[^\s]+/g, '').trim() || query}`;
        const scUrl = await tryExtract(scQuery);
        console.log('[Music] ✅ SoundCloud ses URL başarıyla alındı!');
        return scUrl;
    }
}

async function test() {
    try {
        const url = await getAudioDirectUrl('Joost Klein - Europapa');
        console.log('Result URL length:', url.length);
        console.log('URL prefix:', url.slice(0, 80));
    } catch(e) {
        console.error('Test failed:', e);
    }
}

test();
