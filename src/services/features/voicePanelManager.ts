import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  VoiceChannel,
  GuildMember,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
  ButtonInteraction,
  MessageFlags,
} from 'discord.js';
import { VoiceLobbyManager } from './voiceLobbyManager';

export class VoicePanelManager {
  public static getVoicePanelEmbed(): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle('🎛️ NIGHTS GELİŞMİŞ SES ODASI KONTROL MERKEZİ 🎙️')
      .setDescription(
        'Özel ses odanızı aşağıdaki 10 güçlü kontrol seçeneğiyle dilediğiniz gibi yönetin ve özelleştirin!\n\n' +
        '### ⚡ Kontrol Seçenekleri:\n' +
        '• 🔒 **Odayı Kilitle:** Odaya yabancı üyelerin girişini engeller.\n' +
        '• 🔓 **Kilidi Aç:** Odanın kilidini açar, tüm üyeler katılabilir.\n' +
        '• 👁️ **Gizle / Göster:** Odayı kanallar listesinde gizler veya görünür yapar.\n' +
        '• 👥 **Kişi Limiti:** Oda kapasitesini sırayla ayarlar *(2 ➔ 5 ➔ 10 ➔ 15 ➔ Sınırsız)*.\n' +
        '• ✏️ **İsim Değiştir:** Odanızın adını modal penceresinden özelleştirir.\n' +
        '• 🔇 **Odayı Sustur / Aç:** Odanın genel konuşma iznini açar veya kapatır.\n' +
        '• 🚀 **Ses Kalitesi (Bitrate):** Kristal netliğinde Hi-Fi ses kalitesi sunar.\n' +
        '• 👑 **Sahipliği Al:** Sahibi ayrılmış odanın liderliğini üzerinize tanımlar.\n' +
        '• 📊 **Oda Durumu:** Aktif oda bilgileri, limit ve üye durumunu gösterir.\n' +
        '• ➕ **Özel Oda Aç:** Sizin adınıza anında yeni bir özel ses odası kurar.\n\n' +
        '> 💡 *Butonları kullanabilmek için sunucumuzdaki bir ses kanalında bulunmanız gerekmektedir.*'
      )
      .setImage('https://media.giphy.com/media/ErZ8hv5eO92JW/giphy.gif')
      .setColor('#9B59B6')
      .setFooter({ text: 'Nights Advanced Voice Studio • Made by erencix' });
  }

  public static getVoicePanelControls(): ActionRowBuilder<ButtonBuilder>[] {
    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_voice_lock')
        .setLabel('Odayı Kilitle')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒'),
      new ButtonBuilder()
        .setCustomId('btn_voice_unlock')
        .setLabel('Kilidi Aç')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🔓'),
      new ButtonBuilder()
        .setCustomId('btn_voice_hide')
        .setLabel('Gizle / Göster')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('👁️'),
      new ButtonBuilder()
        .setCustomId('btn_voice_limit')
        .setLabel('Kişi Limiti')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('👥'),
      new ButtonBuilder()
        .setCustomId('btn_voice_rename')
        .setLabel('İsim Değiştir')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('✏️')
    );

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_voice_mute')
        .setLabel('Sustur / Aç')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔇'),
      new ButtonBuilder()
        .setCustomId('btn_voice_bitrate')
        .setLabel('Bitrate (Kalite)')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🚀'),
      new ButtonBuilder()
        .setCustomId('btn_voice_claim')
        .setLabel('Sahipliği Al')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('👑'),
      new ButtonBuilder()
        .setCustomId('btn_voice_info')
        .setLabel('Oda Durumu')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📊'),
      new ButtonBuilder()
        .setCustomId('btn_voice_create')
        .setLabel('Özel Oda Aç')
        .setStyle(ButtonStyle.Success)
        .setEmoji('➕')
    );

    return [row1, row2];
  }

  public static async handleVoiceButton(interaction: ButtonInteraction): Promise<void> {
    const member = interaction.member as GuildMember;
    const guild = interaction.guild;
    if (!member || !guild) return;

    const customId = interaction.customId;

    // 1. Özel Oda Aç butonu: Ses kanalında olmasa bile oda açıp davet edebilir
    if (customId === 'btn_voice_create') {
      try {
        const category = guild.channels.cache.find(
          (c: any) => c.type === ChannelType.GuildCategory && c.name.includes('SES ODALARI')
        );

        const newChannel = await guild.channels.create({
          name: `🔊・${member.displayName} Odası`,
          type: ChannelType.GuildVoice,
          parent: category?.id,
          permissionOverwrites: [
            {
              id: member.id,
              allow: [
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.MoveMembers,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.Speak,
              ],
            },
          ],
        });

        VoiceLobbyManager.registerTempChannel(newChannel.id);

        // Eğer kullanıcı bir sesteyse otomatik taşı
        if (member.voice.channel) {
          await member.voice.setChannel(newChannel);
        }

        await interaction.reply({
          content: `🎉 **Özel ses odanız başarıyla açıldı:** <#${newChannel.id}>\nOdanıza katılarak arkadaşlarınızı davet edebilir ve paneli kullanabilirsiniz!`,
          flags: MessageFlags.Ephemeral,
        });
      } catch (err: any) {
        await interaction.reply({
          content: `❌ Oda oluşturulamadı: ${err.message}`,
          flags: MessageFlags.Ephemeral,
        });
      }
      return;
    }

    // 2. Diğer butonlar için kullanıcının ses kanalında olması gerekir
    const currentVoice = member.voice.channel as VoiceChannel | null;
    if (!currentVoice) {
      await interaction.reply({
        content: '⚠️ **Bu işlemi yapabilmek için sunucumuzdaki bir ses kanalında bulunmalısınız!**',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const everyoneRole = guild.roles.everyone;

    switch (customId) {
      // ✏️ İsim Değiştir (Modal Penceresi)
      case 'btn_voice_rename': {
        const modal = new ModalBuilder()
          .setCustomId('modal_voice_rename')
          .setTitle('Ses Kanalı İsmini Değiştir');

        const nameInput = new TextInputBuilder()
          .setCustomId('input_voice_name')
          .setLabel('Yeni Oda İsmi')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Örn: 🎮・Valorant Dereceli veya 🎧・Chill Lo-Fi')
          .setValue(currentVoice.name)
          .setMinLength(2)
          .setMaxLength(40)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput));
        await interaction.showModal(modal);
        break;
      }

      // 🔒 Odayı Kilitle
      case 'btn_voice_lock': {
        await currentVoice.permissionOverwrites.edit(everyoneRole, {
          Connect: false,
        });
        await currentVoice.permissionOverwrites.edit(member.id, {
          Connect: true,
          Speak: true,
        });
        await interaction.reply({
          content: `🔒 **${currentVoice.name}** odası kilitlendi! Artık dışarıdan yabancı üyeler katılamaz.`,
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      // 🔓 Kilidi Aç
      case 'btn_voice_unlock': {
        await currentVoice.permissionOverwrites.edit(everyoneRole, {
          Connect: null,
        });
        await interaction.reply({
          content: `🔓 **${currentVoice.name}** odasının kilidi açıldı! Tüm üyeler serbestçe katılabilir.`,
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      // 👁️ Odayı Gizle / Göster
      case 'btn_voice_hide': {
        const currentOverwrites = currentVoice.permissionsFor(everyoneRole);
        const isVisible = currentOverwrites?.has(PermissionFlagsBits.ViewChannel) ?? true;

        if (isVisible) {
          await currentVoice.permissionOverwrites.edit(everyoneRole, {
            ViewChannel: false,
          });
          await currentVoice.permissionOverwrites.edit(member.id, {
            ViewChannel: true,
          });
          await interaction.reply({
            content: `👁️ **${currentVoice.name}** odası gizlendi! Artık kanal listesinde görünmez (hayalet oda).`,
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await currentVoice.permissionOverwrites.edit(everyoneRole, {
            ViewChannel: null,
          });
          await interaction.reply({
            content: `👁️ **${currentVoice.name}** odası tekrar görünür hale getirildi!`,
            flags: MessageFlags.Ephemeral,
          });
        }
        break;
      }

      // 👥 Kişi Limiti
      case 'btn_voice_limit': {
        const currentLimit = currentVoice.userLimit || 0;
        let nextLimit = 0;
        if (currentLimit === 0) nextLimit = 2;
        else if (currentLimit === 2) nextLimit = 5;
        else if (currentLimit === 5) nextLimit = 10;
        else if (currentLimit === 10) nextLimit = 15;
        else nextLimit = 0;

        await currentVoice.setUserLimit(nextLimit);
        await interaction.reply({
          content: `👥 **${currentVoice.name}** odasının kişi kapasitesi **${
            nextLimit === 0 ? 'Sınırsız ♾️' : nextLimit + ' Kişi'
          }** olarak ayarlandı.`,
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      // 🔇 Odayı Sustur / Aç
      case 'btn_voice_mute': {
        const currentOverwrites = currentVoice.permissionsFor(everyoneRole);
        const canSpeak = currentOverwrites?.has(PermissionFlagsBits.Speak) ?? true;
        await currentVoice.permissionOverwrites.edit(everyoneRole, {
          Speak: !canSpeak,
        });
        await interaction.reply({
          content: `🔇 **${currentVoice.name}** odasında genel konuşma durumu: **${
            !canSpeak ? 'Konuşma Açık 🔊' : 'Oda Sessize Alındı 🔇'
          }**`,
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      // 🚀 Bitrate (Ses Kalitesi)
      case 'btn_voice_bitrate': {
        const currentBitrate = currentVoice.bitrate;
        // Non-boosted limit is 96kbps
        let nextBitrate = 64000;
        let bitrateLabel = '64 kbps (Standart Kalite)';

        if (currentBitrate <= 64000) {
          nextBitrate = 96000;
          bitrateLabel = '96 kbps (Stüdyo & Hi-Fi Kalite 🎧)';
        } else {
          nextBitrate = 64000;
          bitrateLabel = '64 kbps (Standart Kalite 🔊)';
        }

        try {
          await currentVoice.setBitrate(nextBitrate);
          await interaction.reply({
            content: `🚀 **${currentVoice.name}** ses odasının ses iletim kalitesi **${bitrateLabel}** olarak ayarlandı!`,
            flags: MessageFlags.Ephemeral,
          });
        } catch (err: any) {
          await interaction.reply({
            content: `⚠️ Bitrate ayarlanırken sunucu limiti uyarısı: ${err.message}`,
            flags: MessageFlags.Ephemeral,
          });
        }
        break;
      }

      // 👑 Sahipliği Al
      case 'btn_voice_claim': {
        await currentVoice.permissionOverwrites.edit(member.id, {
          ManageChannels: true,
          MoveMembers: true,
          Connect: true,
          Speak: true,
        });
        await interaction.reply({
          content: `👑 **${currentVoice.name}** odasının oda yöneticisi ve sahipliği başarıyla üzerinize tanımlandı!`,
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      // 📊 Oda Durumu
      case 'btn_voice_info': {
        const membersInVoice = currentVoice.members.map((m) => `• <@${m.id}>`).join('\n') || 'Oda boş';
        const isLocked = currentVoice.permissionsFor(everyoneRole)?.has(PermissionFlagsBits.Connect) === false;
        const isHidden = currentVoice.permissionsFor(everyoneRole)?.has(PermissionFlagsBits.ViewChannel) === false;

        const infoEmbed = new EmbedBuilder()
          .setTitle(`📊 Ses Odası Durum Raporu: ${currentVoice.name}`)
          .setColor('#9B59B6')
          .addFields(
            {
              name: '🔒 Kilit Durumu',
              value: isLocked ? '🔴 Kilitli (Giriş Kapalı)' : '🟢 Herkese Açık',
              inline: true,
            },
            {
              name: '👁️ Görünürlük',
              value: isHidden ? '👻 Gizli (Hayalet Oda)' : '👀 Görünür',
              inline: true,
            },
            {
              name: '👥 Kapasite',
              value: currentVoice.userLimit === 0 ? '♾️ Sınırsız' : `${currentVoice.members.size} / ${currentVoice.userLimit} Kişi`,
              inline: true,
            },
            {
              name: '🚀 Ses Kalitesi (Bitrate)',
              value: `${Math.round(currentVoice.bitrate / 1000)} kbps`,
              inline: true,
            },
            {
              name: '🎧 Odadaki Üyeler',
              value: membersInVoice,
              inline: false,
            }
          )
          .setFooter({ text: 'Nights Advanced Voice Studio' })
          .setTimestamp();

        await interaction.reply({ embeds: [infoEmbed], flags: MessageFlags.Ephemeral });
        break;
      }

      default:
        await interaction.reply({ content: 'Bilinmeyen ses işlemi.', flags: MessageFlags.Ephemeral });
        break;
    }
  }

  public static async handleVoiceModal(interaction: ModalSubmitInteraction): Promise<void> {
    const member = interaction.member as GuildMember;
    const currentVoice = member?.voice?.channel as VoiceChannel | null;

    if (!currentVoice) {
      await interaction.reply({
        content: '⚠️ Ses kanalında değilsiniz! İsim değiştirebilmek için bir ses odasında bulunmalısınız.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const newName = interaction.fields.getTextInputValue('input_voice_name').trim();
    try {
      await currentVoice.setName(newName);
      await interaction.reply({
        content: `✅ Odanızın adı başarıyla değiştirildi: **${newName}**`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (err: any) {
      await interaction.reply({
        content: `❌ İsim değiştirilemedi: ${err.message}`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
