"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = exports.pendingLogoCache = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const crypto_1 = __importDefault(require("crypto"));
const logoStudio_1 = require("../services/image/logoStudio");
// Global cache for pending logo applies
exports.pendingLogoCache = new Map();
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('logo')
    .setDescription('Sunucunuz için 512x512 yüksek çözünürlüklü özel logo üretir.')
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
    .addStringOption((opt) => opt
    .setName('istek')
    .setDescription('Logo nasıl görünsün? (Örn: Neon siberpunk kurt başı, altın taçlı aslan)')
    .setRequired(true))
    .addBooleanOption((opt) => opt
    .setName('uygula')
    .setDescription('Üretilen logoyu hemen sunucu ikonu yapsın mı? (Varsayılan: Hayır)')
    .setRequired(false));
async function execute(interaction) {
    if (!interaction.guild) {
        await interaction.reply({ content: 'Bu komut sadece sunucularda kullanılabilir.', ephemeral: true });
        return;
    }
    await interaction.deferReply();
    const prompt = interaction.options.getString('istek', true);
    const autoApply = interaction.options.getBoolean('uygula') ?? false;
    await interaction.editReply({
        content: `🎨 **Yapay Zeka ile Logo Çiziliyor...**\n> Prompt: *"${prompt}"*\nLütfen bekleyin (10-20 saniye sürebilir)...`,
    });
    const studio = new logoStudio_1.LogoStudio();
    try {
        const result = await studio.generateIcon(prompt);
        const attachment = new discord_js_1.AttachmentBuilder(result.buffer, { name: 'server-logo.png' });
        let appliedText = '';
        if (autoApply) {
            if (interaction.memberPermissions?.has(discord_js_1.PermissionFlagsBits.ManageGuild)) {
                await studio.applyIconToGuild(interaction.guild, result.buffer);
                appliedText = '\n\n✅ **Sunucu ikonu başarıyla güncellendi!**';
            }
            else {
                appliedText = '\n\n⚠️ Yetkiniz (Sunucuyu Yönet) olmadığı için logo otomatik uygulanamadı.';
            }
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('🎨 AI Sunucu Logosu Hazır!')
            .setDescription(`**Prompt:** *${prompt}*\n**Kaynak:** \`${result.source.toUpperCase()}\`${appliedText}`)
            .setImage('attachment://server-logo.png')
            .setColor('#9B59B6')
            .setFooter({ text: 'Nights Guard • Made by erencix • 512x512 PNG' })
            .setTimestamp();
        const logoId = crypto_1.default.randomBytes(6).toString('hex');
        exports.pendingLogoCache.set(logoId, { buffer: result.buffer, guildId: interaction.guild.id });
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`apply_logo:${logoId}`)
            .setLabel('Sunucu Logosu Yap')
            .setEmoji('🖼️')
            .setStyle(discord_js_1.ButtonStyle.Success));
        await interaction.editReply({
            content: '',
            embeds: [embed],
            files: [attachment],
            components: autoApply ? [] : [row],
        });
    }
    catch (err) {
        console.error('ai-logo hatası:', err);
        await interaction.editReply({
            content: `❌ Logo üretilirken bir hata oluştu: ${err.message}`,
        });
    }
}
