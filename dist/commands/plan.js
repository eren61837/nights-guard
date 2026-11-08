"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const crypto_1 = __importDefault(require("crypto"));
const blueprintCache_1 = require("../services/engine/blueprintCache");
const dashboardServer_1 = require("../services/web/dashboardServer");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('plan')
    .setDescription('Nights Guard Mimari Planlayıcı: Sunucu şemasını ve izin haritasını planlar.')
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
    .addStringOption((opt) => opt
    .setName('istek')
    .setDescription('Planlamak istediğiniz topluluk veya sunucu yapısı')
    .setRequired(true))
    .addStringOption((opt) => opt
    .setName('stil')
    .setDescription('Tasarım tarzı')
    .addChoices({ name: 'Modern & Estetik', value: 'modern' }, { name: 'Minimalist & Sade', value: 'minimalist' }, { name: 'Gaming / Oyun', value: 'gaming' }, { name: 'Anime / RP', value: 'anime' }, { name: 'Kurumsal / Profesyonel', value: 'professional' }))
    .addStringOption((opt) => opt
    .setName('dil')
    .setDescription('Dil seçeneği')
    .addChoices({ name: 'Türkçe (TR)', value: 'tr' }, { name: 'English (EN)', value: 'en' }));
async function execute(interaction, aiManager) {
    await interaction.deferReply();
    const prompt = interaction.options.getString('istek', true);
    const style = interaction.options.getString('stil') || 'modern';
    const locale = interaction.options.getString('dil') || 'tr';
    await interaction.editReply({
        content: `📐 **Nights Guard Planlama Motoru Çalışıyor...**\n> Planlanan İstek: *"${prompt}"*\n> Stil: \`${style}\` | Dil: \`${locale.toUpperCase()}\`\nLütfen bekleyin, mimari ağaç ve izin şeması çıkarılıyor...`,
    });
    try {
        const { blueprint, source } = await aiManager.generateBlueprint({
            prompt,
            style,
            locale,
        });
        const cacheId = crypto_1.default.randomBytes(6).toString('hex');
        const guildId = interaction.guildId || 'dm';
        blueprintCache_1.BlueprintCache.set({
            id: cacheId,
            userId: interaction.user.id,
            guildId,
            blueprint,
            cleanSlate: false,
            applyLogo: true,
            createdAt: Date.now(),
        });
        let totalChannels = 0;
        let channelBreakdown = '';
        for (const cat of blueprint.categories) {
            const count = cat.channels?.length || 0;
            totalChannels += count;
            channelBreakdown += `• **${cat.name}** (${count} kanal)\n`;
        }
        const port = dashboardServer_1.DashboardServer.getActivePort() || parseInt(process.env.PORT || '3000', 10);
        const dashboardUrl = `http://localhost:${port}/blueprint/${cacheId}`;
        const planEmbed = new discord_js_1.EmbedBuilder()
            .setTitle(`📐 Nights Guard Mimari Planı: ${blueprint.serverName}`)
            .setDescription(`**Tema:** ${blueprint.theme}\n**Açıklama:** ${blueprint.serverDescription}\n**AI Motoru:** \`${source.toUpperCase()}\``)
            .setColor('#5865F2')
            .addFields({
            name: '🛡️ Rol Hiyerarşisi (' + blueprint.roles.length + ' Rol)',
            value: blueprint.roles.map((r) => `• \`${r.name}\` (${r.color || '#99AAB5'})`).join('\n').slice(0, 1024),
            inline: true,
        }, {
            name: '📁 Kategori Dağılımı (' + blueprint.categories.length + ' Kategori / ' + totalChannels + ' Kanal)',
            value: channelBreakdown.slice(0, 1024) || 'Kanal bulunmuyor',
            inline: true,
        }, {
            name: '🤖 Koruma ve Entegrasyonlar',
            value: `• **AutoMod Kuralları:** ${blueprint.automodRules?.length || 0} Adet\n• **Ticket Sistemi:** ${blueprint.features?.ticketSystem?.enabled ? '✅ Aktif' : '❌ Pasif'}\n• **Join-to-Create:** ${blueprint.features?.joinToCreate?.enabled ? '✅ Aktif' : '❌ Pasif'}\n• **Web Önizleme:** [Tarayıcıda İncele](${dashboardUrl})`,
            inline: false,
        })
            .setFooter({ text: 'Nights Guard • Made by erencix' })
            .setTimestamp();
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`build_confirm:${cacheId}`)
            .setLabel('Bu Planı İnşa Et')
            .setEmoji('🚀')
            .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
            .setCustomId(`build_details:${cacheId}`)
            .setLabel('JSON Planını Gör')
            .setEmoji('📋')
            .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
            .setURL(dashboardUrl)
            .setLabel('Web Tarayıcısında Aç')
            .setEmoji('🌐')
            .setStyle(discord_js_1.ButtonStyle.Link));
        await interaction.editReply({
            content: '',
            embeds: [planEmbed],
            components: [row],
        });
    }
    catch (err) {
        console.error('[plan] Hatası:', err);
        await interaction.editReply({
            content: `❌ Plan oluşturulamadı: ${err.message}`,
        });
    }
}
