"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('sunucu')
    .setDescription('Sunucunun detaylı istatistiklerini, üye, kanal ve rol bilgilerini görüntüler.');
async function execute(interaction) {
    const guild = interaction.guild;
    if (!guild) {
        await interaction.reply({ content: '❌ Bu komut yalnızca bir sunucu içinde kullanılabilir.', ephemeral: true });
        return;
    }
    // Fetch full details
    const [members, channels, roles, emojis, stickers] = await Promise.all([
        guild.members.fetch(),
        guild.channels.fetch(),
        guild.roles.fetch(),
        guild.emojis.fetch(),
        guild.stickers.fetch().catch(() => new Map()),
    ]);
    const humans = members.filter((m) => !m.user.bot).size;
    const bots = members.filter((m) => m.user.bot).size;
    const onlineMembers = members.filter((m) => m.presence?.status && m.presence.status !== 'offline').size;
    const textChannels = channels.filter((c) => c && c.type === discord_js_1.ChannelType.GuildText).size;
    const voiceChannels = channels.filter((c) => c && c.type === discord_js_1.ChannelType.GuildVoice).size;
    const categoryChannels = channels.filter((c) => c && c.type === discord_js_1.ChannelType.GuildCategory).size;
    const activeInVoice = members.filter((m) => m.voice.channelId !== null).size;
    const createdTimestamp = Math.floor(guild.createdTimestamp / 1000);
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(`📊 ${guild.name} — Sunucu İstatistikleri`)
        .setDescription(`👑 **Sunucu Sahibi:** <@${guild.ownerId}>\n` +
        `📅 **Kuruluş Tarihi:** <t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)\n` +
        `🆔 **Sunucu ID:** \`${guild.id}\`\n` +
        `💎 **Takviye (Boost):** Seviye **${guild.premiumTier}** (${guild.premiumSubscriptionCount || 0} Boost)`)
        .addFields({
        name: '👥 Üye Dağılımı',
        value: `• **Toplam:** \`${guild.memberCount}\`\n` +
            `• **İnsan:** \`${humans}\` | **Bot:** \`${bots}\`\n` +
            `• **Aktif (Çevrimiçi):** \`${onlineMembers || 'Veri alınıyor'}\`\n` +
            `• **Sesteki Üyeler:** \`${activeInVoice}\` 🎙️`,
        inline: true,
    }, {
        name: '📁 Kanallar',
        value: `• **Toplam Kanal:** \`${channels.size}\`\n` +
            `• **Metin:** \`${textChannels}\` 💬\n` +
            `• **Ses:** \`${voiceChannels}\` 🔊\n` +
            `• **Kategori:** \`${categoryChannels}\` 📂`,
        inline: true,
    }, {
        name: '🎨 Medya & İfadeler',
        value: `• **Roller:** \`${roles.size}\`\n` +
            `• **Emojiler:** \`${emojis.size}\`\n` +
            `• **Çıkartmalar:** \`${stickers.size}\`\n` +
            `• **Doğrulama:** \`${guild.verificationLevel}\``,
        inline: true,
    })
        .setColor('#8B5CF6')
        .setThumbnail(guild.iconURL({ size: 512 }) || '')
        .setFooter({ text: 'Nights Guard Topluluk Analitiği • Made by erencix' })
        .setTimestamp();
    if (guild.bannerURL()) {
        embed.setImage(guild.bannerURL({ size: 1024 }) || '');
    }
    await interaction.reply({ embeds: [embed] });
}
