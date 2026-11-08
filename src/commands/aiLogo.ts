import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import crypto from 'crypto';
import { LogoStudio } from '../services/image/logoStudio';

// Global cache for pending logo applies
export const pendingLogoCache = new Map<string, { buffer: Buffer; guildId: string }>();

export const data = new SlashCommandBuilder()
  .setName('logo')
  .setDescription('Sunucunuz için 512x512 yüksek çözünürlüklü özel logo üretir.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption((opt) =>
    opt
      .setName('istek')
      .setDescription('Logo nasıl görünsün? (Örn: Neon siberpunk kurt başı, altın taçlı aslan)')
      .setRequired(true)
  )
  .addBooleanOption((opt) =>
    opt
      .setName('uygula')
      .setDescription('Üretilen logoyu hemen sunucu ikonu yapsın mı? (Varsayılan: Hayır)')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    await interaction.reply({ content: 'Bu komut sadece sunucularda kullanılabilir.', ephemeral: true });
    return;
  }

  await interaction.deferReply();

  const prompt = interaction.options.getString('istek', true);
  const autoApply = interaction.options.getBoolean('uygula') ?? false;

  await interaction.editReply({
    content: `🎨 **Yapay Zeka ile Logo Çiziliyor...**\n> Prompt: *"${prompt}"*\nLütfen bekleyin (10-20 saniye sürebilir)...`,
  });

  const studio = new LogoStudio();

  try {
    const result = await studio.generateIcon(prompt);
    const attachment = new AttachmentBuilder(result.buffer, { name: 'server-logo.png' });

    let appliedText = '';
    if (autoApply) {
      if (interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        await studio.applyIconToGuild(interaction.guild, result.buffer);
        appliedText = '\n\n✅ **Sunucu ikonu başarıyla güncellendi!**';
      } else {
        appliedText = '\n\n⚠️ Yetkiniz (Sunucuyu Yönet) olmadığı için logo otomatik uygulanamadı.';
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('🎨 AI Sunucu Logosu Hazır!')
      .setDescription(`**Prompt:** *${prompt}*\n**Kaynak:** \`${result.source.toUpperCase()}\`${appliedText}`)
      .setImage('attachment://server-logo.png')
      .setColor('#9B59B6')
      .setFooter({ text: 'Nights Guard • Made by erencix • 512x512 PNG' })
      .setTimestamp();

    const logoId = crypto.randomBytes(6).toString('hex');
    pendingLogoCache.set(logoId, { buffer: result.buffer, guildId: interaction.guild.id });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`apply_logo:${logoId}`)
        .setLabel('Sunucu Logosu Yap')
        .setEmoji('🖼️')
        .setStyle(ButtonStyle.Success)
    );

    await interaction.editReply({
      content: '',
      embeds: [embed],
      files: [attachment],
      components: autoApply ? [] : [row],
    });
  } catch (err: any) {
    console.error('ai-logo hatası:', err);
    await interaction.editReply({
      content: `❌ Logo üretilirken bir hata oluştu: ${err.message}`,
    });
  }
}
