import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} from 'discord.js';
import crypto from 'crypto';
import { AIManager } from '../services/ai/aiManager';
import { BlueprintCache } from '../services/engine/blueprintCache';
import { ServerDiagnostics } from '../services/engine/diagnostics';

export const data = new SlashCommandBuilder()
  .setName('kur')
  .setDescription('Sunucunuza profesyonel bir mimari, roller ve kanallar kurar.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption((opt) =>
    opt
      .setName('istek')
      .setDescription('Nasıl bir sunucu istiyorsunuz? (Örn: Anime RP, Valorant takımı)')
      .setRequired(true)
  )
  .addBooleanOption((opt) =>
    opt
      .setName('temizlik_modu')
      .setDescription('Mevcut kanalları ve rolleri temizleyip kursun mu? (Varsayılan: Hayır)')
      .setRequired(false)
  )
  .addBooleanOption((opt) =>
    opt
      .setName('otomatik_logo')
      .setDescription('AI ile logo üretip sunucu ikonu yapsın mı? (Varsayılan: Evet)')
      .setRequired(false)
  )
  .addStringOption((opt) =>
    opt
      .setName('stil')
      .setDescription('Sunucunun tasarım tarzı')
      .addChoices(
        { name: 'Modern & Estetik', value: 'modern' },
        { name: 'Minimalist & Sade', value: 'minimalist' },
        { name: 'Gaming / Oyun Temalı', value: 'gaming' },
        { name: 'Anime / RP Temalı', value: 'anime' },
        { name: 'Kurumsal / Profesyonel', value: 'professional' }
      )
  )
  .addStringOption((opt) =>
    opt
      .setName('dil')
      .setDescription('Kanal ve rol isimlerinin dili')
      .addChoices(
        { name: 'Türkçe (TR)', value: 'tr' },
        { name: 'English (EN)', value: 'en' }
      )
  );

export async function execute(interaction: ChatInputCommandInteraction, aiManager: AIManager) {
  if (!interaction.guild) {
    await interaction.reply({ content: 'Bu komut sadece sunucularda kullanılabilir.', ephemeral: true });
    return;
  }

  // Check admin rights of invoking user
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: '❌ Bu komutu çalıştırmak için `Yönetici` (Administrator) yetkisine sahip olmalısınız.',
      ephemeral: true,
    });
    return;
  }

  // Check Bot Diagnostics (Permissions & Role Hierarchy)
  const diagnostics = ServerDiagnostics.check(interaction.guild);
  if (!diagnostics.canDeploy) {
    await interaction.reply({
      content: '⚠️ **Bot yetkileri veya rol hiyerarşisi eksik!** Kuruluma başlamadan önce lütfen aşağıdaki ayarları tamamlayın:',
      embeds: [diagnostics.troubleshootingEmbed],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const prompt = interaction.options.getString('istek', true);
  const cleanSlate = interaction.options.getBoolean('temizlik_modu') ?? false;
  const applyLogo = interaction.options.getBoolean('otomatik_logo') ?? true;
  const style = (interaction.options.getString('stil') as any) || 'modern';
  const locale = (interaction.options.getString('dil') as any) || 'tr';

  await interaction.editReply({
    content: `🧠 **Yapay Zeka Mimarisi Hesaplanıyor...**\n> İstek: *"${prompt}"*\n> Stil: \`${style}\` | Temizlik Modu: \`${cleanSlate ? 'AÇIK (Sıfırdan Silinecek)' : 'KAPALI (Üzerine Eklenecek)'}\`\nLütfen bir iki saniye bekleyin, tüm roller, kanallar, izinler ve kurallar tasarlanıyor...`,
  });

  try {
    const { blueprint, source } = await aiManager.generateBlueprint({
      prompt,
      style,
      locale,
      cleanSlate,
    });

    const cacheId = crypto.randomBytes(6).toString('hex');
    BlueprintCache.set({
      id: cacheId,
      userId: interaction.user.id,
      guildId: interaction.guild.id,
      blueprint,
      cleanSlate,
      applyLogo,
      createdAt: Date.now(),
    });

    // Count totals
    let totalChannels = 0;
    for (const cat of blueprint.categories) {
      totalChannels += cat.channels?.length || 0;
    }

    const previewEmbed = new EmbedBuilder()
      .setTitle(`🏛️ Sunucu Mimarisi Tasarlandı: ${blueprint.serverName}`)
      .setDescription(
        `**Tema:** ${blueprint.theme}\n**Açıklama:** ${blueprint.serverDescription}\n**Kaynak:** \`${source.toUpperCase()}\`\n\nAşağıda AI tarafından hazırlanan mimarinin özeti yer almaktadır. Onayladığınız takdirde bot sunucuyu birebir inşa etmeye başlayacaktır.`
      )
      .setColor('#5865F2')
      .addFields(
        {
          name: '🛡️ Rol Hiyerarşisi (' + blueprint.roles.length + ' Rol)',
          value: blueprint.roles.map((r) => `• \`${r.name}\``).join('\n').slice(0, 1024),
          inline: true,
        },
        {
          name: '📁 Kategoriler & Kanallar',
          value: `• **${blueprint.categories.length} Kategori**\n• **${totalChannels} Kanal**\n• Kurallar & Bilgi Embedleri\n• AutoMod Koruma Kuralları`,
          inline: true,
        },
        {
          name: '⚙️ Özel Entegrasyonlar',
          value: `• **Ticket Paneli:** ${blueprint.features?.ticketSystem?.enabled ? '✅ Aktif' : '❌ Pasif'}\n• **Geçici Ses Odası (Join-to-Create):** ${blueprint.features?.joinToCreate?.enabled ? '✅ Aktif' : '❌ Pasif'}\n• **AI Logo:** ${applyLogo ? '🎨 Üretilip Uygulanacak' : 'İptal'}\n• **Temizlik Modu:** ${cleanSlate ? '⚠️ Mevcut sunucu sıfırlanacak' : '➕ Mevcut sunucunun üzerine eklenecek'}`,
          inline: false,
        }
      )
      .setFooter({ text: 'Nights Guard • Made by erencix' })
      .setTimestamp();

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`build_confirm:${cacheId}`)
        .setLabel('Onayla ve İnşa Et!')
        .setEmoji('🚀')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`build_details:${cacheId}`)
        .setLabel('Detaylı Planı İncele')
        .setEmoji('📋')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`build_cancel:${cacheId}`)
        .setLabel('İptal Et')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.editReply({
      content: '',
      embeds: [previewEmbed],
      components: [actionRow],
    });
  } catch (err: any) {
    console.error('ai-kur hatası:', err);
    await interaction.editReply({
      content: `❌ Bir hata oluştu: ${err.message}`,
    });
  }
}
