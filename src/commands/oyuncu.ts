import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('oyuncu')
  .setDescription('Oyuncunun oyun istatistiklerini, profilini ve istatistik linklerini gösterir.')
  .addStringOption((option) =>
    option
      .setName('oyun')
      .setDescription('İstatistiklerini görmek istediğiniz oyun')
      .setRequired(true)
      .addChoices(
        { name: '🎯 Valorant', value: 'valorant' },
        { name: '💣 Counter-Strike 2', value: 'cs2' },
        { name: '⚔️ League of Legends', value: 'lol' },
        { name: '♟️ Teamfight Tactics (TFT)', value: 'tft' }
      )
  )
  .addStringOption((option) =>
    option
      .setName('etiket')
      .setDescription('Oyuncu adı veya etiketi (Örn: RiotID#TR1 veya Steam Nick)')
      .setRequired(true)
      .setMaxLength(50)
  )
  .addUserOption((option) =>
    option
      .setName('kullanici')
      .setDescription('Sunucudaki Discord kullanıcısı (isteğe bağlı)')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const game = interaction.options.getString('oyun', true);
  const tag = interaction.options.getString('etiket', true).trim();
  const targetUser = interaction.options.getUser('kullanici') || interaction.user;
  const guild = interaction.guild;

  let title = '';
  let trackerUrl = '';
  let color = 0x8b5cf6;
  let iconUrl = '';
  let bannerUrl = '';
  let gameName = '';

  if (game === 'valorant') {
    gameName = 'Valorant';
    color = 0xff4655;
    iconUrl = 'https://cdn3.emoji.gg/emojis/3042-valorant.png';
    bannerUrl = 'https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif';
    // Format tag: Name#TAG -> Name%23TAG
    const encoded = encodeURIComponent(tag.replace('#', '%23'));
    trackerUrl = `https://tracker.gg/valorant/profile/riot/${encoded}/overview`;
    title = `🎯 VALORANT OYUNCU PROFİLİ: ${tag}`;
  } else if (game === 'cs2') {
    gameName = 'Counter-Strike 2';
    color = 0xde9b35;
    iconUrl = 'https://cdn3.emoji.gg/emojis/137353-diamondpickaxe.gif';
    bannerUrl = 'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif';
    const encoded = encodeURIComponent(tag);
    trackerUrl = `https://tracker.gg/cs2/profile/steam/${encoded}/overview`;
    title = `💣 CS2 OYUNCU PROFİLİ: ${tag}`;
  } else if (game === 'lol') {
    gameName = 'League of Legends';
    color = 0x0ac8b9;
    iconUrl = 'https://cdn3.emoji.gg/emojis/25903-potion.gif';
    bannerUrl = 'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif';
    const encoded = encodeURIComponent(tag.replace('#', '-'));
    trackerUrl = `https://www.op.gg/summoners/tr/${encoded}`;
    title = `⚔️ LOL SİHİRDAR PROFİLİ: ${tag}`;
  } else if (game === 'tft') {
    gameName = 'Teamfight Tactics';
    color = 0x9b59b6;
    iconUrl = 'https://cdn3.emoji.gg/emojis/527084-milkbucket.gif';
    bannerUrl = 'https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif';
    const encoded = encodeURIComponent(tag.replace('#', '-'));
    trackerUrl = `https://tactics.tools/player/tr/${encoded}`;
    title = `♟️ TFT STRATEJİST PROFİLİ: ${tag}`;
  }

  const embed = new EmbedBuilder()
    .setColor(color)
    .setAuthor({
      name: `${targetUser.username.toUpperCase()} • ${gameName.toUpperCase()}`,
      iconURL: targetUser.displayAvatarURL(),
    })
    .setTitle(title)
    .setDescription(
      `👤 **Discord Kullanıcısı:** <@${targetUser.id}>\n` +
      `🎮 **Oyun Hesabı:** \`${tag}\`\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📊 **Canlı İstatistikler & Maç Geçmişi:**\n` +
      `> KD Oranı, Kazanma Yüzdesi, Son Maçlar ve Rank durumunu canlı incelemek için aşağıdaki **Tracker** butonuna tıklayabilirsiniz.\n\n` +
      `💡 *Takım arkadaşı arıyorsan </lobi-bul:0> komutuyla hemen lobi açabilirsin!*`
    )
    .setThumbnail(iconUrl || targetUser.displayAvatarURL())
    .setImage(bannerUrl)
    .setFooter({
      text: `${guild?.name || 'Nights Topluluğu'} • Gamer Hub`,
      iconURL: guild?.iconURL() || undefined,
    })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('📊 Tracker / OP.GG Profilini Aç')
      .setStyle(ButtonStyle.Link)
      .setURL(trackerUrl)
      .setEmoji('🔗')
  );

  await interaction.reply({
    embeds: [embed],
    components: [row],
  });
}
