import { VoiceState, ChannelType, PermissionFlagsBits, VoiceChannel, Client } from 'discord.js';

export class VoiceLobbyManager {
  private static tempVoiceChannels = new Set<string>();

  public static registerTempChannel(channelId: string): void {
    this.tempVoiceChannels.add(channelId);
  }

  public static isTemporaryVoiceChannel(channel: VoiceChannel): boolean {
    if (!channel || channel.type !== ChannelType.GuildVoice) return false;

    // 1. Asla silinmemesi gereken kalıcı/korumalı kanallar
    const lowerName = channel.name.toLocaleLowerCase('tr-TR');
    const isProtected =
      lowerName.includes('oda oluştur') ||
      lowerName.includes('oda olustur') ||
      lowerName.includes('create voice') ||
      lowerName.includes('join to create') ||
      lowerName.includes('sohbet') ||
      lowerName.includes('sinema') ||
      lowerName.includes('dizi') ||
      lowerName.includes('anime') ||
      lowerName.includes('watch party') ||
      lowerName.includes('party') ||
      lowerName.includes('valorant') ||
      lowerName.includes('rekabetçi') ||
      lowerName.includes('rekabetci') ||
      lowerName.includes('duo') ||
      lowerName.includes('trio') ||
      lowerName.includes('minecraft') ||
      lowerName.includes('roblox') ||
      lowerName.includes('tft') ||
      lowerName.includes('chill') ||
      lowerName.includes('dinlenme') ||
      lowerName.includes('müzik') ||
      lowerName.includes('muzik') ||
      lowerName.includes('afk') ||
      lowerName.includes('toplantı') ||
      lowerName.includes('toplanti') ||
      lowerName.includes('yönetici') ||
      lowerName.includes('yonetici') ||
      lowerName.includes('yetkili') ||
      lowerName.includes('yönetim') ||
      lowerName.includes('yonetim') ||
      lowerName.includes('kurucu') ||
      lowerName.includes('kayıt') ||
      lowerName.includes('kayit');

    if (isProtected) return false;

    // 2. Hafızadaki geçici kanallar listesinde mi?
    if (this.tempVoiceChannels.has(channel.id)) return true;

    // 3. İsimde geçici oda belirteçleri var mı?
    if (
      lowerName.includes('odası') ||
      lowerName.includes('odasi') ||
      lowerName.includes('room') ||
      lowerName.includes('lobby') ||
      channel.name.startsWith('🔊・') ||
      channel.name.startsWith('🔊')
    ) {
      return true;
    }

    // 4. Kategori & Özel Yetki Kontrolü:
    // Eğer oda "SES ODALARI" kategorisindeyse ve bir üyeye özel ManageChannels izni atanmışsa geçicidir
    const parentName = channel.parent?.name?.toLocaleLowerCase('tr-TR') || '';
    if (
      parentName.includes('ses') ||
      parentName.includes('oda') ||
      parentName.includes('özel') ||
      parentName.includes('ozel')
    ) {
      const hasMemberOverwrite = channel.permissionOverwrites.cache.some(
        (ow) => ow.type === 1 && ow.allow.has(PermissionFlagsBits.ManageChannels)
      );
      if (hasMemberOverwrite) return true;
    }

    return false;
  }

  public static async handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): Promise<void> {
    const { member, guild } = newState;
    if (!guild) return;

    // 1. Kullanıcı "➕・Oda Oluştur" tetikleyici kanalına girdi mi?
    const joinedChannel = newState.channel;
    if (joinedChannel && member) {
      const jName = joinedChannel.name.toLocaleLowerCase('tr-TR');
      if (jName.includes('oda oluştur') || jName.includes('oda olustur') || jName.includes('create voice')) {
        try {
          const category = joinedChannel.parent;

          // Yeni geçici ses odası oluştur
          const roomName = `🔊・${member.displayName} Odası`;
          const tempVoice = await guild.channels.create({
            name: roomName,
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

          this.tempVoiceChannels.add(tempVoice.id);

          // Kullanıcıyı anında yeni odaya taşı
          await member.voice.setChannel(tempVoice).catch(() => {});
        } catch (err) {
          console.error('[VoiceLobbyManager] Geçici oda oluşturulurken hata:', err);
        }
      }
    }

    // 2. Kullanıcı bir ses kanalından ayrıldı mı?
    const leftChannel = oldState.channel;
    if (leftChannel) {
      // 1 saniye sonra kontrol et (Discord cache senkronizasyon gecikmesini önler)
      setTimeout(async () => {
        try {
          const freshChannel = (await guild.channels.fetch(leftChannel.id).catch(() => null)) as VoiceChannel | null;
          if (!freshChannel) {
            this.tempVoiceChannels.delete(leftChannel.id);
            return;
          }

          // Odada kimse kalmadıysa ve geçici bir odaya aitse SİL!
          if (freshChannel.members.size === 0 && this.isTemporaryVoiceChannel(freshChannel)) {
            this.tempVoiceChannels.delete(freshChannel.id);
            await freshChannel.delete('Geçici ses odasında kimse kalmadığı için otomatik silindi.').catch(() => {});
            console.log(`[VoiceLobbyManager] 🗑️ Boşalan geçici oda silindi: ${freshChannel.name} (${freshChannel.id})`);
          }
        } catch (err) {
          console.error('[VoiceLobbyManager] Boş oda silinirken hata:', err);
        }
      }, 1200);
    }
  }

  // Periyodik Temizleyici: Bot yeniden başladığında veya arada kalan boş odaları süpürür
  public static async sweepEmptyChannels(client: Client): Promise<void> {
    try {
      for (const [_, guild] of client.guilds.cache) {
        for (const [id, channel] of guild.channels.cache) {
          if (channel.type === ChannelType.GuildVoice && channel.members.size === 0) {
            const vChannel = channel as VoiceChannel;
            if (this.isTemporaryVoiceChannel(vChannel)) {
              this.tempVoiceChannels.delete(id);
              await vChannel.delete('Boşta kalan sahipsiz geçici oda otomatik temizlendi.').catch(() => {});
              console.log(`[VoiceLobbyManager] 🧹 Boşta kalan oda süpürüldü: ${vChannel.name} (${id})`);
            }
          }
        }
      }
    } catch (e) {}
  }
}
