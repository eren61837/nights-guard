"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const blueprintCache_1 = require("../services/engine/blueprintCache");
const dashboardServer_1 = require("../services/web/dashboardServer");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('browser')
    .setDescription('Sunucu mimarisini web tarayıcısında interaktif görüntüler.')
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator);
async function execute(interaction) {
    const port = dashboardServer_1.DashboardServer.getActivePort() || parseInt(process.env.PORT || '3000', 10);
    const baseUrl = `http://localhost:${port}`;
    const guildId = interaction.guildId || '';
    const latestBlueprint = blueprintCache_1.BlueprintCache.getLatestByGuild(guildId);
    const targetUrl = latestBlueprint ? `${baseUrl}/blueprint/${latestBlueprint.id}` : baseUrl;
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('🌐 Nights Guard Web Companion Studio')
        .setDescription('Nights Guard mimari planlarını, kanal hiyerarşisini, rol izin matrisini ve AutoMod kurallarını doğrudan web tarayıcınızda interaktif olarak inceleyin!')
        .setColor('#5865F2')
        .addFields({
        name: '🖥️ Web Dashboard URL',
        value: `[\`${targetUrl}\`](${targetUrl})`,
        inline: false,
    }, {
        name: '✨ Tarayıcı Özellikleri',
        value: '• **Görsel Sunucu Ağacı:** Kategoriler, kanallar ve özel izin kilitleri\n' +
            '• **Rol Hiyerarşisi:** Renkler, hoisted roller ve yetki sayaçları\n' +
            '• **JSON Dışa Aktarma:** Tek tıkla blueprint kopyalama ve yedekleme\n' +
            '• **Canlı Sistem Durumu:** Bot sağlığı, bellek kullanımı ve gecikme değerleri',
        inline: false,
    })
        .setFooter({ text: 'Nights Guard • Made by erencix' })
        .setTimestamp();
    const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setURL(targetUrl)
        .setLabel('Web Tarayıcısında Aç')
        .setEmoji('🌐')
        .setStyle(discord_js_1.ButtonStyle.Link));
    await interaction.reply({
        embeds: [embed],
        components: [row],
    });
}
