"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seviyeAyarlaData = exports.topData = exports.rankData = void 0;
exports.executeRank = executeRank;
exports.executeTop = executeTop;
exports.executeSeviyeAyarla = executeSeviyeAyarla;
const discord_js_1 = require("discord.js");
const levelManager_1 = require("../services/features/levelManager");
exports.rankData = new discord_js_1.SlashCommandBuilder()
    .setName('rank')
    .setDescription('Kendi veya etiketlediğin kullanıcının seviye kartını görüntüler.')
    .addUserOption((option) => option.setName('kullanici').setDescription('Seviyesini görmek istediğin kullanıcı (Opsiyonel)'));
exports.topData = new discord_js_1.SlashCommandBuilder()
    .setName('top')
    .setDescription('Sunucunun en aktif üyelerini ve liderlik tablosunu listeler.');
exports.seviyeAyarlaData = new discord_js_1.SlashCommandBuilder()
    .setName('seviye-ayarla')
    .setDescription('Bir kullanıcının seviyesini ve rollerini doğrudan ayarlar (Yönetici).')
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
    .addUserOption((option) => option.setName('kullanici').setDescription('Seviyesi ayarlanacak kullanıcı').setRequired(true))
    .addIntegerOption((option) => option
    .setName('seviye')
    .setDescription('Atanacak seviye (örn: 5, 10, 20, 30, 50)')
    .setRequired(true)
    .setMinValue(0)
    .setMaxValue(100));
async function executeRank(interaction) {
    const targetUser = interaction.options.getUser('kullanici') || interaction.user;
    const embed = levelManager_1.LevelManager.getRankEmbed(targetUser);
    await interaction.reply({ embeds: [embed] });
}
async function executeTop(interaction) {
    const topList = levelManager_1.LevelManager.getLeaderboard();
    let desc = '';
    topList.forEach((u, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**#${i + 1}**`;
        desc += `${medal} <@${u.userId}> — **Level ${u.level}** (\`${u.xp} XP\`)\n`;
    });
    const topEmbed = new discord_js_1.EmbedBuilder()
        .setTitle('🏆 NIGHTS AKTİFLİK LİDERLİK TABLOSU')
        .setDescription(desc || 'Henüz seviye atlayan üye bulunmuyor.')
        .setColor('#F1C40F')
        .setFooter({ text: 'Nights Topluluk Sıralaması • Made by erencix' })
        .setTimestamp();
    await interaction.reply({ embeds: [topEmbed] });
}
async function executeSeviyeAyarla(interaction) {
    const targetUser = interaction.options.getUser('kullanici', true);
    const targetLevel = interaction.options.getInteger('seviye', true);
    levelManager_1.LevelManager.setLevel(targetUser.id, targetLevel, 0);
    let roleMsg = '';
    if (interaction.guild) {
        try {
            const member = await interaction.guild.members.fetch(targetUser.id);
            if (member) {
                const awarded = await levelManager_1.LevelManager.checkAndAssignRoles(member, targetLevel);
                if (awarded.length > 0) {
                    roleMsg = `\n🎁 **Verilen Roller:** ${awarded.map((r) => `<@&${r.roleId}>`).join(', ')}`;
                }
            }
        }
        catch (ignore) { }
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('✅ Seviye Başarıyla Ayarlandı!')
        .setDescription(`<@${targetUser.id}> kullanıcısının seviyesi başarıyla **Level ${targetLevel}** olarak güncellendi.${roleMsg}`)
        .setColor('#2ECC71')
        .setFooter({ text: 'Nights Seviye Yönetimi • Made by erencix' });
    await interaction.reply({ embeds: [embed] });
}
