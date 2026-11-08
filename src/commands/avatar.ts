import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('avatar')
  .setDescription('Bir kullanıcının veya kendinizin HD profil fotoğrafını ve afişini görüntüler.')
  .addUserOption((option) =>
    option
      .setName('kullanici')
      .setDescription('Avatarını görmek istediğiniz kullanıcı (Boş bırakırsanız kendiniz)')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const targetUser = interaction.options.getUser('kullanici') || interaction.user;

  // Force fetch user to get banner if available
  const fetchedUser = await interaction.client.users.fetch(targetUser.id, { force: true }).catch(() => targetUser);

  const avatarUrl = fetchedUser.displayAvatarURL({ size: 4096, extension: 'png' });
  const bannerUrl = (fetchedUser as any).bannerURL?.({ size: 4096, extension: 'png' });

  const embed = new EmbedBuilder()
    .setTitle(`🖼️ ${fetchedUser.username} Profil Avatarı`)
    .setDescription(
      `👤 **Kullanıcı:** <@${fetchedUser.id}> (\`${fetchedUser.id}\`)\n` +
      `🌐 **Profil Linki:** [Görüntüle](${avatarUrl})`
    )
    .setImage(avatarUrl)
    .setColor('#8B5CF6')
    .setFooter({ text: 'Nights Guard Avatar Görüntüleyici • Made by erencix' })
    .setTimestamp();

  if (bannerUrl) {
    embed.addFields({
      name: '🎨 Profil Afişi (Banner)',
      value: `[Afişi Görüntüle](${bannerUrl})`,
      inline: false,
    });
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('Avatarı İndir (HD)')
      .setStyle(ButtonStyle.Link)
      .setURL(avatarUrl)
  );

  if (bannerUrl) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel('Bannerı İndir')
        .setStyle(ButtonStyle.Link)
        .setURL(bannerUrl)
    );
  }

  await interaction.reply({
    embeds: [embed],
    components: [row],
  });
}
