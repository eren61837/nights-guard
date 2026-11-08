import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('sunucu-temizle')
  .setDescription('Sunucudaki tüm kanalları ve bot harici rolleri güvenle siler (Temiz Başlangıç).')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    await interaction.reply({ content: 'Bu komut sadece sunucularda çalışır.', ephemeral: true });
    return;
  }

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: '❌ Bu işlemi gerçekleştirmek için `Yönetici` yetkisine sahip olmalısınız.',
      ephemeral: true,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('⚠️ TEHLİKELİ İŞLEM: Sunucu Sıfırlama')
    .setDescription(
      `**DİKKAT:** Bu komut sunucudaki **TÜM KANALLARI** ve botun silebildiği tüm rolleri geri alınamaz şekilde silecektir!\n\nEğer yeni bir AI sunucu kuracaksanız ve tertemiz bir sayfa açmak istiyorsanız aşağıdaki butondan onaylayınız.`
    )
    .setColor('#ED4245')
    .setFooter({ text: 'Nights Guard • Made by erencix • Yalnızca yöneticiler onaylayabilir' });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`wipe_confirm:${interaction.user.id}`)
      .setLabel('Evet, Sunucuyu Tamamen Sıfırla')
      .setEmoji('💣')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('wipe_cancel')
      .setLabel('Vazgeç / İptal')
      .setEmoji('🛡️')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({
    embeds: [embed],
    components: [row],
  });
}
