"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activeRadios = exports.RADIO_STATIONS = void 0;
exports.getYtDlpPath = getYtDlpPath;
exports.getRadioConfig = getRadioConfig;
exports.saveRadioConfig = saveRadioConfig;
exports.setGuildStation = setGuildStation;
exports.resolveStationStreamUrl = resolveStationStreamUrl;
exports.getOrCreateRadioChannel = getOrCreateRadioChannel;
exports.start247Radio = start247Radio;
exports.skipRadioTrack = skipRadioTrack;
exports.stopRadio = stopRadio;
exports.initAllRadios = initAllRadios;
const voice_1 = require("@discordjs/voice");
const discord_js_1 = require("discord.js");
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// FFmpeg resolution
function getFfmpegPath() {
    try {
        const ffmpegStatic = require('ffmpeg-static');
        if (ffmpegStatic)
            return ffmpegStatic;
    }
    catch (_) { }
    return process.env.FFMPEG_PATH || 'ffmpeg';
}
// Standalone yt-dlp binary resolution
function getYtDlpPath() {
    const isWindows = process.platform === 'win32';
    const candidates = [
        path_1.default.join(process.cwd(), isWindows ? 'yt-dlp.exe' : 'yt-dlp_linux'),
        path_1.default.join(process.cwd(), 'yt-dlp'),
        path_1.default.join(__dirname, '..', '..', '..', isWindows ? 'yt-dlp.exe' : 'yt-dlp_linux'),
        path_1.default.join(__dirname, '..', '..', '..', 'yt-dlp'),
        path_1.default.join(__dirname, isWindows ? 'yt-dlp.exe' : 'yt-dlp_linux'),
        path_1.default.join(__dirname, 'yt-dlp'),
    ];
    for (const p of candidates) {
        if (fs_1.default.existsSync(p)) {
            if (!isWindows) {
                try {
                    fs_1.default.chmodSync(p, 0o755);
                }
                catch (_) { }
            }
            return p;
        }
    }
    return 'yt-dlp';
}
exports.RADIO_STATIONS = {
    powerturk: {
        name: '📻 PowerTürk (7/24 Kesintisiz Türkçe Hit Canlı)',
        type: 'direct',
        url: 'https://listen.powerapp.com.tr/powerturk/mpeg/icecast.audio',
    },
    powerfm: {
        name: '📻 Power FM (7/24 Global Yabancı Hit Canlı)',
        type: 'direct',
        url: 'https://listen.powerapp.com.tr/powerfm/mpeg/icecast.audio',
    },
    powerpop: {
        name: '📻 Power Pop & Dance (Hareketli Club Hits Canlı)',
        type: 'direct',
        url: 'https://listen.powerapp.com.tr/powerpop/mpeg/icecast.audio',
    },
    slowturk: {
        name: '📻 Slow Türk (7/24 Duygusal & Slow Canlı)',
        type: 'direct',
        url: 'https://radyo.duhnet.tv/slowturk',
    },
    powerlove: {
        name: '📻 Power Love (Romantik Yabancı & Türkçe Canlı)',
        type: 'direct',
        url: 'https://listen.powerapp.com.tr/powerlove/mpeg/icecast.audio',
    },
    erenmod: {
        name: '👑 Eren Modu (Aşk Eski Bir Yalan, Manifest, Büklüm Büklüm - Son Ses!)',
        shortName: '👑 Eren Modu 🔊',
        type: 'youtube_mix',
        volume: 2.2,
        isSongList: true,
        priorityQueries: [
            'Kamuran Akkor - Aşk Eski Bir Yalan',
            'manifest - Hayır',
            'Ferdi Özbeğen - Büklüm Büklüm',
        ],
        queries: [
            'Kamuran Akkor - Aşk Eski Bir Yalan',
            'manifest - Hayır',
            'Ferdi Özbeğen - Büklüm Büklüm',
            'Tülay Özer - Büklüm Büklüm',
            'Semicenk - Aşk Eski Bir Yalan',
            'Kamuran Akkor - Bir Ateşe Attın Beni',
            'Müslüm Gürses - Affet',
            'Bergen - Sen Affetsen Ben Affetmem',
            'Ferdi Tayfur - Hatıran Yeter',
            'Cengiz Kurtoğlu - Duyanlara Duymayanlara',
            'Semicenk & Doğu Swag - Pişman Değilim',
            'Semicenk - Canın Sağ Olsun',
            'Yıldız Tilbe - Delikanlım',
            'Ebru Gündeş - Çingenem',
            'Sezen Aksu - Vazgeçtim',
            'Sezen Aksu - Büklüm Büklüm',
            'Müslüm Gürses - Nilüfer',
            'Müslüm Gürses - Seni Yazdım Kalbime',
            'Dedublüman - Belki',
            'Köfn - Bi Tek Ben Anlarım',
            'İbrahim Tatlıses - Haydi Söyle',
            'Güllü - Sabah Olmadan',
            'Mabel Matiz - Antidepresan',
            'Ahmet Kaya - Kum Gibi',
            'Ceylan Ertem - Zalım',
            'Tan Taşçı - Yalan',
            'Azer Bülbül - Çoğu Gitti Azı Kaldı',
            'Duman - Haberin Yok Ölüyorum',
            'Barış Akarsu - Islak Islak',
            'Erkin Koray - Sevince',
            'Banu Kırbağ - Ölsem De Bir Kalsam Da Bir',
            'Madrigal - Seni Dert Etmeler',
            'Nilüfer - Son Arzum',
            'Semiramis Pekkan - Bana Yalan Söylediler',
            'Güllü - Ömrümce Hep Adım Adım',
            'Ebru Yaşar - Ben Ne Yangınlar Gördüm',
            'Selda Bağcan - Yalan Dünya',
            'Müslüm Gürses - Kaç Kadeh Kırıldı',
            'Zerrin Özer - Basit Numaralar',
            'Manifest - Kırmızı',
        ],
    },
    turkcehit: {
        name: '🔥 Trend Türkçe Pop & Rap Karışık',
        type: 'youtube_mix',
        queries: [
            'BLOK3 en sevilen şarkılar',
            'Semicenk hit şarkılar mix',
            'Lvbel C5 şarkıları',
            'Simge popüler şarkılar mix',
            'Dedublüman en çok dinlenen şarkılar',
            'Reynmen hit şarkılar',
            'Motive şarkıları mix',
            'Uzi en çok dinlenen şarkılar',
            'Hadise pop hit şarkılar',
            'Edis en popüler şarkıları',
            'Zeynep Bastık akustik ve pop mix',
            'Mabel Matiz en sevilen şarkıları',
            'Tarkan popüler hitler mix',
            'Duman en sevilen şarkılar',
            'Manga en çok dinlenen şarkılar',
            'Türkçe Pop 2025 En Çok Dinlenenler',
            'Türkçe Trend Şarkılar Karışık Mix',
            'Hareketli Türkçe Pop Müzikler',
        ],
    },
    turkcerap: {
        name: '🎤 Türkçe Rap, Drill & Trap Hits',
        type: 'youtube_mix',
        queries: [
            'BLOK3 şarkıları',
            'Lvbel C5 rap şarkıları',
            'Uzi rap mix',
            'Motive hit şarkılar',
            'Heijan Muti mix',
            'Çakal Reckol mix',
            'Ezhel en sevilen şarkılar',
            'Şanışer şarkıları mix',
            'Ceza en popüler şarkılar',
            'Sagopa Kajmer en sevilen şarkıları',
            'Türkçe Rap Mix 2025',
        ],
    },
    popremix: {
        name: '🎉 Türkçe & Yabancı Club Remixler',
        type: 'youtube_mix',
        queries: [
            'Türkçe Pop Club Remix 2025',
            'En Çok Dinlenen Türkçe Remixler',
            'Hareketli Kopmalık Şarkılar Mix',
            'Bass Boosted Turkish Club Mix',
            'Festival Remix Hits 2025',
        ],
    },
    slowhit: {
        name: '✨ Geceye Özel Slow & Akustik',
        type: 'youtube_mix',
        queries: [
            'En Sevilen Türkçe Slow Şarkılar',
            'Türkçe Akustik Gitar Şarkılar Mix',
            'Duygusal Türkçe Şarkılar Dinle',
            'Yüzyüzeyken Konuşuruz şarkıları mix',
            'Adamlar en çok dinlenen şarkılar',
            'Emir Can İğrek hit şarkılar mix',
            'Madrigal en popüler şarkılar',
        ],
    },
};
const CONFIG_PATH = path_1.default.join(process.cwd(), 'assets', 'radioConfig.json');
exports.activeRadios = new Map();
const playedHistory = new Map();
const transitioningGuilds = new Set();
function getRadioConfig() {
    try {
        if (fs_1.default.existsSync(CONFIG_PATH)) {
            return JSON.parse(fs_1.default.readFileSync(CONFIG_PATH, 'utf8'));
        }
    }
    catch (_) { }
    return { guildStations: {}, guildChannels: {} };
}
function saveRadioConfig(cfg) {
    try {
        const dir = path_1.default.dirname(CONFIG_PATH);
        if (!fs_1.default.existsSync(dir))
            fs_1.default.mkdirSync(dir, { recursive: true });
        fs_1.default.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
    }
    catch (_) { }
}
function setGuildStation(guildId, stationKey) {
    const cfg = getRadioConfig();
    if (!cfg.guildStations)
        cfg.guildStations = {};
    cfg.guildStations[guildId] = stationKey;
    saveRadioConfig(cfg);
}
/**
 * Resolve direct audio stream URL with infinite variety & no-repeat rotation
 */
function resolveStationStreamUrl(guildId, station) {
    return new Promise((resolve) => {
        if (station.type === 'direct' && station.url) {
            return resolve(station.url);
        }
        const queryList = station.queries || ['Türkçe Popüler Hit Şarkılar Mix'];
        const history = playedHistory.get(guildId) || [];
        const ytdlpBin = getYtDlpPath();
        if (station.isSongList) {
            let chosenQuery = null;
            if (station.priorityQueries && station.priorityQueries.some((pq) => !history.includes(pq))) {
                const unplayedPriority = station.priorityQueries.filter((pq) => !history.includes(pq));
                chosenQuery = unplayedPriority[Math.floor(Math.random() * unplayedPriority.length)];
            }
            else {
                let available = queryList.filter((q) => !history.includes(q));
                if (available.length === 0) {
                    history.length = 0;
                    available = queryList;
                }
                chosenQuery = available[Math.floor(Math.random() * available.length)];
            }
            history.push(chosenQuery);
            if (history.length > 25)
                history.shift();
            playedHistory.set(guildId, history);
            try {
                const getUrl = (0, child_process_1.spawn)(ytdlpBin, [
                    '-f', 'bestaudio',
                    '-g',
                    '--no-playlist',
                    `ytsearch1:${chosenQuery}`,
                ]);
                let out = '';
                getUrl.stdout.on('data', (d) => (out += d.toString()));
                getUrl.on('close', () => {
                    const urls = out.trim().split('\n').map((u) => u.trim()).filter((u) => u && u.startsWith('http'));
                    if (urls.length > 0) {
                        resolve(urls[0]);
                    }
                    else {
                        resolve('https://listen.powerapp.com.tr/powerturk/mpeg/icecast.audio');
                    }
                });
                getUrl.on('error', () => {
                    resolve('https://listen.powerapp.com.tr/powerturk/mpeg/icecast.audio');
                });
            }
            catch (_) {
                resolve('https://listen.powerapp.com.tr/powerturk/mpeg/icecast.audio');
            }
            return;
        }
        const randomQuery = queryList[Math.floor(Math.random() * queryList.length)];
        try {
            const getUrl = (0, child_process_1.spawn)(ytdlpBin, [
                '-f', 'bestaudio',
                '-g',
                '--no-playlist',
                `ytsearch5:${randomQuery}`,
            ]);
            let out = '';
            getUrl.stdout.on('data', (d) => (out += d.toString()));
            getUrl.on('close', () => {
                const urls = out.trim().split('\n').map((u) => u.trim()).filter((u) => u && u.startsWith('http'));
                let chosenUrl = null;
                for (const u of urls) {
                    if (!history.includes(u)) {
                        chosenUrl = u;
                        break;
                    }
                }
                if (!chosenUrl && urls.length > 0) {
                    chosenUrl = urls[Math.floor(Math.random() * urls.length)];
                }
                if (chosenUrl) {
                    history.push(chosenUrl);
                    if (history.length > 20)
                        history.shift();
                    playedHistory.set(guildId, history);
                    resolve(chosenUrl);
                }
                else {
                    resolve('https://listen.powerapp.com.tr/powerturk/mpeg/icecast.audio');
                }
            });
            getUrl.on('error', () => {
                resolve('https://listen.powerapp.com.tr/powerturk/mpeg/icecast.audio');
            });
        }
        catch (_) {
            resolve('https://listen.powerapp.com.tr/powerturk/mpeg/icecast.audio');
        }
    });
}
/**
 * Find or create the #📻 │ Radyo voice channel in the Voice Category
 */
async function getOrCreateRadioChannel(guild) {
    if (!guild)
        return null;
    const cfg = getRadioConfig();
    const customChannelId = cfg.guildChannels && cfg.guildChannels[guild.id];
    if (customChannelId) {
        const ch = guild.channels.cache.get(customChannelId);
        if (ch && ch.type === discord_js_1.ChannelType.GuildVoice)
            return ch;
    }
    // 1. Search for existing radio voice channel
    const existing = guild.channels.cache.find((c) => c.type === discord_js_1.ChannelType.GuildVoice &&
        (c.name.toLowerCase().includes('radyo') ||
            c.name.toLowerCase().includes('radio') ||
            c.name.toLowerCase().includes('7/24') ||
            c.name.toLowerCase().includes('muzik')));
    if (existing)
        return existing;
    // 2. Find Voice Category
    const voiceCategory = guild.channels.cache.find((c) => c.type === discord_js_1.ChannelType.GuildCategory &&
        (c.name.toLowerCase().includes('ses') ||
            c.name.toLowerCase().includes('voice') ||
            c.name.toLowerCase().includes('sohbet') ||
            c.name.toLowerCase().includes('oda'))) ||
        guild.channels.cache.find((c) => c.type === discord_js_1.ChannelType.GuildCategory &&
            c.children &&
            c.children.cache.some((ch) => ch.type === discord_js_1.ChannelType.GuildVoice));
    try {
        const botMember = guild.members.me;
        if (!botMember || !botMember.permissions.has(discord_js_1.PermissionsBitField.Flags.ManageChannels)) {
            return guild.channels.cache.find((c) => c.type === discord_js_1.ChannelType.GuildVoice) || null;
        }
        const newChannel = await guild.channels.create({
            name: '📻 │ 7/24 Radyo',
            type: discord_js_1.ChannelType.GuildVoice,
            parent: voiceCategory ? voiceCategory.id : null,
            userLimit: 99,
        });
        console.log(`[Radyo] ${guild.name} için '📻 │ 7/24 Radyo' kanalı oluşturuldu: (${newChannel.id})`);
        return newChannel;
    }
    catch (e) {
        console.error(`[Radyo] Kanal oluşturma hatası (${guild.name}):`, e.message);
        return guild.channels.cache.find((c) => c.type === discord_js_1.ChannelType.GuildVoice) || null;
    }
}
/**
 * Start playing 24/7 radio / popular hits in the radio channel
 */
async function start247Radio(guild, stationKey = null) {
    if (!guild)
        return null;
    if (transitioningGuilds.has(guild.id))
        return null;
    transitioningGuilds.add(guild.id);
    try {
        // Check if active user music queue is currently playing
        const { getQueue } = require('./musicPlayer');
        const serverQueue = getQueue(guild.id);
        if (serverQueue && serverQueue.playing && serverQueue.songs && serverQueue.songs.length > 0) {
            return null;
        }
        const cfg = getRadioConfig();
        const chosenKey = stationKey || (cfg.guildStations && cfg.guildStations[guild.id]) || 'powerturk';
        const station = exports.RADIO_STATIONS[chosenKey] || exports.RADIO_STATIONS['powerturk'];
        const voiceChannel = await getOrCreateRadioChannel(guild);
        if (!voiceChannel)
            return null;
        // 1. Ensure voice connection exists and is ready (REUSE connection!)
        let connection = (0, voice_1.getVoiceConnection)(guild.id);
        if (!connection || connection.state.status === voice_1.VoiceConnectionStatus.Destroyed) {
            connection = (0, voice_1.joinVoiceChannel)({
                channelId: voiceChannel.id,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false,
            });
            try {
                await (0, voice_1.entersState)(connection, voice_1.VoiceConnectionStatus.Ready, 10000);
            }
            catch (e) {
                console.error(`[Radyo] Voice connection ready uyarısı (${guild.name}):`, e.message);
            }
            connection.on('error', (err) => {
                if (!err.message?.includes('socket closed')) {
                    console.error(`[Radyo] Voice connection hatası (${guild.name}):`, err.message);
                }
            });
            connection.on(voice_1.VoiceConnectionStatus.Disconnected, async () => {
                try {
                    await Promise.race([
                        (0, voice_1.entersState)(connection, voice_1.VoiceConnectionStatus.Signalling, 4000),
                        (0, voice_1.entersState)(connection, voice_1.VoiceConnectionStatus.Connecting, 4000),
                    ]);
                }
                catch {
                    setTimeout(() => {
                        const q = getQueue(guild.id);
                        if (!q || !q.playing || q.songs.length === 0) {
                            const active = exports.activeRadios.get(guild.id);
                            const curKey = active ? active.stationKey : chosenKey;
                            start247Radio(guild, curKey).catch(() => { });
                        }
                    }, 3000);
                }
            });
        }
        // 2. Stop previous FFmpeg process if active
        const existing = exports.activeRadios.get(guild.id);
        if (existing && existing.process) {
            try {
                existing.process.kill();
            }
            catch (_) { }
        }
        // 3. Audio Player (reuse existing or create new)
        let player = existing ? existing.player : null;
        if (!player) {
            player = (0, voice_1.createAudioPlayer)();
            connection.subscribe(player);
            player.on(voice_1.AudioPlayerStatus.Idle, () => {
                setTimeout(() => {
                    const q = getQueue(guild.id);
                    if (!q || !q.playing || q.songs.length === 0) {
                        const active = exports.activeRadios.get(guild.id);
                        const curKey = active ? active.stationKey : chosenKey;
                        console.log(`[Radyo] Şarkı tamamlandı, kesintisiz sıradaki parçaya geçiliyor... 🔄 (${curKey})`);
                        start247Radio(guild, curKey).catch(() => { });
                    }
                }, 800);
            });
            player.on('error', (err) => {
                console.error(`[Radyo] Oynatıcı hatası (${guild.name}):`, err.message);
                setTimeout(() => {
                    const active = exports.activeRadios.get(guild.id);
                    const curKey = active ? active.stationKey : chosenKey;
                    start247Radio(guild, curKey).catch(() => { });
                }, 2000);
            });
        }
        else {
            connection.subscribe(player);
        }
        // 4. Resolve next audio stream URL
        const streamUrl = await resolveStationStreamUrl(guild.id, station);
        const vol = station.volume || 1.0;
        const afFilter = vol > 1.0 ? `volume=${vol},alimiter=limit=0.98` : `volume=${vol}`;
        const ffmpegBin = getFfmpegPath();
        const ffmpegProcess = (0, child_process_1.spawn)(ffmpegBin, [
            '-reconnect', '1',
            '-reconnect_streamed', '1',
            '-reconnect_delay_max', '5',
            '-user_agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            '-i', streamUrl,
            '-af', afFilter,
            '-f', 's16le',
            '-ar', '48000',
            '-ac', '2',
            'pipe:1',
        ], { stdio: ['ignore', 'pipe', 'ignore'] });
        ffmpegProcess.on('error', (err) => {
            console.error(`[Radyo] FFmpeg process hatası (${guild.name}):`, err.message);
        });
        if (ffmpegProcess.stdout) {
            ffmpegProcess.stdout.on('error', () => { });
        }
        const resource = (0, voice_1.createAudioResource)(ffmpegProcess.stdout, {
            inputType: voice_1.StreamType.Raw,
            inlineVolume: true,
        });
        if (resource.volume) {
            resource.volume.setVolume(1.0);
        }
        player.play(resource);
        exports.activeRadios.set(guild.id, {
            connection,
            player,
            process: ffmpegProcess,
            stationKey: chosenKey,
            voiceChannel,
        });
        console.log(`[Radyo] ${guild.name} (${voiceChannel.name}) -> ${station.name} çalıyor! 🎶 (Ses: %${Math.round(vol * 100)})`);
        return { success: true, station };
    }
    catch (err) {
        console.error(`[Radyo] Başlatma hatası (${guild.name}):`, err.message);
        return null;
    }
    finally {
        transitioningGuilds.delete(guild.id);
    }
}
/**
 * Skip currently playing radio track
 */
function skipRadioTrack(guildId) {
    const radio = exports.activeRadios.get(guildId);
    if (radio && radio.player) {
        radio.player.stop();
        return true;
    }
    return false;
}
/**
 * Stop active radio in guild
 */
function stopRadio(guildId, destroyConnection = true) {
    const radio = exports.activeRadios.get(guildId);
    if (radio) {
        if (radio.process) {
            try {
                radio.process.kill();
            }
            catch (_) { }
        }
        if (radio.player) {
            try {
                radio.player.stop();
            }
            catch (_) { }
        }
        if (destroyConnection && radio.connection) {
            try {
                radio.connection.destroy();
            }
            catch (_) { }
        }
        exports.activeRadios.delete(guildId);
    }
}
/**
 * Initialize 24/7 radio on startup
 */
async function initAllRadios(client) {
    const targetGuildId = '1568618183223414934';
    const guild = client.guilds.cache.get(targetGuildId);
    if (guild) {
        console.log(`[Radyo] Nights (${guild.name}) için 7/24 Kesintisiz Radyo başlatılıyor...`);
        await start247Radio(guild).catch(() => { });
    }
}
