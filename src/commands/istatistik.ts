import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  version as djsVersion,
} from 'discord.js';
import os from 'os';

export const data = new SlashCommandBuilder()
  .setName('istatistik')
  .setDescription('Botun anlık ping, çalışma süresi, RAM ve teknik verilerini gösterir.');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const client = interaction.client;

  // Uptime formatting
  const totalSeconds = Math.floor((client.uptime || 0) / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const uptimeStr = `${days > 0 ? `${days}g ` : ''}${hours}s ${minutes}d ${seconds}sn`;

  // Memory usage
  const memUsage = process.memoryUsage();
  const heapUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(1);
  const rssMB = (memUsage.rss / 1024 / 1024).toFixed(1);

  // Ping
  const wsPing = client.ws.ping;

  // Guild & Member count
  const totalGuilds = client.guilds.cache.size;
  let totalMembers = 0;
  client.guilds.cache.forEach((g) => {
    totalMembers += g.memberCount;
  });

  const embed = new EmbedBuilder()
    .setTitle('📊 NIGHTS GUARD • SİSTEM İSTATİSTİKLERİ')
    .setDescription('Nights Guard; 7/24 kesintisiz çalışan, ultra optimize bir sunucu koruma ve yönetim botudur.')
    .addFields(
      {
        name: '⚡ Gecikme & Performans',
        value: `• **API Ping:** \`${wsPing} ms\`\n• **Çalışma Süresi:** \`${uptimeStr}\`\n• **Aktif Durum:** \`🟢 7/24 Kesintisiz\``,
        inline: true,
      },
      {
        name: '💾 Bellek & Sistem',
        value: `• **RAM Kullanımı:** \`${heapUsedMB} MB\` (RSS: \`${rssMB} MB\`)\n• **Platform:** \`${os.platform()} (${os.arch()})\`\n• **Node.js:** \`${process.version}\``,
        inline: true,
      },
      {
        name: '🌐 Topluluk & Hizmet',
        value: `• **Sunucular:** \`${totalGuilds}\`\n• **Toplam Üye:** \`${totalMembers}\`\n• **Discord.js:** \`v${djsVersion}\``,
        inline: false,
      },
      {
        name: '👑 Geliştirici & Mimari',
        value: `• **Geliştirici:** <@1138498666785677492> (\`erencix\`)\n• **Bot Sürümü:** \`v1.5.0 Pro Edition\``,
        inline: false,
      }
    )
    .setColor('#8B5CF6')
    .setThumbnail(client.user?.displayAvatarURL() || '')
    .setFooter({ text: 'Nights Guard System Diagnostics • Made by erencix' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
