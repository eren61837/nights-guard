import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  GuildMember,
} from 'discord.js';
import { ErenModManager } from '../services/features/erenModManager';

export const data = new SlashCommandBuilder()
  .setName('erenmod')
  .setDescription("Erencix'in özel favori müzik modunu başlatır veya çalma listesini yönetir!")
  .addStringOption((option) =>
    option
      .setName('eylem')
      .setDescription('Yapmak istediğiniz işlem (Boş bırakırsanız Eren Modu başlar)')
      .setRequired(false)
      .addChoices(
        { name: '▶️ Eren Modunu Başlat / Play', value: 'cal' },
        { name: '🔀 Karışık Çal / Shuffle', value: 'karistir' },
        { name: '📋 Favori Şarkı Listesini Gör', value: 'liste' },
        { name: '➕ Listeye Yeni Şarkı Ekle', value: 'ekle' },
        { name: '❌ Listeden Şarkı Sil', value: 'sil' }
      )
  )
  .addStringOption((option) =>
    option
      .setName('sarki')
      .setDescription('Eklemek istediğiniz şarkı adı veya linki (Ekle işlemi için)')
      .setRequired(false)
      .setMaxLength(100)
  )
  .addIntegerOption((option) =>
    option
      .setName('sira')
      .setDescription('Silmek istediğiniz şarkının sıra numarası (Sil işlemi için)')
      .setRequired(false)
      .setMinValue(1)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const action = interaction.options.getString('eylem') || 'cal';
  const songParam = interaction.options.getString('sarki');
  const indexParam = interaction.options.getInteger('sira');
  const member = interaction.member as GuildMember;

  // 1. ŞARKI LİSTESİNİ GÖRÜNTÜLE
  if (action === 'liste') {
    const list = ErenModManager.getPlaylist();
    const formatted = list
      .map((s, i) => `> **${i + 1}.** 🎵 \`${s}\``)
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setAuthor({
        name: `👑 ERENCİX RESMİ VIP ÇALMA LİSTESİ`,
        iconURL: interaction.guild?.iconURL() || undefined,
      })
      .setTitle(`🎧  Eren'in Favori Parçaları (${list.length} Şarkı)`)
      .setDescription(
        `Aşağıdaki parçalar \`/erenmod\` komutu çalıştığında sırayla ses odasında çalar:\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        formatted +
        `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `💡 *Şarkı eklemek için:* \`/erenmod eylem:ekle sarki:<şarkı adı>\`\n` +
        `💡 *Şarkı silmek için:* \`/erenmod eylem:sil sira:<numara>\``
      )
      .setFooter({ text: 'Nights Guard VIP Audio Engine • Made by erencix' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    return;
  }

  // 2. YENİ ŞARKI EKLE
  if (action === 'ekle') {
    if (!songParam) {
      await interaction.reply({
        content: '⚠️ Lütfen eklemek istediğiniz şarkının adını girin! (Örn: `/erenmod eylem:ekle sarki:Motive - 10MG`)',
        ephemeral: true,
      });
      return;
    }

    const ok = ErenModManager.addSong(songParam);
    if (ok) {
      await interaction.reply({
        content: `✅ **"${songParam}"** başarıyla Eren Modu listesine eklendi! 🎶`,
      });
    } else {
      await interaction.reply({
        content: `⚠️ Bu şarkı zaten listede mevcut veya geçersiz.`,
        ephemeral: true,
      });
    }
    return;
  }

  // 3. ŞARKI SİL
  if (action === 'sil') {
    if (!indexParam) {
      await interaction.reply({
        content: '⚠️ Lütfen silmek istediğiniz şarkının sıra numarasını girin! Önce `/erenmod eylem:liste` ile numaralara bakabilirsiniz.',
        ephemeral: true,
      });
      return;
    }

    const removed = ErenModManager.removeSong(indexParam - 1);
    if (removed) {
      await interaction.reply({
        content: `🗑️ **"${removed}"** listeden silindi!`,
      });
    } else {
      await interaction.reply({
        content: '⚠️ Geçersiz sıra numarası!',
        ephemeral: true,
      });
    }
    return;
  }

  // 4. EREN MODUNU BAŞLAT (cal veya karistir)
  const isShuffle = action === 'karistir';
  await ErenModManager.playErenMod({ interaction }, interaction.client, isShuffle);
}
