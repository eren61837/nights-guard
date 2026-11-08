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
    static getAudioStream(query) {
        const { ytdlp, ffmpeg } = this.getBinaries();
        const tryExtract = (targetQuery) => {
            return new Promise((resolve, reject) => {
                const args = [
                    '-f', 'ba/b/bestaudio',
                    '-g',
                    '--no-playlist',
                    '--default-search', 'ytsearch',
                    '--extractor-args', 'youtube:player_client=android,ios,web',
                    targetQuery,
                ];
                const proc = (0, child_process_1.spawn)(ytdlp, args);
                let out = '';
                let err = '';
                proc.stdout.on('data', (d) => (out += d.toString()));
                proc.stderr.on('data', (d) => (err += d.toString()));
                proc.on('close', (code) => {
                    const directUrl = out.trim().split('\n')[0];
                    if (code === 0 && directUrl && directUrl.startsWith('http')) {
                        resolve(directUrl);
                    }
                    else {
                        reject(new Error(err || 'Ses linki alınamadı'));
                    }
                });
                proc.on('error', reject);
            });
        };
        return new Promise(async (resolve, reject) => {
            let directUrl = '';
            try {
                directUrl = await tryExtract(query);
            }
            catch (ytErr) {
                console.warn(`[MusicPlayer] YouTube uyarısı, SoundCloud yedeğine geçiliyor: ${ytErr.message.slice(0, 80)}`);
                const cleanQuery = query.replace(/https?:\/\/[^\s]+/g, '').trim() || query;
                try {
                    directUrl = await tryExtract(`scsearch:${cleanQuery}`);
                }
                catch (scErr) {
                    return reject(new Error(`Müzik kaynağına ulaşılamadı: ${ytErr.message || scErr.message}`));
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
            const { stream, process: ffProcess } = await this.getAudioStream(song.url || song.title);
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
        const voiceChannel = member.voice?.channel;
        if (!voiceChannel) {
            const msg = '❌ Müzik çalabilmek için bir ses kanalında olmalısınız!';
            if (isInteraction) {
                await target.interaction.reply({ content: msg, ephemeral: true });
            }
            else if (target.message) {
                await target.message.reply(msg);
            }
            return;
        }
        if (isInteraction) {
            await target.interaction.deferReply();
        }
        let songInfo = null;
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
            else if (query.startsWith('http://') || query.startsWith('https://')) {
                songInfo = {
                    title: query,
                    url: query,
                    duration: 'Canlı / Bilinmiyor',
                    thumbnail: null,
                    requesterId: member.id,
                };
            }
            if (!songInfo) {
                const msg = '❌ Aradığınız şarkı bulunamadı. Lütfen şarkı adı veya linkini kontrol edin.';
                if (isInteraction)
                    await target.interaction.editReply(msg);
                else if (target.message)
                    await target.message.reply(msg);
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
                if (isInteraction)
                    await target.interaction.editReply(startMsg);
                else if (target.message)
                    await target.message.reply(startMsg);
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
                if (isInteraction)
                    await target.interaction.editReply({ embeds: [queueEmbed] });
                else if (target.message)
                    await target.message.reply({ embeds: [queueEmbed] });
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
            await interaction.reply({ content: '❌ Müzik kontrollerini kullanabilmek için bir ses kanalında olmalısınız!', ephemeral: true });
            return;
        }
        const id = interaction.customId;
        if (id === 'btn_music_play_pause') {
            if (!q) {
                await interaction.reply({ content: '⚠️ Şu anda çalan bir şarkı bulunmuyor.', ephemeral: true });
                return;
            }
            if (q.playing) {
                this.pause(guildId);
                await interaction.reply({ content: '⏸️ Müzik duraklatıldı.', ephemeral: true });
            }
            else {
                this.resume(guildId);
                await interaction.reply({ content: '▶️ Müzik devam ettiriliyor.', ephemeral: true });
            }
            return;
        }
        if (id === 'btn_music_skip') {
            if (!q || q.songs.length === 0) {
                await interaction.reply({ content: '⚠️ Sırada geçilecek şarkı bulunmuyor.', ephemeral: true });
                return;
            }
            this.skip(guildId, client);
            await interaction.reply({ content: '⏭️ Sıradaki şarkıya geçildi.', ephemeral: true });
            return;
        }
        if (id === 'btn_music_stop') {
            if (!q) {
                await interaction.reply({ content: '⚠️ Bot zaten herhangi bir ses kanalında çalmıyor.', ephemeral: true });
                return;
            }
            this.stop(guildId, client);
            await interaction.reply({ content: '⏹️ Müzik durduruldu ve çalma listesi sıfırlandı.', ephemeral: true });
            return;
        }
        if (id === 'btn_music_loop') {
            if (!q) {
                await interaction.reply({ content: '⚠️ Şu anda çalan bir şarkı bulunmuyor.', ephemeral: true });
                return;
            }
            const mode = this.toggleLoop(guildId);
            const modeStr = mode === 'track' ? '🔂 Tek Şarkı Döngüsü' : mode === 'queue' ? '🔁 Liste Döngüsü' : '➡️ Döngü Kapalı';
            await interaction.reply({ content: `Döngü modu: **${modeStr}**`, ephemeral: true });
            return;
        }
        if (id === 'btn_music_queue') {
            if (!q || q.songs.length === 0) {
                await interaction.reply({ content: '📭 Çalma listesinde bekleyen şarkı yok.', ephemeral: true });
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
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }
        if (id === 'btn_music_vol_up') {
            if (!q) {
                await interaction.reply({ content: '⚠️ Şu anda çalan bir şarkı bulunmuyor.', ephemeral: true });
                return;
            }
            this.setVolume(guildId, q.volume + 10);
            await interaction.reply({ content: `🔊 Ses seviyesi artırıldı: **%${q.volume}**`, ephemeral: true });
            return;
        }
        if (id === 'btn_music_vol_down') {
            if (!q) {
                await interaction.reply({ content: '⚠️ Şu anda çalan bir şarkı bulunmuyor.', ephemeral: true });
                return;
            }
            this.setVolume(guildId, q.volume - 10);
            await interaction.reply({ content: `🔉 Ses seviyesi düşürüldü: **%${q.volume}**`, ephemeral: true });
            return;
        }
    }
}
exports.MusicPlayer = MusicPlayer;
