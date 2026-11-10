import {
  ButtonInteraction,
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  TextChannel,
  MessageFlags,
} from 'discord.js';

export class TicketManager {
  public static async handleTicketOpen(interaction: ButtonInteraction): Promise<void> {
    const { guild, user } = interaction;
    if (!guild) return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const channels = await guild.channels.fetch();
    const roles = await guild.roles.fetch();

    // Check if user already has a ticket
    const channelName = `bilet-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const existingChannel = channels.find((c) => c && c.name === channelName);

    if (existingChannel) {
      await interaction.editReply({
        content: `⚠️ Zaten açık bir destek talebiniz bulunuyor: <#${existingChannel.id}>`,
      });
      return;
    }

    // Find or create dedicated ticket category
    let category = channels.find(
      (c) => c && c.type === ChannelType.GuildCategory && (c.name.includes('DESTEK') || c.name.includes('destek'))
    );

    if (!category) {
      try {
        category = await guild.channels.create({
          name: '🎫 ┃ DESTEK TALEPLERİ',
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              deny: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.CreatePublicThreads,
                PermissionFlagsBits.CreatePrivateThreads,
              ],
            },
            ...(guild.members.me
              ? [
                  {
                    id: guild.members.me.id,
                    allow: [
                      PermissionFlagsBits.ViewChannel,
                      PermissionFlagsBits.SendMessages,
                      PermissionFlagsBits.ManageChannels,
                    ],
                  },
                ]
              : []),
          ],
        });
      } catch (catErr) {
        console.error('[TicketManager] Destek kategorisi oluşturulurken hata:', catErr);
      }
    }

    // Find staff or moderator role
    const staffRole = roles.find(
      (r) =>
        r &&
        (r.name.toLowerCase().includes('moderatör') ||
          r.name.toLowerCase().includes('moderator') ||
          r.name.toLowerCase().includes('yönetici') ||
          r.name.toLowerCase().includes('admin') ||
          r.name.toLowerCase().includes('kurucu') ||
          r.name.toLowerCase().includes('yetkili')) &&
        !r.managed
    );

    try {
      const permissionOverwrites: any[] = [
        {
          id: guild.roles.everyone.id,
          deny: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.CreatePublicThreads,
            PermissionFlagsBits.CreatePrivateThreads,
            PermissionFlagsBits.SendMessagesInThreads,
          ],
        },
        {
          id: user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.ReadMessageHistory,
          ],
          deny: [
            PermissionFlagsBits.CreatePublicThreads,
            PermissionFlagsBits.CreatePrivateThreads,
            PermissionFlagsBits.SendMessagesInThreads,
          ],
        },
        {
          id: guild.members.me!.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
      ];

      if (staffRole) {
        permissionOverwrites.push({
          id: staffRole.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        });
      }

      const ticketChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: category?.id,
        topic: `Destek Talebi Sahibi: ${user.tag} (${user.id})`,
        permissionOverwrites,
      });

      const welcomeEmbed = new EmbedBuilder()
        .setTitle(`🎫 Destek Talebi: ${user.username}`)
        .setDescription(
          `Merhaba <@${user.id}>! Talebiniz başarıyla açıldı.\nLütfen sorununuzu, talebinizi veya ekran görüntülerinizi detaylıca iletiniz.\nYetkili ekibimiz en kısa sürede size dönüş yapacaktır.`
        )
        .setColor('#3498DB')
        .addFields(
          { name: '👤 Kullanıcı', value: `<@${user.id}>`, inline: true },
          { name: '🛡️ İlgili Ekip', value: staffRole ? `<@&${staffRole.id}>` : 'Yetkili Ekip', inline: true }
        )
        .setFooter({ text: 'Talebi sonlandırmak için aşağıdaki butona basabilirsiniz.' })
        .setTimestamp();

      const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_close')
          .setLabel('Talebi Kapat')
          .setEmoji('🔒')
          .setStyle(ButtonStyle.Danger)
      );

      await ticketChannel.send({
        content: `<@${user.id}> ${staffRole ? `<@&${staffRole.id}>` : ''}`,
        embeds: [welcomeEmbed],
        components: [actionRow],
      });

      await interaction.editReply({
        content: `✅ Destek talebiniz açıldı: <#${ticketChannel.id}>`,
      });
    } catch (err: any) {
      console.error('[TicketManager] Hata:', err);
      await interaction.editReply({
        content: `❌ Destek kanalı oluşturulamadı: ${err.message}`,
      });
    }
  }

  public static getTicketPanelEmbed(): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle('🎫 NIGHTS DESTEK & TALEP MERKEZİ 🛡️')
      .setDescription(
        'Sunucumuzla ilgili soru, şikayet, öneri veya yetkili destek ihtiyaçlarınız için tek tıkla talep oluşturabilirsiniz.\n\n' +
        '### 📌 Destek Konuları:\n' +
        '• 🛡️ Sunucu İçi Şikayet ve İhlal Bildirimi\n' +
        '• ⭐ Rol, Seviye veya Çekiliş Ödülü Talebi\n' +
        '• 🤝 Partnerlik & İş Birliği Görüşmeleri\n' +
        '• 💡 Öneri ve Geri Bildirimler\n\n' +
        '> 💡 *Aşağıdaki **📩 Destek Talebi Aç** butonuna basarak size ve yetkililere özel güvenli bir destek odası başlatabilirsiniz.*'
      )
      .setImage('https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif')
      .setColor('#3498DB')
      .setFooter({ text: 'Nights Ticket Engine • Made by erencix' });
  }

  public static getTicketPanelControls(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_open')
        .setLabel('Destek Talebi Aç')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📩')
    );
  }

  public static async handleTicketClose(interaction: ButtonInteraction): Promise<void> {
    const channel = interaction.channel as TextChannel;
    if (!channel || channel.type !== ChannelType.GuildText) return;

    await interaction.reply({
      content: '🔒 Bu destek talebi 5 saniye içinde kapatılıp silinecektir...',
    });

    setTimeout(async () => {
      try {
        await channel.delete('Destek talebi kullanıcı/yetkili tarafından kapatıldı.');
      } catch (err) {
        console.error('[TicketManager] Kanal silinirken hata:', err);
      }
    }, 5000);
  }
}
