"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Bir kullanıcının veya kendinizin HD profil fotoğrafını ve afişini görüntüler.')
    .addUserOption((option) => option
    .setName('kullanici')
    .setDescription('Avatarını görmek istediğiniz kullanıcı (Boş bırakırsanız kendiniz)')
    .setRequired(false));
async function execute(interaction) {
    const targetUser = interaction.options.getUser('kullanici') || interaction.user;
    // Force fetch user to get banner if available
    const fetchedUser = await interaction.client.users.fetch(targetUser.id, { force: true }).catch(() => targetUser);
    const avatarUrl = fetchedUser.displayAvatarURL({ size: 4096, extension: 'png' });
    const bannerUrl = fetchedUser.bannerURL?.({ size: 4096, extension: 'png' });
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(`🖼️ ${fetchedUser.username} Profil Avatarı`)
        .setDescription(`👤 **Kullanıcı:** <@${fetchedUser.id}> (\`${fetchedUser.id}\`)\n` +
        `🌐 **Profil Linki:** [Görüntüle](${avatarUrl})`)
        .setImage(avatarUrl)
        .setColor('#8B5CF6')
        .setFooter({ text: 'Nights Guard Avatar Görüntüleyici • Made by erencix' })
        .setTimestamp();
    if (bannerUrl) {
        embed.addFields({
            name: '🎨 Profil Afişi (Banner)',
            value: `[Afişi Görüntüle](${bannerUrl})`,
            inline: false,
        });
    }
    const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setLabel('Avatarı İndir (HD)')
        .setStyle(discord_js_1.ButtonStyle.Link)
        .setURL(avatarUrl));
    if (bannerUrl) {
        row.addComponents(new discord_js_1.ButtonBuilder()
            .setLabel('Bannerı İndir')
            .setStyle(discord_js_1.ButtonStyle.Link)
            .setURL(bannerUrl));
    }
    await interaction.reply({
        embeds: [embed],
        components: [row],
    });
}
