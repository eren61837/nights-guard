import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  MessageFlags,
} from 'discord.js';
import { MusicPlayer } from '../services/features/musicPlayer';

export const calData = new SlashCommandBuilder()
  .setName('cal')
  .setDescription('YouTube veya SoundCloud üzerinden şarkı arar ve ses kanalında çalar.')
  .addStringOption((option) =>
    option.setName('sarki').setDescription('Şarkı adı veya video linki').setRequired(true)
  );

export const durdurData = new SlashCommandBuilder()
  .setName('durdur')
  .setDescription('Çalan müziği duraklatır.');

export const devamData = new SlashCommandBuilder()
  .setName('devam')
  .setDescription('Duraklatılan müziği devam ettirir.');

export const gecData = new SlashCommandBuilder()
  .setName('gec')
  .setDescription('Sıradaki şarkıya geçer.');

export const kuyrukData = new SlashCommandBuilder()
  .setName('kuyruk')
  .setDescription('Çalma listesini görüntüler.');

export const ayrilData = new SlashCommandBuilder()
  .setName('ayril')
  .setDescription('Botu ses kanalından çıkarır ve listeyi temizler.');

export const sesData = new SlashCommandBuilder()
  .setName('ses')
  .setDescription('Müzik ses seviyesini ayarlar (1-150).')
  .addIntegerOption((option) =>
    option.setName('seviye').setDescription('Ses seviyesi (1 - 150)').setRequired(true).setMinValue(1).setMaxValue(150)
  );

export async function executeCal(interaction: ChatInputCommandInteraction) {
  // Anında Defer Et (Discord 3000ms zaman aşımı ve 10062 hatasını garantili engelle)
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply().catch(() => {});
  }
  const query = interaction.options.getString('sarki', true);
  await MusicPlayer.handlePlay({ interaction }, query, interaction.client);
}

export async function executeDurdur(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) return;
  const ok = MusicPlayer.pause(guildId);
  await interaction.reply({
    content: ok ? '⏸️ Müzik duraklatıldı. Devam ettirmek için `/devam` kullanabilirsiniz.' : '⚠️ Şu anda çalan aktif bir müzik yok.',
    flags: MessageFlags.Ephemeral,
  }).catch(() => {});
}

export async function executeDevam(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) return;
  const ok = MusicPlayer.resume(guildId);
  await interaction.reply({
    content: ok ? '▶️ Müzik devam ettiriliyor.' : '⚠️ Duraklatılmış bir müzik bulunmuyor.',
    flags: MessageFlags.Ephemeral,
  }).catch(() => {});
}

export async function executeGec(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) return;
  const ok = MusicPlayer.skip(guildId, interaction.client);
  await interaction.reply({
    content: ok ? '⏭️ Sıradaki şarkıya geçildi.' : '⚠️ Sırada geçilecek şarkı yok.',
    flags: MessageFlags.Ephemeral,
  }).catch(() => {});
}

export async function executeKuyruk(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) return;
  const q = MusicPlayer.queues.get(guildId);
  if (!q || q.songs.length === 0) {
    await interaction.reply({ content: '📭 Çalma listesinde şarkı bulunmuyor.', flags: MessageFlags.Ephemeral }).catch(() => {});
    return;
  }
  let desc = '';
  q.songs.slice(0, 10).forEach((s, idx) => {
    desc += `${idx === 0 ? '▶️' : `**#${idx + 1}**`} [${s.title}](${s.url}) (\`${s.duration}\`)\n`;
  });
  if (q.songs.length > 10) desc += `*...ve ${q.songs.length - 10} şarkı daha.*`;

  await interaction.reply({
    embeds: [
      {
        title: `📜 Sunucu Çalma Listesi (${q.songs.length} Parça)`,
        description: desc,
        color: 0x5865f2,
        footer: { text: `Ses: %${q.volume} • Döngü: ${q.loopMode}` },
      },
    ],
    flags: MessageFlags.Ephemeral,
  }).catch(() => {});
}

export async function executeAyril(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) return;
  const ok = MusicPlayer.stop(guildId, interaction.client);
  await interaction.reply({
    content: ok ? '⏹️ Müzik durduruldu ve kanaldan ayrılınarak liste sıfırlandı.' : '⚠️ Bot ses kanalında bulunmuyor.',
    flags: MessageFlags.Ephemeral,
  }).catch(() => {});
}

export async function executeSes(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) return;
  const level = interaction.options.getInteger('seviye', true);
  const ok = MusicPlayer.setVolume(guildId, level);
  await interaction.reply({
    content: ok ? `🔊 Ses seviyesi **%${level}** olarak ayarlandı.` : '⚠️ Çalan bir müzik bulunmuyor.',
    flags: MessageFlags.Ephemeral,
  }).catch(() => {});
}
