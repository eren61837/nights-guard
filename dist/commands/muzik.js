"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sesData = exports.ayrilData = exports.kuyrukData = exports.gecData = exports.devamData = exports.durdurData = exports.calData = void 0;
exports.executeCal = executeCal;
exports.executeDurdur = executeDurdur;
exports.executeDevam = executeDevam;
exports.executeGec = executeGec;
exports.executeKuyruk = executeKuyruk;
exports.executeAyril = executeAyril;
exports.executeSes = executeSes;
const discord_js_1 = require("discord.js");
const musicPlayer_1 = require("../services/features/musicPlayer");
exports.calData = new discord_js_1.SlashCommandBuilder()
    .setName('cal')
    .setDescription('YouTube veya SoundCloud üzerinden şarkı arar ve ses kanalında çalar.')
    .addStringOption((option) => option.setName('sarki').setDescription('Şarkı adı veya video linki').setRequired(true));
exports.durdurData = new discord_js_1.SlashCommandBuilder()
    .setName('durdur')
    .setDescription('Çalan müziği duraklatır.');
exports.devamData = new discord_js_1.SlashCommandBuilder()
    .setName('devam')
    .setDescription('Duraklatılan müziği devam ettirir.');
exports.gecData = new discord_js_1.SlashCommandBuilder()
    .setName('gec')
    .setDescription('Sıradaki şarkıya geçer.');
exports.kuyrukData = new discord_js_1.SlashCommandBuilder()
    .setName('kuyruk')
    .setDescription('Çalma listesini görüntüler.');
exports.ayrilData = new discord_js_1.SlashCommandBuilder()
    .setName('ayril')
    .setDescription('Botu ses kanalından çıkarır ve listeyi temizler.');
exports.sesData = new discord_js_1.SlashCommandBuilder()
    .setName('ses')
    .setDescription('Müzik ses seviyesini ayarlar (1-150).')
    .addIntegerOption((option) => option.setName('seviye').setDescription('Ses seviyesi (1 - 150)').setRequired(true).setMinValue(1).setMaxValue(150));
async function executeCal(interaction) {
    // Anında Defer Et (Discord 3000ms zaman aşımı ve 10062 hatasını garantili engelle)
    if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply().catch(() => { });
    }
    const query = interaction.options.getString('sarki', true);
    await musicPlayer_1.MusicPlayer.handlePlay({ interaction }, query, interaction.client);
}
async function executeDurdur(interaction) {
    const guildId = interaction.guildId;
    if (!guildId)
        return;
    const ok = musicPlayer_1.MusicPlayer.pause(guildId);
    await interaction.reply({
        content: ok ? '⏸️ Müzik duraklatıldı. Devam ettirmek için `/devam` kullanabilirsiniz.' : '⚠️ Şu anda çalan aktif bir müzik yok.',
        flags: discord_js_1.MessageFlags.Ephemeral,
    }).catch(() => { });
}
async function executeDevam(interaction) {
    const guildId = interaction.guildId;
    if (!guildId)
        return;
    const ok = musicPlayer_1.MusicPlayer.resume(guildId);
    await interaction.reply({
        content: ok ? '▶️ Müzik devam ettiriliyor.' : '⚠️ Duraklatılmış bir müzik bulunmuyor.',
        flags: discord_js_1.MessageFlags.Ephemeral,
    }).catch(() => { });
}
async function executeGec(interaction) {
    const guildId = interaction.guildId;
    if (!guildId)
        return;
    const ok = musicPlayer_1.MusicPlayer.skip(guildId, interaction.client);
    await interaction.reply({
        content: ok ? '⏭️ Sıradaki şarkıya geçildi.' : '⚠️ Sırada geçilecek şarkı yok.',
        flags: discord_js_1.MessageFlags.Ephemeral,
    }).catch(() => { });
}
async function executeKuyruk(interaction) {
    const guildId = interaction.guildId;
    if (!guildId)
        return;
    const q = musicPlayer_1.MusicPlayer.queues.get(guildId);
    if (!q || q.songs.length === 0) {
        await interaction.reply({ content: '📭 Çalma listesinde şarkı bulunmuyor.', flags: discord_js_1.MessageFlags.Ephemeral }).catch(() => { });
        return;
    }
    let desc = '';
    q.songs.slice(0, 10).forEach((s, idx) => {
        desc += `${idx === 0 ? '▶️' : `**#${idx + 1}**`} [${s.title}](${s.url}) (\`${s.duration}\`)\n`;
    });
    if (q.songs.length > 10)
        desc += `*...ve ${q.songs.length - 10} şarkı daha.*`;
    await interaction.reply({
        embeds: [
            {
                title: `📜 Sunucu Çalma Listesi (${q.songs.length} Parça)`,
                description: desc,
                color: 0x5865f2,
                footer: { text: `Ses: %${q.volume} • Döngü: ${q.loopMode}` },
            },
        ],
        flags: discord_js_1.MessageFlags.Ephemeral,
    }).catch(() => { });
}
async function executeAyril(interaction) {
    const guildId = interaction.guildId;
    if (!guildId)
        return;
    const ok = musicPlayer_1.MusicPlayer.stop(guildId, interaction.client);
    await interaction.reply({
        content: ok ? '⏹️ Müzik durduruldu ve kanaldan ayrılınarak liste sıfırlandı.' : '⚠️ Bot ses kanalında bulunmuyor.',
        flags: discord_js_1.MessageFlags.Ephemeral,
    }).catch(() => { });
}
async function executeSes(interaction) {
    const guildId = interaction.guildId;
    if (!guildId)
        return;
    const level = interaction.options.getInteger('seviye', true);
    const ok = musicPlayer_1.MusicPlayer.setVolume(guildId, level);
    await interaction.reply({
        content: ok ? `🔊 Ses seviyesi **%${level}** olarak ayarlandı.` : '⚠️ Çalan bir müzik bulunmuyor.',
        flags: discord_js_1.MessageFlags.Ephemeral,
    }).catch(() => { });
}
