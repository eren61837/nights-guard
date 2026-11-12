import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  TextChannel,
  GuildMember,
  ChannelType,
} from 'discord.js';
import { GamerHubManager } from '../services/features/gamerHubManager';

export const data = new SlashCommandBuilder()
  .setName('lobi-bul')
  .setDescription('Oyun arkadaşı veya takım toplamak için anında oyun lobisi açar.')
  .addStringOption((option) =>
    option
      .setName('oyun')
      .setDescription('Oynamak istediğiniz oyunu seçin')
      .setRequired(true)
      .addChoices(
        { name: '🎯 Valorant', value: 'valorant' },
        { name: '💣 Counter-Strike 2', value: 'cs2' },
        { name: '⚔️ League of Legends', value: 'lol' },
        { name: '🚗 GTA V / FiveM', value: 'gta' },
        { name: '⛏️ Minecraft', value: 'minecraft' },
        { name: '🧱 Roblox', value: 'roblox' },
        { name: '♟️ Teamfight Tactics (TFT)', value: 'tft' },
        { name: '🎮 Diğer Oyunlar', value: 'diger' }
      )
  )
  .addIntegerOption((option) =>
    option
      .setName('eksik_kisi')
      .setDescription('Kaç takım arkadaşı arıyorsunuz? (1 - 9)')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(9)
  )
  .addStringOption((option) =>
    option
      .setName('rank')
      .setDescription('Aranan rank veya seviye (Örn: Platin+, Elmas, Fark etmez)')
      .setRequired(false)
      .setMaxLength(30)
  )
  .addStringOption((option) =>
    option
      .setName('not')
      .setDescription('Takım için lider notu (Örn: Ses şart, chill oyun)')
      .setRequired(false)
      .setMaxLength(100)
  )
  .addStringOption((option) =>
    option
      .setName('ozel_oyun')
      .setDescription('Diğer seçtiyseniz oyunun tam adı (Örn: Rust, Apex Legends)')
      .setRequired(false)
      .setMaxLength(40)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = interaction.guild;
  const member = interaction.member as GuildMember;

  if (!guild || !member) {
    await interaction.reply({
      content: '❌ Bu komut yalnızca sunucu içerisinde kullanılabilir.',
      ephemeral: true,
    });
    return;
  }

  const gameKey = interaction.options.getString('oyun', true);
  const neededSlots = interaction.options.getInteger('eksik_kisi', true);
  const rank = interaction.options.getString('rank') || 'Fark Etmez / Any Rank';
  const note = interaction.options.getString('not') || 'Ses şart, keyifli oyunlar!';
  const customGame = interaction.options.getString('ozel_oyun');

  // Lobi kartının paylaşılacağı kanalı bul: tercihen #oyun-arkadasi-bul, yoksa mevcut kanal
  let targetChannel = guild.channels.cache.find(
    (c) =>
      c.type === ChannelType.GuildText &&
      (c.name.includes('oyun-arkadasi-bul') || c.name.includes('lobi'))
  ) as TextChannel | undefined;

  if (!targetChannel) {
    if (interaction.channel && interaction.channel.type === ChannelType.GuildText) {
      targetChannel = interaction.channel as TextChannel;
    } else {
      await interaction.reply({
        content: '⚠️ Lobi kartının paylaşılacağı metin kanalı bulunamadı!',
        ephemeral: true,
      });
      return;
    }
  }

  // Toplam koltuk sayısı = Lobi Lideri (1) + Aranan Kişi Sayısı
  const targetSlots = neededSlots + 1;

  try {
    const lobby = await GamerHubManager.createLobby({
      guild,
      channel: targetChannel,
      host: member,
      gameKey,
      customGameName: customGame || undefined,
      targetSlots,
      rankReq: rank,
      note,
    });

    await interaction.reply({
      content: `🎉 **Lobiniz başarıyla oluşturuldu!** <#${targetChannel.id}> kanalında paylaşıldı.`,
      ephemeral: true,
    });
  } catch (err: any) {
    console.error('[LobiCmd] Lobi oluşturulurken hata:', err);
    await interaction.reply({
      content: `❌ Lobi oluşturulamadı: ${err.message}`,
      ephemeral: true,
    });
  }
}
