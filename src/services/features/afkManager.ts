import { Message, EmbedBuilder } from 'discord.js';
import { PersistentStore } from '../storage/persistentStore';

export interface AfkData {
  userId: string;
  reason: string;
  timestamp: number;
}

export class AfkManager {
  private static afkUsers = new Map<string, AfkData>();
  private static loaded = false;

  private static load(): void {
    if (this.loaded) return;
    const raw = PersistentStore.safeReadJson<Record<string, AfkData>>('afk.json', [], {});
    for (const [k, v] of Object.entries(raw)) {
      this.afkUsers.set(k, v);
    }
    this.loaded = true;

    PersistentStore.registerFlushHandler('AfkManager', () => {
      this.save();
    });
  }

  private static save(): void {
    if (!this.loaded) return;
    const obj: Record<string, AfkData> = {};
    for (const [k, v] of this.afkUsers.entries()) {
      obj[k] = v;
    }
    PersistentStore.atomicSaveJson('afk.json', obj);
  }

  public static setAfk(userId: string, reason: string): void {
    this.load();
    this.afkUsers.set(userId, {
      userId,
      reason: reason || 'Belirtilmedi',
      timestamp: Date.now(),
    });
    this.save();
  }

  public static isAfk(userId: string): boolean {
    this.load();
    return this.afkUsers.has(userId);
  }

  public static getAfk(userId: string): AfkData | undefined {
    this.load();
    return this.afkUsers.get(userId);
  }

  public static removeAfk(userId: string): AfkData | undefined {
    this.load();
    const data = this.afkUsers.get(userId);
    if (data) {
      this.afkUsers.delete(userId);
      this.save();
    }
    return data;
  }

  /**
   * Mesaj atıldığında AFK kontrolü yapar:
   * 1. Mesajı atan kişi AFK ise AFK modunu kapatır ve bilgilendirir.
   * 2. Mesajda etiketlenen kişiler AFK ise neden AFK olduklarını bildirir.
   */
  public static async handleMessage(message: Message): Promise<void> {
    if (message.author.bot || !message.guild) return;

    // 1. Yazar AFK miydi?
    if (this.isAfk(message.author.id)) {
      const data = this.removeAfk(message.author.id);
      if (data) {
        const passedSeconds = Math.floor((Date.now() - data.timestamp) / 1000);
        const minutes = Math.floor(passedSeconds / 60);
        const timeText = minutes > 0 ? `${minutes} dakika` : `${passedSeconds} saniye`;

        const welcomeBackEmbed = new EmbedBuilder()
          .setDescription(`👋 **Tekrar hoş geldin <@${message.author.id}>!** AFK modundan çıktın. (*Süre: ${timeText}*)`)
          .setColor('#2ECC71');

        message.reply({ embeds: [welcomeBackEmbed] }).catch(() => {});
      }
    }

    // 2. Etiketlenenler AFK mi?
    if (message.mentions.users.size > 0) {
      const mentionedAfkUsers: AfkData[] = [];
      for (const [userId] of message.mentions.users) {
        if (userId === message.author.id) continue;
        const afkData = this.getAfk(userId);
        if (afkData) {
          mentionedAfkUsers.push(afkData);
        }
      }

      if (mentionedAfkUsers.length > 0) {
        for (const data of mentionedAfkUsers) {
          const timestampSec = Math.floor(data.timestamp / 1000);
          const afkEmbed = new EmbedBuilder()
            .setTitle('💤 Kullanıcı Şu Anda AFK')
            .setDescription(
              `<@${data.userId}> şu anda AFK modunda!\n\n` +
              `> 📌 **Sebep:** ${data.reason}\n` +
              `> ⏰ **Ayrılış:** <t:${timestampSec}:R>`
            )
            .setColor('#F1C40F');

          await message.reply({ embeds: [afkEmbed] }).catch(() => {});
        }
      }
    }
  }
}
