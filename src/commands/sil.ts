import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  TextChannel,
  MessageFlags,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('sil')
  .setDescription('Belirtilen kanaldan seçilen sayıda mesajı topluca siler (1-100).')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addIntegerOption((option) =>
    option
      .setName('miktar')
      .setDescription('Silinecek mesaj sayısı (1 - 100)')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  // Yetki kontrolü
  if (
    !interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages) &&
    !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
  ) {
    await interaction.reply({
      content: '❌ Bu komutu kullanabilmek için **Mesajları Yönet** yetkisine sahip olmalısınız.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const channel = interaction.channel;
  if (!channel || !(channel instanceof TextChannel)) {
    await interaction.reply({
      content: '❌ Bu komut sadece metin kanallarında kullanılabilir.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const amount = interaction.options.getInteger('miktar', true);

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const deleted = await channel.bulkDelete(amount, true);

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Mesajlar Temizlendi')
      .setDescription(
        `✅ Başarıyla **${deleted.size}** adet mesaj silindi!\n\n` +
        `> 👮 **Yetkili:** <@${interaction.user.id}>\n` +
        `> 💬 **Kanal:** <#${channel.id}>`
      )
      .setColor('#2ECC71')
      .setFooter({ text: 'Nights Guard Moderasyon • Made by erencix' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (err: any) {
    await interaction.editReply({
      content: `❌ Mesajlar silinirken bir hata oluştu: ${err.message}\n*(Not: Discord kuralları gereği 14 günden eski mesajlar toplu silinemez).*`,
    });
  }
}
