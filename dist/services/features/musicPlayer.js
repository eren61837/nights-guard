"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MusicPlayer = void 0;
const voice_1 = require("@discordjs/voice");
const discord_js_1 = require("discord.js");
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const yts = require('yt-search');
class MusicPlayer {
    static queues = new Map();
    static async ensureLinuxBinaries() {
        if (process.platform !== 'linux')
            return;
        const https = require('https');
        const zlib = require('zlib');
        const downloadGz = (url, dest) => {
            return new Promise((resolve, reject) => {
                https.get(url, { headers: { 'User-Agent': 'node' } }, (res) => {
                    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                        return downloadGz(res.headers.location, dest).then(resolve).catch(reject);
                    }
                    if (res.statusCode !== 200)
                        return reject(new Error('HTTP ' + res.statusCode));
                    const gunzip = zlib.createGunzip();
                    const file = fs_1.default.createWriteStream(dest);
                    res.pipe(gunzip).pipe(file);
                    file.on('finish', () => file.close(() => resolve()));
                    file.on('error', reject);
                }).on('error', reject);
            });
        };
        const downloadRaw = (url, dest) => {
            return new Promise((resolve, reject) => {
                https.get(url, { headers: { 'User-Agent': 'node' } }, (res) => {
                    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                        return downloadRaw(res.headers.location, dest).then(resolve).catch(reject);
                    }
                    if (res.statusCode !== 200)
                        return reject(new Error('HTTP ' + res.statusCode));
                    const file = fs_1.default.createWriteStream(dest);
                    res.pipe(file);
                    file.on('finish', () => file.close(() => resolve()));
                    file.on('error', reject);
                }).on('error', reject);
            });
        };
        try {
            if (!fs_1.default.existsSync('ffmpeg')) {
                console.log('[MusicPlayer] 🐧 Linux ortamı tespit edildi, ffmpeg indiriliyor...');
                await downloadGz('https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-linux-x64.gz', 'ffmpeg');
                fs_1.default.chmodSync('ffmpeg', 0o755);
                console.log('[MusicPlayer] ✅ Linux ffmpeg hazır!');
            }
            else {
                try {
                    fs_1.default.chmodSync('ffmpeg', 0o755);
                }
                catch (e) { }
            }
            if (!fs_1.default.existsSync('yt-dlp')) {
                console.log('[MusicPlayer] 🐧 Linux ortamı tespit edildi, yt-dlp indiriliyor...');
                await downloadRaw('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp', 'yt-dlp');
                fs_1.default.chmodSync('yt-dlp', 0o755);
                console.log('[MusicPlayer] ✅ Linux yt-dlp hazır!');
            }
            else {
                try {
                    fs_1.default.chmodSync('yt-dlp', 0o755);
                }
                catch (e) { }
            }
        }
        catch (err) {
            console.warn('[MusicPlayer] Linux binary indirme uyarısı:', err.message);
        }
    }
    static getBinaries() {
        const isWin = process.platform === 'win32';
        let ytdlp = isWin ? path_1.default.resolve('yt-dlp.exe') : path_1.default.resolve('yt-dlp');
        let ffmpeg = isWin ? path_1.default.resolve('ffmpeg.exe') : path_1.default.resolve('ffmpeg');
        if (!fs_1.default.existsSync(ytdlp))
            ytdlp = isWin ? 'yt-dlp.exe' : 'yt-dlp';
        if (!fs_1.default.existsSync(ffmpeg))
            ffmpeg = isWin ? 'ffmpeg.exe' : 'ffmpeg';
        if (!isWin) {
            try {
                fs_1.default.chmodSync(ytdlp, 0o755);
            }
            catch (e) { }
            try {
                fs_1.default.chmodSync(ffmpeg, 0o755);
            }
            catch (e) { }
        }
        return { ytdlp, ffmpeg };
    }
    static updateBotPresence(client) {
        if (!client || !client.user)
            return;
        try {
            if (!client.ws || client.ws.status !== 0)
                return;
            let currentSong = null;
            for (const q of this.queues.values()) {
                if (q.songs && q.songs.length > 0 && q.playing) {
                    currentSong = q.songs[0];
                    break;
                }
            }
            if (currentSong) {
                const title = currentSong.title.length > 100 ? currentSong.title.slice(0, 97) + '...' : currentSong.title;
                client.user.setPresence({
                    status: discord_js_1.PresenceUpdateStatus.Idle,
                    activities: [{ name: title, type: discord_js_1.ActivityType.Listening }],
                });
            }
            else {
                client.user.setStatus('idle');
                client.user.setActivity('Nights Guard • /cal', { type: discord_js_1.ActivityType.Listening });
            }
        }
        catch (e) { }
    }
    static cleanSongTitle(title) {
        return title
            .replace(/https?:\/\/[^\s]+/g, '')
            .replace(/www\.[^\s]+/g, '')
            .replace(/\/\/.*/g, '')
            .replace(/\[.*?\]/g, '')
            .replace(/\(.*?\)/g, '')
            .replace(/official\s+(video|audio|music\s+video|lyric\s+video)/gi, '')
            .replace(/sözleri|lyric|lyrics|video|klip|audio/gi, '')
            .replace(/[|#@_\*\^~]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    static async fetchYoutubeOEmbed(url) {
        try {
            const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
            const res = await fetch(oembedUrl);
            if (res.ok) {
                const data = (await res.json());
                return {
                    title: data.title || '',
                    author: data.author_name || '',
                    thumbnail: data.thumbnail_url || '',
                };
            }
        }
        catch (e) { }
        return null;
    }
    static searchSoundCloud(query) {
        const { ytdlp } = this.getBinaries();
        return new Promise((resolve) => {
            const args = [
                '--dump-single-json',
                '--no-playlist',
                `scsearch1:${query}`,
            ];
            const p = (0, child_process_1.spawn)(ytdlp, args);
            let out = '';
            p.stdout.on('data', (d) => (out += d.toString()));
            p.on('close', (code) => {
                if (code === 0 && out.trim()) {
                    try {
                        const data = JSON.parse(out.trim());
                        const entry = data.entries && data.entries.length > 0 ? data.entries[0] : data;
                        if (entry && (entry.title || entry.webpage_url)) {
                            let duration = 'Bilinmiyor';
                            if (entry.duration) {
                                const mins = Math.floor(entry.duration / 60);
                                const secs = Math.floor(entry.duration % 60);
                                duration = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
                            }
                            const thumb = entry.thumbnail ||
                                (entry.thumbnails && entry.thumbnails.length > 0
                                    ? entry.thumbnails[entry.thumbnails.length - 1].url
                                    : null);
                            return resolve({
                                title: entry.title || query,
                                url: entry.webpage_url || entry.url || `https://soundcloud.com/search?q=${encodeURIComponent(query)}`,
                                duration,
                                thumbnail: thumb,
                                requesterId: '',
                            });
                        }
                    }
                    catch (e) { }
                }
                resolve(null);
            });
            p.on('error', () => resolve(null));
            setTimeout(() => {
                try {
                    p.kill();
                }
                catch (e) { }
                resolve(null);
            }, 7000);
        });
    }
    static getAudioStream(query, songTitle) {
        const { ytdlp, ffmpeg } = this.getBinaries();
        const extractStream = (target, isSoundCloud = false) => {
            return new Promise((resolve, reject) => {
                const args = isSoundCloud
                    ? ['-f', 'bestaudio/b/best', '-g', '--no-playlist', target]
                    : [
                        '-f', 'ba/b[height<=360]/b/18/bestaudio',
                        '-g',
                        '--no-playlist',
                        '--default-search', 'ytsearch',
                        '--extractor-args', 'youtube:player_client=android',
                        target,
                    ];
                const proc = (0, child_process_1.spawn)(ytdlp, args);
                let out = '';
                let err = '';
                proc.stdout.on('data', (d) => (out += d.toString()));
                proc.stderr.on('data', (d) => (err += d.toString()));
                proc.on('close', (code) => {
                    const directUrl = out.trim().split('\n').filter((l) => l.startsWith('http'))[0];
                    if (code === 0 && directUrl) {
                        resolve(directUrl);
                    }
                    else {
                        reject(new Error(err || 'Ses bağlantısı alınamadı'));
                    }
                });
                proc.on('error', reject);
                setTimeout(() => {
                    try {
                        proc.kill();
                    }
                    catch (e) { }
                    reject(new Error('Ses kaynağı zaman aşımına uğradı'));
                }, 12000);
            });
        };
        return new Promise(async (resolve, reject) => {
            let directUrl = '';
            const isSC = query.includes('soundcloud.com') || query.startsWith('scsearch');
            if (isSC) {
                try {
                    directUrl = await extractStream(query, true);
                }
                catch (scErr) {
                    return reject(new Error(`SoundCloud hatası: ${scErr.message}`));
                }
            }
            else {
                // 1. YouTube Android istemcisini dene
                try {
                    directUrl = await extractStream(query, false);
                }
                catch (ytErr) {
                    // YouTube bot engeli (Datacenter IP kısıtlaması) tespit edildi!
                    console.warn(`[MusicPlayer] ⚠️ YouTube kısıtlaması algılandı, SoundCloud yedeğine geçiliyor...`);
                    const rawTitle = songTitle || query;
                    const cleanQuery = MusicPlayer.cleanSongTitle(rawTitle) || rawTitle.replace(/https?:\/\/[^\s]+/g, '').trim();
                    const targetSearch = `scsearch1:${cleanQuery || 'pop music'}`;
                    console.log(`[MusicPlayer] 🔍 SoundCloud üzerinde parça aranıyor: "${cleanQuery}"`);
                    try {
                        directUrl = await extractStream(targetSearch, true);
                        console.log(`[MusicPlayer] ✅ SoundCloud üzerinden parça başarıyla bağlandı!`);
                    }
                    catch (scErr) {
                        console.error(`[MusicPlayer] SoundCloud araması da yanıt vermedi:`, scErr.message);
                        return reject(new Error(`Müzik kaynağına ulaşılamadı. Lütfen şarkı adını veya direkt SoundCloud linkini deneyin.`));
                    }
                }
            }
            const ff = (0, child_process_1.spawn)(ffmpeg, [
                '-reconnect', '1',
                '-reconnect_streamed', '1',
                '-reconnect_delay_max', '5',
                '-i', directUrl,
                '-f', 's16le',
                '-ar', '48000',
                '-ac', '2',
                'pipe:1',
            ]);
            ff.on('error', (err) => {
                console.error('[MusicPlayer FFmpeg Process Error]:', err);
            });
            resolve({ stream: ff.stdout, process: ff });
        });
    }
    static async playSong(guildId, song, client) {
        const queue = this.queues.get(guildId);
        if (!queue)
            return;
        if (queue.streamProcess) {
            try {
                queue.streamProcess.kill();
            }
            catch (e) { }
            queue.streamProcess = null;
        }
        if (!song) {
            queue.playing = false;
            this.updateBotPresence(client);
            if (queue.textChannel && 'send' in queue.textChannel) {
                queue.textChannel.send('⏹️ **Çalma listesi tamamlandı.** Bot bekleme moduna geçti.').catch(() => { });
            }
            if (queue.timeout)
                clearTimeout(queue.timeout);
            queue.timeout = setTimeout(() => {
                const currentQ = this.queues.get(guildId);
                if (currentQ && currentQ.songs.length === 0) {
                    if (currentQ.connection) {
                        try {
                            currentQ.connection.destroy();
                        }
                        catch (e) { }
                    }
                    this.queues.delete(guildId);
                    this.updateBotPresence(client);
                }
            }, 30000);
            return;
        }
        if (queue.timeout) {
            clearTimeout(queue.timeout);
            queue.timeout = null;
        }
        try {
            const { stream, process: ffProcess } = await this.getAudioStream(song.url || song.title, song.title);
            queue.streamProcess = ffProcess;
            const resource = (0, voice_1.createAudioResource)(stream, {
                inputType: voice_1.StreamType.Raw,
                inlineVolume: true,
            });
            if (resource.volume) {
                resource.volume.setVolume(queue.volume / 100);
            }
            queue.resource = resource;
            queue.player.play(resource);
            queue.playing = true;
            this.updateBotPresence(client);
            if (queue.textChannel && 'send' in queue.textChannel) {
                const nowEmbed = new discord_js_1.EmbedBuilder()
                    .setTitle('🎶 Şimdi Çalıyor')
                    .setDescription(`**[${song.title}](${song.url})**`)
                    .setColor('#5865F2')
                    .addFields({ name: '⏱️ Süre', value: song.duration || 'Bilinmiyor', inline: true }, { name: '👤 İsteyen', value: `<@${song.requesterId}>`, inline: true }, { name: '🔊 Ses Seviyesi', value: `%${queue.volume}`, inline: true })
                    .setFooter({ text: 'Nights Guard Müzik Motoru • Made by erencix' })
                    .setTimestamp();
                if (song.thumbnail) {
                    nowEmbed.setThumbnail(song.thumbnail);
                }
                queue.textChannel.send({ embeds: [nowEmbed], components: [this.getMusicControlsRow()] }).catch(() => { });
            }
        }
        catch (err) {
            console.error('[MusicPlayer] Çalma hatası:', err.message);
            if (queue.textChannel && 'send' in queue.textChannel) {
                queue.textChannel.send(`⚠️ **${song.title}** çalınırken bir hata oluştu: ${err.message}. Sıradaki parçaya geçiliyor...`).catch(() => { });
            }
            queue.songs.shift();
            this.playSong(guildId, queue.songs[0], client);
        }
    }
    static async handlePlay(target, query, client) {
        const isInteraction = !!target.interaction;
        const member = (target.interaction?.member || target.message?.member);
        const guild = target.interaction?.guild || target.message?.guild;
        const channel = (target.interaction?.channel || target.message?.channel);
        if (!member || !guild || !channel)
            return;
        if (isInteraction && !target.interaction.deferred && !target.interaction.replied) {
            await target.interaction.deferReply().catch(() => { });
        }
        const voiceChannel = member.voice?.channel;
        if (!voiceChannel) {
            const msg = '❌ Müzik çalabilmek için bir ses kanalında olmalısınız!';
            if (isInteraction) {
                if (target.interaction.deferred) {
                    await target.interaction.editReply({ content: msg }).catch(() => { });
                }
                else {
                    await target.interaction.reply({ content: msg, flags: discord_js_1.MessageFlags.Ephemeral }).catch(() => { });
                }
            }
            else if (target.message) {
                await target.message.reply(msg).catch(() => { });
            }
            return;
        }
        let songInfo = null;
        try {
            const isYtUrl = query.includes('youtube.com') || query.includes('youtu.be');
            const isScUrl = query.includes('soundcloud.com');
            if (isYtUrl) {
                // YouTube OEmbed ile kesin başlık ve kapak al (IP ban yemeyen resmi API)
                const oembed = await this.fetchYoutubeOEmbed(query);
                if (oembed && oembed.title) {
                    songInfo = {
                        title: oembed.title,
                        url: query,
                        duration: 'YouTube Parçası',
                        thumbnail: oembed.thumbnail,
                        requesterId: member.id,
                    };
                }
                else {
                    // OEmbed yanıt vermezse yts videoId dene
                    const idMatch = query.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
                    if (idMatch && idMatch[1]) {
                        try {
                            const v = await yts({ videoId: idMatch[1] });
                            if (v && v.title) {
                                songInfo = {
                                    title: v.title,
                                    url: v.url,
                                    duration: v.timestamp || 'Bilinmiyor',
                                    thumbnail: v.thumbnail,
                                    requesterId: member.id,
                                };
                            }
                        }
                        catch (e) { }
                    }
                }
            }
            else if (isScUrl) {
                songInfo = await this.searchSoundCloud(query);
                if (songInfo)
                    songInfo.requesterId = member.id;
            }
            // YouTube arama motorunu dene
            if (!songInfo) {
                try {
                    const search = await yts(query);
                    if (search && search.videos && search.videos.length > 0) {
                        const v = search.videos[0];
                        songInfo = {
                            title: v.title,
                            url: v.url,
                            duration: v.timestamp,
                            thumbnail: v.thumbnail,
                            requesterId: member.id,
                        };
                    }
                }
                catch (e) { }
            }
            // SoundCloud araması dene (YouTube scraping IP ban yediğinde garantili yedek)
            if (!songInfo) {
                console.log(`[MusicPlayer] YouTube aramasında bulunamadı, SoundCloud aranıyor: "${query}"`);
                songInfo = await this.searchSoundCloud(query);
                if (songInfo)
                    songInfo.requesterId = member.id;
            }
            // Son çare (ham URL verilmişse)
            if (!songInfo && (query.startsWith('http://') || query.startsWith('https://'))) {
                songInfo = {
                    title: query,
                    url: query,
                    duration: 'Canlı / Akış',
                    thumbnail: null,
                    requesterId: member.id,
                };
            }
            if (!songInfo) {
                const msg = '❌ Aradığınız şarkı bulunamadı. Lütfen şarkı adı veya linkini kontrol edin.';
                if (isInteraction) {
                    if (target.interaction.deferred)
                        await target.interaction.editReply(msg).catch(() => { });
                    else
                        await target.interaction.reply({ content: msg, flags: discord_js_1.MessageFlags.Ephemeral }).catch(() => { });
                }
                else if (target.message) {
                    await target.message.reply(msg).catch(() => { });
                }
                return;
            }
            let queue = this.queues.get(guild.id);
            if (!queue) {
                const connection = (0, voice_1.joinVoiceChannel)({
                    channelId: voiceChannel.id,
                    guildId: guild.id,
                    adapterCreator: guild.voiceAdapterCreator,
                    selfDeaf: false,
                    selfMute: false,
                });
                const player = (0, voice_1.createAudioPlayer)();
                queue = {
                    textChannel: channel,
                    voiceChannelId: voiceChannel.id,
                    connection,
                    player,
                    songs: [],
                    volume: 100,
                    playing: true,
                    loopMode: 'off',
                    resource: null,
                    streamProcess: null,
                    timeout: null,
                };
                this.queues.set(guild.id, queue);
                connection.subscribe(player);
                player.on(voice_1.AudioPlayerStatus.Idle, () => {
                    const q = this.queues.get(guild.id);
                    if (q && q.songs.length > 0) {
                        if (q.loopMode === 'track') {
                            this.playSong(guild.id, q.songs[0], client);
                        }
                        else if (q.loopMode === 'queue') {
                            const finished = q.songs.shift();
                            if (finished)
                                q.songs.push(finished);
                            this.playSong(guild.id, q.songs[0], client);
                        }
                        else {
                            q.songs.shift();
                            this.playSong(guild.id, q.songs[0], client);
                        }
                    }
                });
                player.on('error', (err) => {
                    console.error('[MusicPlayer Player Error]:', err.message);
                    const q = this.queues.get(guild.id);
                    if (q && q.songs.length > 0) {
                        q.songs.shift();
                        this.playSong(guild.id, q.songs[0], client);
                    }
                });
                connection.on(voice_1.VoiceConnectionStatus.Disconnected, async () => {
                    try {
                        await Promise.race([
                            (0, voice_1.entersState)(connection, voice_1.VoiceConnectionStatus.Signalling, 5000),
                            (0, voice_1.entersState)(connection, voice_1.VoiceConnectionStatus.Connecting, 5000),
                        ]);
                    }
                    catch {
                        if (queue?.streamProcess) {
                            try {
                                queue.streamProcess.kill();
                            }
                            catch (e) { }
                        }
                        connection.destroy();
                        this.queues.delete(guild.id);
                        this.updateBotPresence(client);
                    }
                });
                queue.songs.push(songInfo);
                const startMsg = `🎶 **${songInfo.title}** açılıyor...`;
                if (isInteraction) {
                    if (target.interaction.deferred)
                        await target.interaction.editReply(startMsg).catch(() => { });
                    else
                        await target.interaction.reply({ content: startMsg }).catch(() => { });
                }
                else if (target.message) {
                    await target.message.reply(startMsg).catch(() => { });
                }
                this.playSong(guild.id, queue.songs[0], client);
            }
            else {
                queue.songs.push(songInfo);
                const queueEmbed = new discord_js_1.EmbedBuilder()
                    .setTitle('✅ Kuyruğa Eklendi')
                    .setDescription(`**[${songInfo.title}](${songInfo.url})**`)
                    .setColor('#2ECC71')
                    .addFields({ name: '⏱️ Süre', value: songInfo.duration || 'Bilinmiyor', inline: true }, { name: '📍 Sıra', value: `${queue.songs.length}. sıra`, inline: true }, { name: '👤 İsteyen', value: `<@${songInfo.requesterId}>`, inline: true });
                if (songInfo.thumbnail)
                    queueEmbed.setThumbnail(songInfo.thumbnail);
                if (isInteraction) {
                    if (target.interaction.deferred)
                        await target.interaction.editReply({ embeds: [queueEmbed] }).catch(() => { });
                    else
                        await target.interaction.reply({ embeds: [queueEmbed] }).catch(() => { });
                }
                else if (target.message) {
                    await target.message.reply({ embeds: [queueEmbed] }).catch(() => { });
                }
                if (!queue.playing && queue.songs.length === 1) {
                    this.playSong(guild.id, queue.songs[0], client);
                }
            }
        }
        catch (err) {
            console.error('[MusicPlayer handlePlay Error]:', err);
            const errMsg = `❌ Müzik başlatılırken bir hata oluştu: ${err.message}`;
            if (isInteraction)
                await target.interaction.editReply(errMsg).catch(() => { });
            else if (target.message)
                await target.message.reply(errMsg).catch(() => { });
        }
    }
    static pause(guildId) {
        const q = this.queues.get(guildId);
        if (!q || !q.playing)
            return false;
        q.player.pause();
        q.playing = false;
        return true;
    }
    static resume(guildId) {
        const q = this.queues.get(guildId);
        if (!q || q.playing)
            return false;
        q.player.unpause();
        q.playing = true;
        return true;
    }
    static skip(guildId, client) {
        const q = this.queues.get(guildId);
        if (!q || q.songs.length === 0)
            return false;
        q.songs.shift();
        this.playSong(guildId, q.songs[0] || null, client);
        return true;
    }
    static stop(guildId, client) {
        const q = this.queues.get(guildId);
        if (!q)
            return false;
        q.songs = [];
        if (q.streamProcess) {
            try {
                q.streamProcess.kill();
            }
            catch (e) { }
        }
        q.player.stop();
        if (q.connection) {
            try {
                q.connection.destroy();
            }
            catch (e) { }
        }
        this.queues.delete(guildId);
        this.updateBotPresence(client);
        return true;
    }
    static setVolume(guildId, volume) {
        const q = this.queues.get(guildId);
        if (!q)
            return false;
        const clamped = Math.max(1, Math.min(150, volume));
        q.volume = clamped;
        if (q.resource && q.resource.volume) {
            q.resource.volume.setVolume(clamped / 100);
        }
        return true;
    }
    static toggleLoop(guildId) {
        const q = this.queues.get(guildId);
        if (!q)
            return 'off';
        if (q.loopMode === 'off')
            q.loopMode = 'track';
        else if (q.loopMode === 'track')
            q.loopMode = 'queue';
        else
            q.loopMode = 'off';
        return q.loopMode;
    }
    static getMusicControlsRow() {
        return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('btn_music_play_pause').setLabel('Oynat / Duraklat').setEmoji('⏯️').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('btn_music_skip').setLabel('Geç').setEmoji('⏭️').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('btn_music_stop').setLabel('Durdur').setEmoji('⏹️').setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId('btn_music_loop').setLabel('Döngü').setEmoji('🔁').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('btn_music_queue').setLabel('Sıra').setEmoji('📜').setStyle(discord_js_1.ButtonStyle.Secondary));
    }
    static getMusicControls() {
        return this.getMusicControlsRow();
    }
    static getMusicInfoEmbed() {
        return this.getMusicPanelEmbed();
    }
    static getMusicVolumeRow() {
        return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('btn_music_vol_down').setLabel('Ses -%10').setEmoji('🔉').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('btn_music_vol_up').setLabel('Ses +%10').setEmoji('🔊').setStyle(discord_js_1.ButtonStyle.Secondary));
    }
    static getMusicPanelEmbed() {
        return new discord_js_1.EmbedBuilder()
            .setTitle('🎵 NIGHTS GUARD HI-FI MÜZİK MERKEZİ 🎧')
            .setDescription('Yüksek kaliteli (384kbps), kesintisiz ve akıllı YouTube & SoundCloud müzik çalarımız emrinizde!\n\n' +
            '### 📌 Nasıl Şarkı Açılır?\n' +
            '• `/cal <şarkı adı veya link>` — YouTube veya parça adını yazarak anında açabilirsiniz.\n' +
            '• `!cal <şarkı>` veya `!play <şarkı>` — Hızlı metin komutu ile şarkıyı başlatır.\n\n' +
            '### 🎛️ İnteraktif Kontroller:\n' +
            'Aşağıdaki butonları kullanarak çalan şarkıyı tek tıkla duraklatabilir, geçebilir, döngüye alabilir veya sesini ayarlayabilirsiniz.\n\n' +
            '> 💡 *Ses kanalında kimse kalmadığında bot kaynak tasarrufu için otomatik olarak bekleme moduna geçer.*')
            .setImage('https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif')
            .setColor('#8B5CF6')
            .setFooter({ text: 'Nights Guard Audio Engine • Made by erencix' });
    }
    static async handleMusicButton(interaction, client) {
        const guildId = interaction.guildId;
        if (!guildId)
            return;
        const q = this.queues.get(guildId);
        const member = interaction.member;
        if (!member?.voice?.channel) {
            await interaction.reply({ content: '❌ Müzik kontrollerini kullanabilmek için bir ses kanalında olmalısınız!', flags: discord_js_1.MessageFlags.Ephemeral }).catch(() => { });
            return;
        }
        const id = interaction.customId;
        if (id === 'btn_music_play_pause') {
            if (!q) {
                await interaction.reply({ content: '⚠️ Şu anda çalan bir şarkı bulunmuyor.', flags: discord_js_1.MessageFlags.Ephemeral }).catch(() => { });
                return;
            }
            if (q.playing) {
                this.pause(guildId);
                await interaction.reply({ content: '⏸️ Müzik duraklatıldı.', flags: discord_js_1.MessageFlags.Ephemeral }).catch(() => { });
            }
            else {
                this.resume(guildId);
                await interaction.reply({ content: '▶️ Müzik devam ettiriliyor.', flags: discord_js_1.MessageFlags.Ephemeral }).catch(() => { });
            }
            return;
        }
        if (id === 'btn_music_skip') {
            if (!q || q.songs.length === 0) {
                await interaction.reply({ content: '⚠️ Sırada geçilecek şarkı bulunmuyor.', flags: discord_js_1.MessageFlags.Ephemeral }).catch(() => { });
                return;
            }
            this.skip(guildId, client);
            await interaction.reply({ content: '⏭️ Sıradaki şarkıya geçildi.', flags: discord_js_1.MessageFlags.Ephemeral }).catch(() => { });
            return;
        }
        if (id === 'btn_music_stop') {
            if (!q) {
                await interaction.reply({ content: '⚠️ Bot zaten herhangi bir ses kanalında çalmıyor.', flags: discord_js_1.MessageFlags.Ephemeral }).catch(() => { });
                return;
            }
            this.stop(guildId, client);
            await interaction.reply({ content: '⏹️ Müzik durduruldu ve çalma listesi sıfırlandı.', flags: discord_js_1.MessageFlags.Ephemeral }).catch(() => { });
            return;
        }
        if (id === 'btn_music_loop') {
            if (!q) {
                await interaction.reply({ content: '⚠️ Şu anda çalan bir şarkı bulunmuyor.', flags: discord_js_1.MessageFlags.Ephemeral }).catch(() => { });
                return;
            }
            const mode = this.toggleLoop(guildId);
            const modeStr = mode === 'track' ? '🔂 Tek Şarkı Döngüsü' : mode === 'queue' ? '🔁 Liste Döngüsü' : '➡️ Döngü Kapalı';
            await interaction.reply({ content: `Döngü modu: **${modeStr}**`, flags: discord_js_1.MessageFlags.Ephemeral }).catch(() => { });
            return;
        }
        if (id === 'btn_music_queue') {
            if (!q || q.songs.length === 0) {
                await interaction.reply({ content: '📭 Çalma listesinde bekleyen şarkı yok.', flags: discord_js_1.MessageFlags.Ephemeral }).catch(() => { });
                return;
            }
            let desc = '';
            q.songs.slice(0, 10).forEach((s, idx) => {
                desc += `${idx === 0 ? '▶️' : `**#${idx + 1}**`} [${s.title}](${s.url}) (\`${s.duration}\`)\n`;
            });
            if (q.songs.length > 10)
                desc += `*...ve ${q.songs.length - 10} parça daha.*`;
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle(`📜 Çalma Listesi (${q.songs.length} Parça)`)
                .setDescription(desc)
                .setColor('#5865F2')
                .setFooter({ text: `Ses: %${q.volume} • Döngü: ${q.loopMode}` });
            await interaction.reply({ embeds: [embed], flags: discord_js_1.MessageFlags.Ephemeral }).catch(() => { });
            return;
        }
        if (id === 'btn_music_vol_up') {
            if (!q) {
                await interaction.reply({ content: '⚠️ Şu anda çalan bir şarkı bulunmuyor.', flags: discord_js_1.MessageFlags.Ephemeral }).catch(() => { });
                return;
            }
            this.setVolume(guildId, q.volume + 10);
            await interaction.reply({ content: `🔊 Ses seviyesi artırıldı: **%${q.volume}**`, flags: discord_js_1.MessageFlags.Ephemeral }).catch(() => { });
            return;
        }
        if (id === 'btn_music_vol_down') {
            if (!q) {
                await interaction.reply({ content: '⚠️ Şu anda çalan bir şarkı bulunmuyor.', flags: discord_js_1.MessageFlags.Ephemeral }).catch(() => { });
                return;
            }
            this.setVolume(guildId, q.volume - 10);
            await interaction.reply({ content: `🔉 Ses seviyesi düşürüldü: **%${q.volume}**`, flags: discord_js_1.MessageFlags.Ephemeral }).catch(() => { });
            return;
        }
    }
}
exports.MusicPlayer = MusicPlayer;
