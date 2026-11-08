"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const economyManager_1 = require("../services/features/economyManager");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('gonder')
    .setDescription('Başka bir sunucu üyesine Nights Coin transfer eder.')
    .addUserOption((option) => option.setName('kullanici').setDescription('Para göndermek istediğiniz kullanıcı').setRequired(true))
    .addIntegerOption((option) => option
    .setName('miktar')
    .setDescription('Göndermek istediğiniz miktar (En az 1)')
    .setRequired(true)
    .setMinValue(1));
async function execute(interaction) {
    const targetUser = interaction.options.getUser('kullanici', true);
    const amount = interaction.options.getInteger('miktar', true);
    const senderId = interaction.user.id;
    if (targetUser.bot) {
        await interaction.reply({ content: '❌ Botlara Nights Coin transfer edemezsiniz!', ephemeral: true });
        return;
    }
    const result = economyManager_1.EconomyManager.transfer(senderId, targetUser.id, amount);
    if (!result.success) {
        await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
        return;
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('💸 Nights Coin Transferi Başarılı!')
        .setDescription(`🎉 **İşlem Tamamlandı!**\n\n` +
        `> 📤 **Gönderen:** <@${senderId}>\n` +
        `> 📥 **Alıcı:** <@${targetUser.id}>\n` +
        `> 💰 **Miktar:** **${amount} Nights Coin**\n\n` +
        `Kalan bakiyeniz: **${economyManager_1.EconomyManager.getBalance(senderId)} Nights Coin**`)
        .setColor('#2ECC71')
        .setFooter({ text: 'Nights Ekonomi Bankası • Made by erencix' })
        .setTimestamp();
    await interaction.reply({ embeds: [embed] });
}
