import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';
import { ServerBackupManager } from '../services/features/serverBackupManager';

export const yedekAlData = new SlashCommandBuilder()
  .setName('yedek-al')
  .setDescription('Sunucunun tüm rollerini, kanallarını, yetkilerini ve üye rollerini eksiksiz yedekler.');

export const yedekGetirData = new SlashCommandBuilder()
  .setName('yedekgetir')
  .setDescription('Alınan en son sunucu yedeğini geri yükler ve sunucuyu eski haline getirir.');

export const yedekKurData = new SlashCommandBuilder()
  .setName('yedek-kur')
  .setDescription('Sunucu yedeğini yükleyerek rolleri, odaları ve yetkileri onarır.');

const OWNER_ID = '1138498666785677492';

/**
 * /yedek-al komutu yürütmesi
 */
export async function executeYedekAl(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply({
      content: '❌ Bu komut yalnızca sunucu içerisinde kullanılabilir.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Güvenlik Kontrolü: Yalnızca erencix veya sunucu sahibi!
  if (!ServerBackupManager.isAuthorized(interaction.user.id, guild)) {
    await interaction.reply({
      content: `⛔ **Erişim Engellendi:** Sunucu yedeği alma yetkisi yalnızca <@${OWNER_ID}> (erencix) ve sunucu kurucusuna aittir!`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const result = await ServerBackupManager.createBackup(guild, interaction.user);

  if (!result.success || !result.data) {
    await interaction.editReply({
      content: `❌ **Yedek Alma Hatası:** ${result.error || 'Bilinmeyen bir hata oluştu.'}`,
    });
    return;
  }

  const d = result.data;
  const embed = new EmbedBuilder()
    .setTitle('💾 NIGHTS GUARD • TAM SUNUCU YEDEĞİ ALINDI!')
    .setDescription(
      `Sunucunun anlık tüm verileri, rolleri, kategori ve kanalları, özel izinleri ve üye rol dağılımları başarıyla şifrelenip diske kaydedildi! 🎉\n\n` +
      `Herhangi bir olumsuzluk, kanal silinmesi veya yetki bozulmasında \`/yedekgetir\` komutuyla anında bu haline geri dönebilirsiniz.`
    )
    .setColor('#2ECC71')
    .addFields(
      { name: '🆔 Yedek Kodu', value: `\`${d.backupId}\``, inline: true },
      { name: '👑 Alan Yetkili', value: `<@${interaction.user.id}>`, inline: true },
      { name: '⏰ Tarih & Saat', value: `<t:${Math.floor(d.createdAt / 1000)}:F>`, inline: false },
      { name: '🎭 Toplam Roller', value: `**${d.stats.rolesCount}** adet rol`, inline: true },
      { name: '📁 Kategoriler', value: `**${d.stats.categoriesCount}** adet kategori`, inline: true },
      { name: '🎙️ Ses & Metin Kanalları', value: `**${d.stats.channelsCount}** adet kanal`, inline: true },
      { name: '👥 Üye Rol Kayıtları', value: `**${d.stats.membersSavedCount}** üyenin rolleri`, inline: true },
      { name: '🛡️ Güvenlik', value: '✅ **Yalnızca erencix açabilir**', inline: true }
    )
    .setFooter({ text: 'Nights Automated Backup System • Made by erencix' })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

/**
 * /yedekgetir veya /yedek-kur komutu yürütmesi
 */
export async function executeYedekGetir(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply({
      content: '❌ Bu komut yalnızca sunucu içerisinde kullanılabilir.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Güvenlik Kontrolü: Yalnızca erencix veya sunucu sahibi!
  if (!ServerBackupManager.isAuthorized(interaction.user.id, guild)) {
    await interaction.reply({
      content: `⛔ **Erişim Engellendi:** Sunucu yedeği geri yükleme işlemi son derece kritik bir işlemdir! Yalnızca <@${OWNER_ID}> (erencix) tarafından çalıştırılabilir.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  // İlerleme durumunu etkileşimde göster
  const progressUpdater = async (status: string) => {
    try {
      await interaction.editReply({
        content: `⏳ **SUNUCU YEDEĞİ GERİ YÜKLENİYOR...**\n> ${status}`,
      });
    } catch {}
  };

  const result = await ServerBackupManager.restoreBackup(guild, interaction.user, progressUpdater);

  if (!result.success) {
    await interaction.editReply({
      content: `❌ **Geri Yükleme Hatası:** ${result.error}`,
    });
    return;
  }

  const s = result.restoredStats;
  const embed = new EmbedBuilder()
    .setTitle('✨ NIGHTS GUARD • SUNUCU YEDEĞİ BAŞARIYLA GERİ YÜKLENDİ!')
    .setDescription(
      `Sunucu başarıyla yedeğin alındığı eski haline döndürüldü! Tüm odalar, roller, yetki matrisleri ve üyelerin rolleri onarıldı. 🛡️`
    )
    .setColor('#8B5CF6')
    .addFields(
      { name: '🆔 Kullanılan Yedek', value: `\`${s.backupId}\``, inline: true },
      { name: '👑 İşlemi Yapan', value: `<@${interaction.user.id}>`, inline: true },
      { name: '🎭 Kurtarılan Roller', value: `**${s.roles}** adet`, inline: true },
      { name: '📁 Kurtarılan Kategoriler', value: `**${s.categories}** adet`, inline: true },
      { name: '🎙️ Kurtarılan Kanallar', value: `**${s.channels}** adet`, inline: true },
      { name: '👥 Üyelere İade Edilen Roller', value: `**${s.rolesGiven}** adet rol teslim edildi`, inline: true }
    )
    .setFooter({ text: 'Nights System Restore Engine • Made by erencix' })
    .setTimestamp();

  await interaction.editReply({ content: '', embeds: [embed] });
}
