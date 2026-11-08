"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const levelManager_1 = require("../services/features/levelManager");
const economyManager_1 = require("../services/features/economyManager");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('kullanici')
    .setDescription('Kullanıcının detaylı profilini, seviyesini, rollerini ve parasını gösterir.')
    .addUserOption((option) => option
    .setName('kullanici')
    .setDescription('Profili görüntülenecek kullanıcı (Boş bırakırsanız siz)')
    .setRequired(false));
async function execute(interaction) {
    const targetUser = interaction.options.getUser('kullanici') || interaction.user;
    const guild = interaction.guild;
    if (!guild) {
        await interaction.reply({ content: 'Bu komut yalnızca bir sunucu içinde kullanılabilir.', ephemeral: true });
        return;
    }
    const member = await guild.members.fetch(targetUser.id).catch(() => null);
    const levelData = levelManager_1.LevelManager.getUserData(targetUser.id);
    const coins = economyManager_1.EconomyManager.getBalance(targetUser.id);
    const neededXp = levelManager_1.LevelManager.getRequiredXp(levelData.level);
    const createdTimestamp = Math.floor(targetUser.createdTimestamp / 1000);
    const joinedTimestamp = member?.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : null;
    // Roles formatting
    let rolesStr = 'Rol bulunmuyor';
    if (member) {
        const roles = member.roles.cache
            .filter((r) => r.id !== guild.id)
            .sort((a, b) => b.position - a.position)
            .map((r) => `<@&${r.id}>`);
        if (roles.length > 0) {
            rolesStr = roles.slice(0, 10).join(', ') + (roles.length > 10 ? ` ve ${roles.length - 10} rol daha...` : '');
        }
    }
    const voiceHours = Math.floor((levelData.voiceMinutes || 0) / 60);
    const voiceMins = (levelData.voiceMinutes || 0) % 60;
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(`👤 ${member?.displayName || targetUser.username} • Kullanıcı Profili`)
        .setDescription(`**${guild.name}** sunucusundaki üye istatistikleri ve bilgileri:`)
        .addFields({
        name: '🆔 Kimlik Bilgileri',
        value: `• **Kullanıcı:** <@${targetUser.id}>\n• **Etiket:** \`${targetUser.tag}\`\n• **ID:** \`${targetUser.id}\`\n• **Bot mu:** \`${targetUser.bot ? 'Evet 🤖' : 'Hayır 👤'}\``,
        inline: true,
    }, {
        name: '📅 Tarihler',
        value: `• **Katılma:** ${joinedTimestamp ? `<t:${joinedTimestamp}:R>` : 'Bilinmiyor'}\n• **Hesap Açılış:** <t:${createdTimestamp}:R>`,
        inline: true,
    }, {
        name: '⭐ Aktiflik & Seviye',
        value: `• **Seviye:** \`Level ${levelData.level}\`\n• **XP:** \`${levelData.xp} / ${neededXp} XP\`\n• **🎙️ Ses Süresi:** \`${voiceHours} sa ${voiceMins} dk\``,
        inline: true,
    }, {
        name: '💰 Nights Ekonomi',
        value: `• **Bakiye:** \`${coins} Nights Coin\` 🪙`,
        inline: true,
    }, {
        name: '🎭 Roller',
        value: rolesStr,
        inline: false,
    })
        .setColor('#8B5CF6')
        .setThumbnail(targetUser.displayAvatarURL({ size: 512 }))
        .setFooter({ text: 'Nights Guard Profil Motoru • Made by erencix' })
        .setTimestamp();
    await interaction.reply({ embeds: [embed] });
}
