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
  .setName('roast')
  .setDescription('Kullanıcının sunucudaki tüm mesajlarını okuyup onu acımasızca ve komik şekilde roast eder!')
  .addUserOption((option) =>
    option
      .setName('kullanici')
      .setDescription('Yerin dibine sokulacak kullanıcıyı seçin (Boş bırakırsanız kendiniz olursunuz!)')
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

  // Defer public reply (Herkes roast'u görsün)
  await interaction.deferReply();

  const targetUser = interaction.options.getUser('kullanici') || interaction.user;
  const targetMember = await guild.members.fetch(targetUser.id).catch(() => caller);

  try {
    const result = await RoastManager.generateRoast(guild, targetMember, caller);
    const embed = RoastManager.buildRoastEmbed(
      targetMember,
      caller,
      result.roast,
      result.quoteCount,
      result.damagePercent
    );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`btn_roast_damage_${targetMember.id}`)
        .setLabel(`💀 %${result.damagePercent} Ağır Hasar Alındı`)
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('btn_roast_self')
        .setLabel('🔥 Sıradaki Kurban Kim?')
        .setEmoji('🎤')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({
      embeds: [embed],
      components: [row],
    });
  } catch (err: any) {
    console.error('[RoastCmd] Hata:', err);
    await interaction.editReply({
      content: `❌ Roast üretilirken bir aksaklık oldu: ${err.message}`,
    });
  }
}
