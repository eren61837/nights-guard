import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('boost')
  .setDescription('Sunucu boost seviyesi, ayrıcalıklar ve ödül yönetimini gösterir.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand((sub) =>
    sub
      .setName('durum')
      .setDescription('Sunucunun boost seviyesini ve avantajlarını gösterir.')
  )
  .addSubcommand((sub) =>
    sub
      .setName('ayricaliklar')
      .setDescription('Booster üyelerine özel ayrıcalık listesini gösterir.')
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const { guild } = interaction;
  if (!guild) {
    await interaction.reply({ content: 'Bu komut sadece sunucularda çalışır.', ephemeral: true });
    return;
  }

  const subcommand = interaction.options.getSubcommand() || 'durum';
  const boostCount = guild.premiumSubscriptionCount || 0;
  const boostTier = guild.premiumTier; // 0, 1, 2, 3

  let tierName = 'Seviye Yok';
  let nextTierNeeded = 2 - boostCount;
  if (boostTier === 1) {
    tierName = 'Seviye 1 🌟';
    nextTierNeeded = 7 - boostCount;
  } else if (boostTier === 2) {
    tierName = 'Seviye 2 🚀';
    nextTierNeeded = 14 - boostCount;
  } else if (boostTier === 3) {
    tierName = 'Seviye 3 💎 (Maksimum)';
    nextTierNeeded = 0;
  }

  if (subcommand === 'durum') {
    const embed = new EmbedBuilder()
      .setTitle(`🚀 Nights Guard Boost Merkezi: ${guild.name}`)
      .setDescription('Sunucunuza takviye basan üyeler için otomatik ödüller ve avantajlar devrededir.')
      .setColor('#F47FFF')
      .addFields(
        {
          name: '📊 Takviye Seviyesi',
          value: `**${tierName}**\nToplam Takviye: **${boostCount} Boost**`,
          inline: true,
        },
        {
          name: '🎯 Sonraki Hedef',
          value: nextTierNeeded > 0 ? `**${nextTierNeeded} boost** daha gerekiyor` : 'Tüm seviyeler açıldı! 🎉',
          inline: true,
        },
        {
          name: '💎 Aktif Booster Ayrıcalıkları',
          value:
            '• **Özel Booster Rolü & İkonu**\n• **Özel Booster VIP Ses & Metin Odası Erişimi**\n• **Sohbette Harici Emoji & Hareketli Çıkartma Kullanımı**\n• **Yüksek Bitrate (128 - 384 kbps) Ses Kalitesi**\n• **Otomatik Teşekkür & Hoş Geldin Mesajı**',
          inline: false,
        }
      )
      .setFooter({ text: 'Nights Guard • Made by erencix' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    return;
  }

  if (subcommand === 'ayricaliklar') {
    const embed = new EmbedBuilder()
      .setTitle('🌟 Nights Guard Booster Özel Ayrıcalık Yönetimi')
      .setDescription(
        'Sunucuya takviye basıldığında tetiklenecek otomatik roller ve özel kanal izinleri:\n\n' +
        '1. **Booster Rolü:** `@Server Booster` rolüne sahip kullanıcılara otomatik renk seçimi ve GIF izinleri verilir.\n' +
        '2. **Booster Lounge:** Sadece boosterların erişebildiği gizli sohbet alanı.\n' +
        '3. **Öncelikli Sıra:** Botun `/kur` ve `/logo` komutlarında boosterlar öncelikli kuyrukta işlenir.'
      )
      .setColor('#9B59B6')
      .setFooter({ text: 'Nights Guard • Made by erencix' });

    await interaction.reply({ embeds: [embed] });
  }
}
