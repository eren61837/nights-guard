"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const afkManager_1 = require("../services/features/afkManager");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('afk')
    .setDescription('Sunucuda AFK moduna geçmenizi sağlar ve etiketlendiğinizde bildirim verir.')
    .addStringOption((option) => option
    .setName('sebep')
    .setDescription('Neden AFK olduğunuz (Örn: Yemek yiyorum, ders çalışıyorum)')
    .setRequired(false));
async function execute(interaction) {
    const reason = interaction.options.getString('sebep') || 'Belirtilmedi';
    const user = interaction.user;
    afkManager_1.AfkManager.setAfk(user.id, reason);
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('💤 AFK Moduna Geçildi')
        .setDescription(`Başarıyla AFK moduna geçtiniz, <@${user.id}>!\n\n` +
        `> 📌 **Sebep:** ${reason}\n\n` +
        `💡 *Sohbete herhangi bir mesaj yazdığınızda AFK modunuz otomatik olarak kapanacaktır.*`)
        .setColor('#9B59B6')
        .setFooter({ text: 'Nights Guard AFK Sistemi • Made by erencix' })
        .setTimestamp();
    await interaction.reply({ embeds: [embed] });
}
