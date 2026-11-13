import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { InviteRewardManager } from '../services/features/inviteRewardManager';

export const data = new SlashCommandBuilder()
  .setName('davet-top')
  .setDescription('Sunucuya en çok üye davet edenlerin canlı liderlik sıralamasını gösterir.');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply({ content: 'Bu komut sunucu içinde kullanılabilir.', ephemeral: true });
    return;
  }

  const embed = InviteRewardManager.buildLeaderboardEmbed(guild);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_invite_get_link')
      .setLabel('🔗 Sen de Davet Et & Sıralamaya Gir')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🚀')
  );

  await interaction.reply({
    embeds: [embed],
    components: [row],
  });
}
