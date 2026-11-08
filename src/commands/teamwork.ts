import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('teamwork')
  .setDescription('Yetkili ekip koordinasyonu, görevler ve moderasyon paneli.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand((sub) =>
    sub
      .setName('kadro')
      .setDescription('Sunucu yönetim ekibini ve görev dağılımını gösterir.')
  )
  .addSubcommand((sub) =>
    sub
      .setName('gorevler')
      .setDescription('Yetkili ekibi için moderasyon durumunu listeler.')
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const { guild } = interaction;
  if (!guild) {
    await interaction.reply({ content: 'Bu komut sadece sunucularda çalışır.', ephemeral: true });
    return;
  }

  const subcommand = interaction.options.getSubcommand() || 'kadro';

  if (subcommand === 'kadro') {
    const roles = guild.roles.cache;
    const adminRoles = roles.filter((r) => r.permissions.has(PermissionFlagsBits.Administrator) && !r.managed);
    const modRoles = roles.filter(
      (r) =>
        r.permissions.has(PermissionFlagsBits.ManageMessages) &&
        !r.permissions.has(PermissionFlagsBits.Administrator) &&
        !r.managed
    );

    const embed = new EmbedBuilder()
      .setTitle(`🛡️ Nights Guard Teamwork: ${guild.name} Yönetim Kadrosu`)
      .setDescription('Sunucuda görev alan yetkili grupları ve hiyerarşik dağılım:')
      .setColor('#2ECC71')
      .addFields(
        {
          name: '👑 Üst Yönetim Rolleri',
          value: adminRoles.map((r) => `• <@&${r.id}> (${r.members.size} Üye)`).join('\n') || 'Tanımlı rol yok',
          inline: false,
        },
        {
          name: '🛡️ Moderasyon & Destek Ekibi',
          value: modRoles.map((r) => `• <@&${r.id}> (${r.members.size} Üye)`).join('\n') || 'Tanımlı rol yok',
          inline: false,
        },
        {
          name: '🤝 Teamwork Koordinasyon Araçları',
          value:
            '• **Ticket Atamaları:** Butonla açılan destek talepleri otomatik moderatör rolüne etiketlenir.\n• **AutoMod Kayıtları:** Küfür ve spam ihlalleri `#mod-log` kanalına anlık aktarılır.\n• **Sesli Toplantı:** Yönetici ses odası sadece yetkililerin erişimine açıktır.',
          inline: false,
        }
      )
      .setFooter({ text: 'Nights Guard • Made by erencix' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    return;
  }

  if (subcommand === 'gorevler') {
    const embed = new EmbedBuilder()
      .setTitle('📋 Nights Guard Teamwork: Görev & Destek Panosu')
      .setDescription('Ekip üyelerinin dikkat etmesi gereken aktif görevler:')
      .setColor('#3498DB')
      .addFields(
        {
          name: '🎫 Destek Talepleri (Tickets)',
          value: '• Yeni açılan taleplere ortalama yanıt süresi hedefi: **< 15 dakika**\n• Çözülen talepleri `[Talebi Kapat]` butonuyla arşivleyin.',
          inline: false,
        },
        {
          name: '🛡️ Güvenlik & AutoMod İhlalleri',
          value: '• Şüpheli link veya spam algılandığında kullanıcıyı inceleyip gerekirse zaman aşımı (Timeout) uygulayın.',
          inline: false,
        },
        {
          name: '🌟 Topluluk Karşılama',
          value: '• `#hos-geldiniz` kanalında yeni katılan üyelere rehberlik edin.',
          inline: false,
        }
      )
      .setFooter({ text: 'Nights Guard • Made by erencix' });

    await interaction.reply({ embeds: [embed] });
  }
}
