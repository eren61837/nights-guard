import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from 'discord.js';
import { AfkManager } from '../services/features/afkManager';

export const data = new SlashCommandBuilder()
  .setName('afk')
  .setDescription('Sunucuda AFK moduna geçmenizi sağlar ve etiketlendiğinizde bildirim verir.')
  .addStringOption((option) =>
    option
      .setName('sebep')
      .setDescription('Neden AFK olduğunuz (Örn: Yemek yiyorum, ders çalışıyorum)')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const reason = interaction.options.getString('sebep') || 'Belirtilmedi';
  const user = interaction.user;

  AfkManager.setAfk(user.id, reason);

  const embed = new EmbedBuilder()
    .setTitle('💤 AFK Moduna Geçildi')
    .setDescription(
      `Başarıyla AFK moduna geçtiniz, <@${user.id}>!\n\n` +
      `> 📌 **Sebep:** ${reason}\n\n` +
      `💡 *Sohbete herhangi bir mesaj yazdığınızda AFK modunuz otomatik olarak kapanacaktır.*`
    )
    .setColor('#9B59B6')
    .setFooter({ text: 'Nights Guard AFK Sistemi • Made by erencix' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
