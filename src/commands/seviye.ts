import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  GuildMember,
  PermissionFlagsBits,
} from 'discord.js';
import { LevelManager, LEVEL_REWARD_ROLES } from '../services/features/levelManager';

export const rankData = new SlashCommandBuilder()
  .setName('rank')
  .setDescription('Kendi veya etiketlediğin kullanıcının seviye kartını görüntüler.')
  .addUserOption((option) =>
    option.setName('kullanici').setDescription('Seviyesini görmek istediğin kullanıcı (Opsiyonel)')
  );

export const topData = new SlashCommandBuilder()
  .setName('top')
  .setDescription('Sunucunun en aktif üyelerini ve liderlik tablosunu listeler.');

export const seviyeAyarlaData = new SlashCommandBuilder()
  .setName('seviye-ayarla')
  .setDescription('Bir kullanıcının seviyesini ve rollerini doğrudan ayarlar (Yönetici).')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addUserOption((option) =>
    option.setName('kullanici').setDescription('Seviyesi ayarlanacak kullanıcı').setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName('seviye')
      .setDescription('Atanacak seviye (örn: 5, 10, 20, 30, 50)')
      .setRequired(true)
      .setMinValue(0)
      .setMaxValue(100)
  );

export async function executeRank(interaction: ChatInputCommandInteraction) {
  const targetUser = interaction.options.getUser('kullanici') || interaction.user;
  const embed = LevelManager.getRankEmbed(targetUser);
  await interaction.reply({ embeds: [embed] });
}

export async function executeTop(interaction: ChatInputCommandInteraction) {
  const topList = LevelManager.getLeaderboard();
  let desc = '';
  topList.forEach((u, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**#${i + 1}**`;
    desc += `${medal} <@${u.userId}> — **Level ${u.level}** (\`${u.xp} XP\`)\n`;
  });

  const topEmbed = new EmbedBuilder()
    .setTitle('🏆 NIGHTS AKTİFLİK LİDERLİK TABLOSU')
    .setDescription(desc || 'Henüz seviye atlayan üye bulunmuyor.')
    .setColor('#F1C40F')
    .setFooter({ text: 'Nights Topluluk Sıralaması • Made by erencix' })
    .setTimestamp();

  await interaction.reply({ embeds: [topEmbed] });
}

export async function executeSeviyeAyarla(interaction: ChatInputCommandInteraction) {
  const targetUser = interaction.options.getUser('kullanici', true);
  const targetLevel = interaction.options.getInteger('seviye', true);

  LevelManager.setLevel(targetUser.id, targetLevel, 0);

  let roleMsg = '';
  if (interaction.guild) {
    try {
      const member = await interaction.guild.members.fetch(targetUser.id);
      if (member) {
        const awarded = await LevelManager.checkAndAssignRoles(member, targetLevel);
        if (awarded.length > 0) {
          roleMsg = `\n🎁 **Verilen Roller:** ${awarded.map((r) => `<@&${r.roleId}>`).join(', ')}`;
        }
      }
    } catch (ignore) {}
  }

  const embed = new EmbedBuilder()
    .setTitle('✅ Seviye Başarıyla Ayarlandı!')
    .setDescription(
      `<@${targetUser.id}> kullanıcısının seviyesi başarıyla **Level ${targetLevel}** olarak güncellendi.${roleMsg}`
    )
    .setColor('#2ECC71')
    .setFooter({ text: 'Nights Seviye Yönetimi • Made by erencix' });

  await interaction.reply({ embeds: [embed] });
}
