import { VoiceState, ChannelType, PermissionFlagsBits, VoiceChannel, Client } from 'discord.js';
import { PersistentStore } from '../storage/persistentStore';

export class VoiceLobbyManager {
  private static tempVoiceChannels = new Set<string>();
  private static loaded = false;

  private static load(): void {
    if (this.loaded) return;
    const list = PersistentStore.safeReadJson<string[]>('tempVoiceChannels.json', [], []);
    this.tempVoiceChannels = new Set<string>(list);
    this.loaded = true;

    PersistentStore.registerFlushHandler('VoiceLobbyManager', () => {
      this.save();
    });
  }

  private static save(): void {
    if (!this.loaded) return;
    PersistentStore.atomicSaveJson('tempVoiceChannels.json', Array.from(this.tempVoiceChannels));
  }

  public static registerTempChannel(channelId: string): void {
    this.load();
    this.tempVoiceChannels.add(channelId);
    this.save();
  }

  public static unregisterTempChannel(channelId: string): void {
    this.load();
    this.tempVoiceChannels.delete(channelId);
    this.save();
  }

  public static isTemporaryVoiceChannel(channel: VoiceChannel): boolean {
    if (!channel || channel.type !== ChannelType.GuildVoice) return false;
    this.load();

    // 1. Asla silinmemesi gereken kalıcı/korumalı sunucu kanalları
    const lowerName = channel.name.toLocaleLowerCase('tr-TR');
    const isProtected =
      lowerName.includes('oyun') ||
      lowerName.includes('game') ||
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
      lowerName.includes('kayit') ||
      lowerName.includes('oda oluştur') ||
      lowerName.includes('oda olustur') ||
      lowerName.includes('create voice') ||
      lowerName.includes('join to create');

    if (isProtected) return false;

    // 2. Kalıcı listede kayıtlı geçici kanallar listesinde mi?
    if (this.tempVoiceChannels.has(channel.id)) return true;

    // 3. Bir üyeye özel ManageChannels izni atanmışsa (kullanıcı panelle adını değiştirse bile tespit edilir!)
    const hasMemberManage = channel.permissionOverwrites.cache.some(
      (ow) => ow.type === 1 && ow.allow.has(PermissionFlagsBits.ManageChannels)
    );
    if (hasMemberManage) {
      this.tempVoiceChannels.add(channel.id);
      this.save();
      return true;
    }

    // 4. Botun varsayılan açtığı '🔊' ön ekli kanallar
    if (channel.name.startsWith('🔊・') || channel.name.startsWith('🔊')) {
      return true;
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

          this.registerTempChannel(tempVoice.id);

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
      // 1.2 saniye sonra kontrol et (Discord cache senkronizasyon gecikmesini önler)
      setTimeout(async () => {
        try {
          const freshChannel = (await guild.channels.fetch(leftChannel.id).catch(() => null)) as VoiceChannel | null;
          if (!freshChannel) {
            this.unregisterTempChannel(leftChannel.id);
            return;
          }

          // Odada kimse kalmadıysa ve geçici bir odaya aitse SİL!
          if (freshChannel.members.size === 0 && this.isTemporaryVoiceChannel(freshChannel)) {
            this.unregisterTempChannel(freshChannel.id);
            await freshChannel.delete('Geçici ses odasında kimse kalmadığı için otomatik silindi.').catch(() => {});
            console.log(`[VoiceLobbyManager] 🗑️ Boşalan geçici oda silindi: ${freshChannel.name} (${freshChannel.id})`);
          }
        } catch (err) {
          console.error('[VoiceLobbyManager] Boş oda silinirken hata:', err);
        }
      }, 1200);
    }
  }

  // Periyodik Temizleyici: Sürekli çalışan arka plan süpürücüsü
  public static async sweepEmptyChannels(client: Client): Promise<void> {
    try {
      this.load();
      for (const [_, guild] of client.guilds.cache) {
        for (const [id, channel] of guild.channels.cache) {
          if (channel.type === ChannelType.GuildVoice && channel.members.size === 0) {
            const vChannel = channel as VoiceChannel;
            if (this.isTemporaryVoiceChannel(vChannel)) {
              this.unregisterTempChannel(id);
              await vChannel.delete('Boşta kalan sahipsiz geçici oda otomatik temizlendi.').catch(() => {});
              console.log(`[VoiceLobbyManager] 🧹 Boşta kalan sahipsiz geçici oda süpürüldü: ${vChannel.name} (${id})`);
            }
          }
        }
      }
    } catch (e) {}
  }
}
