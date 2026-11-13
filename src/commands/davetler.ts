import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  GuildMember,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { InviteRewardManager } from '../services/features/inviteRewardManager';

export const data = new SlashCommandBuilder()
  .setName('davetler')
  .setDescription('Sunucudaki toplam ve net davet sayınızı, ödül ilerlemenizi görüntüler.')
  .addUserOption((option) =>
    option
      .setName('kullanici')
      .setDescription('Davet istatistiklerine bakılacak üye (Boş bırakırsanız kendiniz)')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = interaction.guild;
  const caller = interaction.member as GuildMember;

  if (!guild || !caller) {
    await interaction.reply({
      content: '❌ Bu komut yalnızca sunucu içerisinde kullanılabilir.',
      ephemeral: true,
    });
    return;
  }

  const targetUser = interaction.options.getUser('kullanici') || interaction.user;
  const targetMember = await guild.members.fetch(targetUser.id).catch(() => caller);

  const embed = InviteRewardManager.buildUserStatsEmbed(guild, targetMember);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_invite_get_link')
      .setLabel('🔗 Özel Davet Linkimi Al')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🚀'),
    new ButtonBuilder()
      .setCustomId('btn_invite_top')
      .setLabel('🏆 Sıralama')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('👑')
  );

  await interaction.reply({
    embeds: [embed],
    components: [row],
  });
}
