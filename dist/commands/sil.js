"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('sil')
    .setDescription('Belirtilen kanaldan seçilen sayıda mesajı topluca siler (1-100).')
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageMessages)
    .addIntegerOption((option) => option
    .setName('miktar')
    .setDescription('Silinecek mesaj sayısı (1 - 100)')
    .setRequired(true)
    .setMinValue(1)
    .setMaxValue(100));
async function execute(interaction) {
    // Yetki kontrolü
    if (!interaction.memberPermissions?.has(discord_js_1.PermissionFlagsBits.ManageMessages) &&
        !interaction.memberPermissions?.has(discord_js_1.PermissionFlagsBits.Administrator)) {
        await interaction.reply({
            content: '❌ Bu komutu kullanabilmek için **Mesajları Yönet** yetkisine sahip olmalısınız.',
            ephemeral: true,
        });
        return;
    }
    const channel = interaction.channel;
    if (!channel || !(channel instanceof discord_js_1.TextChannel)) {
        await interaction.reply({
            content: '❌ Bu komut sadece metin kanallarında kullanılabilir.',
            ephemeral: true,
        });
        return;
    }
    const amount = interaction.options.getInteger('miktar', true);
    await interaction.deferReply({ ephemeral: true });
    try {
        const deleted = await channel.bulkDelete(amount, true);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('🗑️ Mesajlar Temizlendi')
            .setDescription(`✅ Başarıyla **${deleted.size}** adet mesaj silindi!\n\n` +
            `> 👮 **Yetkili:** <@${interaction.user.id}>\n` +
            `> 💬 **Kanal:** <#${channel.id}>`)
            .setColor('#2ECC71')
            .setFooter({ text: 'Nights Guard Moderasyon • Made by erencix' })
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    }
    catch (err) {
        await interaction.editReply({
            content: `❌ Mesajlar silinirken bir hata oluştu: ${err.message}\n*(Not: Discord kuralları gereği 14 günden eski mesajlar toplu silinemez).*`,
        });
    }
}
