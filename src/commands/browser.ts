import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} from 'discord.js';
import { BlueprintCache } from '../services/engine/blueprintCache';
import { DashboardServer } from '../services/web/dashboardServer';

export const data = new SlashCommandBuilder()
  .setName('browser')
  .setDescription('Sunucu mimarisini web tarayıcısında interaktif görüntüler.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  const port = DashboardServer.getActivePort() || parseInt(process.env.PORT || '3000', 10);
  const baseUrl = `http://localhost:${port}`;
  
  const guildId = interaction.guildId || '';
  const latestBlueprint = BlueprintCache.getLatestByGuild(guildId);

  const targetUrl = latestBlueprint ? `${baseUrl}/blueprint/${latestBlueprint.id}` : baseUrl;

  const embed = new EmbedBuilder()
    .setTitle('🌐 Nights Guard Web Companion Studio')
    .setDescription(
      'Nights Guard mimari planlarını, kanal hiyerarşisini, rol izin matrisini ve AutoMod kurallarını doğrudan web tarayıcınızda interaktif olarak inceleyin!'
    )
    .setColor('#5865F2')
    .addFields(
      {
        name: '🖥️ Web Dashboard URL',
        value: `[\`${targetUrl}\`](${targetUrl})`,
        inline: false,
      },
      {
        name: '✨ Tarayıcı Özellikleri',
        value:
          '• **Görsel Sunucu Ağacı:** Kategoriler, kanallar ve özel izin kilitleri\n' +
          '• **Rol Hiyerarşisi:** Renkler, hoisted roller ve yetki sayaçları\n' +
          '• **JSON Dışa Aktarma:** Tek tıkla blueprint kopyalama ve yedekleme\n' +
          '• **Canlı Sistem Durumu:** Bot sağlığı, bellek kullanımı ve gecikme değerleri',
        inline: false,
      }
    )
    .setFooter({ text: 'Nights Guard • Made by erencix' })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setURL(targetUrl)
      .setLabel('Web Tarayıcısında Aç')
      .setEmoji('🌐')
      .setStyle(ButtonStyle.Link)
  );

  await interaction.reply({
    embeds: [embed],
    components: [row],
  });
}
