import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  MessageFlags,
} from 'discord.js';
import { ConfessionManager } from '../services/features/confessionManager';

export const data = new SlashCommandBuilder()
  .setName('itiraf')
  .setDescription('Sunucuya tamamen anonim ve gizli olarak bir itirafta bulunmanızı sağlar.')
  .addStringOption((option) =>
    option
      .setName('itiraf')
      .setDescription('Anonim olarak paylaşmak istediğiniz itiraf metni')
      .setRequired(true)
      .setMaxLength(1000)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply({
      content: '❌ Bu komut yalnızca sunucu içerisinde kullanılabilir.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const text = interaction.options.getString('itiraf', true);

  // Yanıtı yalnızca komutu kullanan üye görür (Ephemeral)
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const result = await ConfessionManager.submit(guild, interaction.user, text);

  await interaction.editReply({
    content: result.message,
  });
}
