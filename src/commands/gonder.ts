import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from 'discord.js';
import { EconomyManager } from '../services/features/economyManager';

export const data = new SlashCommandBuilder()
  .setName('gonder')
  .setDescription('Başka bir sunucu üyesine Nights Coin transfer eder.')
  .addUserOption((option) =>
    option.setName('kullanici').setDescription('Para göndermek istediğiniz kullanıcı').setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName('miktar')
      .setDescription('Göndermek istediğiniz miktar (En az 1)')
      .setRequired(true)
      .setMinValue(1)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const targetUser = interaction.options.getUser('kullanici', true);
  const amount = interaction.options.getInteger('miktar', true);
  const senderId = interaction.user.id;

  if (targetUser.bot) {
    await interaction.reply({ content: '❌ Botlara Nights Coin transfer edemezsiniz!', ephemeral: true });
    return;
  }

  const result = EconomyManager.transfer(senderId, targetUser.id, amount);

  if (!result.success) {
    await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('💸 Nights Coin Transferi Başarılı!')
    .setDescription(
      `🎉 **İşlem Tamamlandı!**\n\n` +
      `> 📤 **Gönderen:** <@${senderId}>\n` +
      `> 📥 **Alıcı:** <@${targetUser.id}>\n` +
      `> 💰 **Miktar:** **${amount} Nights Coin**\n\n` +
      `Kalan bakiyeniz: **${EconomyManager.getBalance(senderId)} Nights Coin**`
    )
    .setColor('#2ECC71')
    .setFooter({ text: 'Nights Ekonomi Bankası • Made by erencix' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
