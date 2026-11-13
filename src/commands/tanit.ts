import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  TextChannel,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('tanit')
  .setDescription('Arkadaşlarını çağırmak veya diğer platformlarda paylaşmak için hazır sunucu reklam metni üretir.');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply({ content: 'Bu komut sunucu içinde kullanılabilir.', ephemeral: true });
    return;
  }

  let inviteUrl = 'https://discord.gg';
  try {
    let ch = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && (c.name.includes('hos-geldin') || c.name.includes('sohbet'))
    ) as TextChannel | undefined;
    if (!ch) ch = interaction.channel as TextChannel;

    const invite = await ch.createInvite({ maxAge: 0, maxUses: 0, unique: false });
    inviteUrl = invite.url;
  } catch (e) {}

  const promoText =
    `╭━━━━━ 🌙 **☊ NIGHTS TOPLULUĞU** ━━━━━╮\n` +
    `🎮 **Valorant, CS2, LoL ve Ekip Oyunları:** 7/24 aktif lobi arama ve ses odaları!\n` +
    `🤖 **Akıllı Yapay Zeka:** 7/24 kesintisiz sohbet ve roast motoru!\n` +
    `🎵 **384kbps Hi-Fi Müzik & Radyo:** Kesintisiz yüksek kaliteli müzik keyfi!\n` +
    `🎁 **Özel Davet & Level Ödülleri:** Aktif kaldıkça VIP roller ve Nights Coin kazan!\n` +
    `🛡️ **Toksisiteden Uzak Güvenli Ortam:** 7/24 yapay zeka korumalı huzurlu sohbet!\n\n` +
    `👇 **Sen de hemen aramıza katıl:**\n` +
    `🔗 **Bağlantı:** ${inviteUrl}\n` +
    `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

  const embed = new EmbedBuilder()
    .setColor(0x8b5cf6)
    .setTitle('📢 SUNUCU REKLAM & TANITIM ŞABLONU HAZIR!')
    .setDescription(
      `Arkadaşlarını sunucuya davet ederken veya diğer platformlarda paylaşırken aşağıdaki metni kopyalayabilirsin:\n\n` +
      `\`\`\`text\n${promoText}\n\`\`\`\n` +
      `💡 *Metni kopyalayıp WhatsApp, Discord DM, forumlar veya sosyal medyada paylaşarak kolayca arkadaş toplayabilirsin!*`
    )
    .setImage('https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif')
    .setFooter({ text: 'Nights Viral Marketing Engine • Made by erencix' })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('🚀 Sunucu Davet Bağlantısı')
      .setStyle(ButtonStyle.Link)
      .setURL(inviteUrl)
      .setEmoji('🔗')
  );

  await interaction.reply({
    embeds: [embed],
    components: [row],
  });
}
