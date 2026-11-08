"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('davet')
    .setDescription('Botun resmi sunucu davet bağlantısını ve yetki kılavuzunu görüntüler.')
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator);
async function execute(interaction) {
    const clientId = interaction.client.user?.id || '1568616946545467503';
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('🛡️ Nights Guard - Resmi Sunucu Davet Bağlantısı')
        .setDescription('**Nights Guard** botunu kendi sunucunuza eklemek ve yapay zeka destekli mimari, rol, izin ve AutoMod sistemini kullanmak için aşağıdaki butona tıklayabilirsiniz.')
        .setColor('#5865F2')
        .addFields({
        name: '🔗 Hızlı Davet Linki',
        value: `[**Sunucuna Eklemek İçin Buraya Tıkla**](${inviteUrl})`,
        inline: false,
    }, {
        name: '⚙️ Tavsiye Edilen İzinler',
        value: '• **Yönetici (Administrator):** Kanalları, rolleri, izin matrislerini ve AutoMod korumasını kurabilmesi için gereklidir.',
        inline: true,
    }, {
        name: '🔒 Güvenlik & Kilit Durumu',
        value: '• Bu bot özel yapılandırılmıştır. Yalnızca bot sahibi (<@1138498666785677492>) komutları tetikleyebilir.',
        inline: true,
    })
        .setFooter({ text: 'Nights Guard • Made by erencix' })
        .setTimestamp();
    const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setLabel('🚀 Nights Guard\'ı Sunucuna Ekle')
        .setStyle(discord_js_1.ButtonStyle.Link)
        .setURL(inviteUrl)
        .setEmoji('🛡️'));
    await interaction.reply({
        embeds: [embed],
        components: [row],
    });
}
