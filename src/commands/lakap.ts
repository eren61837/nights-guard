import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  GuildMember,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { RoastManager } from '../services/features/roastManager';

export const data = new SlashCommandBuilder()
  .setName('lakap')
  .setDescription('Kullanıcının geçmişine ve mesajlarına göre ona özel komik mafya/gece lakabı üretir!')
  .addUserOption((option) =>
    option
      .setName('kullanici')
      .setDescription('Lakap takılacak kullanıcı (Boş bırakırsanız kendiniz olursunuz)')
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

  await interaction.deferReply();

  const targetUser = interaction.options.getUser('kullanici') || interaction.user;
  const targetMember = await guild.members.fetch(targetUser.id).catch(() => caller);

  try {
    const card = await RoastManager.generateNickname(guild, targetMember);
    const embed = RoastManager.buildNicknameEmbed(targetMember, card);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`btn_lakap_reroll_${targetMember.id}`)
        .setLabel('🎲 Başka Lakap Üret')
        .setEmoji('🔄')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.editReply({
      embeds: [embed],
      components: [row],
    });
  } catch (err: any) {
    console.error('[LakapCmd] Hata:', err);
    await interaction.editReply({
      content: `❌ Lakap üretilirken bir aksaklık oldu: ${err.message}`,
    });
  }
}
