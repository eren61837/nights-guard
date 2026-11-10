import { Message, EmbedBuilder, GuildMember, Guild, Client, VoiceBasedChannel, TextChannel } from 'discord.js';
import { PersistentStore } from '../storage/persistentStore';

export interface UserLevelData {
  xp: number;
  level: number;
  lastMessageTime: number;
  voiceMinutes?: number;
}

export interface LevelRewardConfig {
  level: number;
  name: string;
  roleId: string;
  color: `#${string}`;
}

export const LEVEL_REWARD_ROLES: LevelRewardConfig[] = [
  { level: 5, name: '🥉・Level 5 | Çaylak', roleId: '1568680202807156888', color: '#CD7F32' },
  { level: 10, name: '🥈・Level 10 | Aktif Üye', roleId: '1568680215872278680', color: '#C0C0C0' },
  { level: 20, name: '🥇・Level 20 | Kıdemli', roleId: '1568680219450155129', color: '#F1C40F' },
  { level: 30, name: '💎・Level 30 | Elmas', roleId: '1568680222495084746', color: '#00E5FF' },
  { level: 50, name: '👑・Level 50 | Efsane', roleId: '1568680226324484167', color: '#E056FD' },
];

export class LevelManager {
  private static userLevels = new Map<string, UserLevelData>();
  private static loaded = false;

  public static load(): void {
    if (this.loaded) return;
    const raw = PersistentStore.safeReadJson<Record<string, UserLevelData>>(
      'levels.json',
      ['assets/levelData.json'],
      {}
    );
    for (const [k, v] of Object.entries(raw)) {
      this.userLevels.set(k, v);
    }
    this.loaded = true;

    PersistentStore.registerFlushHandler('LevelManager', () => {
      this.save();
    });
  }

  public static save(): void {
    if (!this.loaded) return;
    const obj: Record<string, UserLevelData> = {};
    for (const [k, v] of this.userLevels.entries()) {
      obj[k] = v;
    }
    PersistentStore.atomicSaveJson('levels.json', obj);
  }

  public static getRequiredXp(level: number): number {
    return (level + 1) * 120 + 50;
  }

  private static voiceTimer: NodeJS.Timeout | null = null;

  /**
   * Ses kanallarındaki üyelerin süresini takip eder (Sadece istatistik ve süre için; XP/seviye verilmez).
   */
  public static startVoiceTracker(client: Client): void {
    if (this.voiceTimer) return;

    console.log('[LevelManager] 🎙️ Sesli kanal süre takip motoru başlatıldı (Ses XP/Level atlama kapalı).');

    this.voiceTimer = setInterval(async () => {
      try {
        this.load();
        for (const guild of client.guilds.cache.values()) {
          const channels = guild.channels.cache.filter((c) => c.isVoiceBased());

          for (const [, voiceChannel] of channels) {
            const ch = voiceChannel as VoiceBasedChannel;
            // AFK kanalındaysa süre sayılmaz
            if (guild.afkChannelId === ch.id) continue;

            const nonBotMembers = ch.members.filter((m) => !m.user.bot);
            if (nonBotMembers.size === 0) continue;

            for (const [, member] of nonBotMembers) {
              // Kulaklığı kapalı (sağırlaştırılmış) olanlara AFK engeli uygulanır
              if (member.voice.selfDeaf || member.voice.serverDeaf) continue;

              const userId = member.id;
              const current = this.userLevels.get(userId) || {
                xp: 0,
                level: 0,
                lastMessageTime: 0,
                voiceMinutes: 0,
              };

              current.voiceMinutes = (current.voiceMinutes || 0) + 1;
              this.userLevels.set(userId, current);
            }
          }
        }
        this.save();
      } catch (err: any) {
        console.warn('[VoiceTracker] Hata:', err.message);
      }
    }, 60000);
  }

  /**
   * Kullanıcının seviyesine göre hak ettiği rolleri kontrol edip atar
   */
  public static async checkAndAssignRoles(
    member: GuildMember,
    level: number
  ): Promise<LevelRewardConfig[]> {
    const newlyAwarded: LevelRewardConfig[] = [];
    for (const reward of LEVEL_REWARD_ROLES) {
      if (level >= reward.level) {
        if (!member.roles.cache.has(reward.roleId)) {
          try {
            await member.roles.add(reward.roleId);
            newlyAwarded.push(reward);
            console.log(`[LevelManager] 🎖️ ${member.user.tag} kullanıcısına ${reward.name} rolü verildi.`);
          } catch (err: any) {
            console.warn(`[LevelManager] Rol eklenemedi (${reward.name}):`, err.message);
          }
        }
      }
    }
    return newlyAwarded;
  }

  /**
   * Belirli bir üyenin tüm seviye rollerini eşitler
   */
  public static async syncMemberRoles(member: GuildMember): Promise<LevelRewardConfig[]> {
    this.load();
    const data = this.getUserData(member.id);
    return await this.checkAndAssignRoles(member, data.level);
  }

  /**
   * Sunucudaki tüm kayıtlı üyelerin rollerini topluca eşitler
   */
  public static async syncAllMembers(guild: Guild): Promise<number> {
    this.load();
    let updatedCount = 0;
    for (const [userId, data] of this.userLevels.entries()) {
      if (data.level >= 5) {
        try {
          const member = await guild.members.fetch(userId).catch(() => null);
          if (member) {
            const added = await this.checkAndAssignRoles(member, data.level);
            if (added.length > 0) updatedCount++;
          }
        } catch (ignore) {}
      }
    }
    return updatedCount;
  }

  public static async handleMessage(message: Message): Promise<void> {
    if (message.author.bot || !message.guild) return;

    this.load();
    const userId = message.author.id;
    const now = Date.now();

    const current = this.userLevels.get(userId) || { xp: 0, level: 0, lastMessageTime: 0 };

    // 60 saniyelik XP bekleme süresi (Spam engeli)
    if (now - current.lastMessageTime < 60000) {
      return;
    }

    // 15 - 25 arası rastgele XP kazanımı (Booster üyelere 1.5x XP Bonusu!)
    let earnedXp = Math.floor(Math.random() * 11) + 15;
    if (message.member?.premiumSince) {
      earnedXp = Math.round(earnedXp * 1.5);
    }
    current.xp += earnedXp;
    current.lastMessageTime = now;

    let leveledUp = false;
    while (current.xp >= this.getRequiredXp(current.level)) {
      current.xp -= this.getRequiredXp(current.level);
      current.level += 1;
      leveledUp = true;
    }

    if (leveledUp) {
      // Rolleri kontrol et ve ver
      let newlyAwarded: LevelRewardConfig[] = [];
      if (message.member) {
        newlyAwarded = await this.checkAndAssignRoles(message.member, current.level);
      }

      const topAward = newlyAwarded.length > 0 ? newlyAwarded[newlyAwarded.length - 1] : null;

      // Seviye atlama kutlama embedi
      const levelEmbed = new EmbedBuilder()
        .setTitle('🎉 TEBRİKLER! SEVİYE ATLADIN! 🆙')
        .setDescription(
          `Harikasın <@${userId}>! Sunucudaki aktifliğin ödüllendirildi.\n\n` +
          `👑 **Yeni Seviyen:** **Level ${current.level}**\n` +
          `⚡ **Sonraki Seviye İçin Gereken XP:** \`0 / ${this.getRequiredXp(current.level)} XP\`\n\n` +
          (newlyAwarded.length > 0
            ? `🎁 **KAZANILAN YENİ SEVİYE ROLÜ:**\n` +
              newlyAwarded.map((r) => `> ✨ <@&${r.roleId}> (\`${r.name}\`)`).join('\n') +
              `\n*Rolün ve özel sohbet rengin adına tanımlandı!*\n\n`
            : '') +
          `> *Sohbet etmeye devam ederek yeni seviyelere ve özel rollere ulaşabilirsin!*`
        )
        .setColor((topAward?.color as any) || '#F1C40F')
        .setThumbnail(message.author.displayAvatarURL())
        .setFooter({ text: 'Nights Level & XP Sistemi • Made by erencix' });

      try {
        if ('send' in message.channel) {
          const sentMsg = await (message.channel as any).send({ embeds: [levelEmbed] });
          setTimeout(() => sentMsg.delete().catch(() => {}), 10000);
        }
      } catch (e) {}
    }

    this.userLevels.set(userId, current);
    this.save();
  }

  public static addXp(
    userId: string,
    amount: number
  ): { level: number; xp: number; leveledUp: boolean } {
    this.load();
    const current = this.userLevels.get(userId) || { xp: 0, level: 0, lastMessageTime: 0 };
    current.xp += amount;
    let leveledUp = false;
    while (current.xp >= this.getRequiredXp(current.level)) {
      current.xp -= this.getRequiredXp(current.level);
      current.level += 1;
      leveledUp = true;
    }
    this.userLevels.set(userId, current);
    this.save();
    return { level: current.level, xp: current.xp, leveledUp };
  }

  public static setLevel(userId: string, level: number, xp = 0): UserLevelData {
    this.load();
    const data: UserLevelData = {
      level: Math.max(0, level),
      xp: Math.max(0, xp),
      lastMessageTime: Date.now(),
    };
    this.userLevels.set(userId, data);
    this.save();
    return data;
  }

  public static getUserData(userId: string): UserLevelData {
    this.load();
    return this.userLevels.get(userId) || { xp: 0, level: 0, lastMessageTime: 0 };
  }

  public static getLeaderboard(): { userId: string; level: number; xp: number }[] {
    this.load();
    const list: { userId: string; level: number; xp: number }[] = [];
    for (const [userId, data] of this.userLevels.entries()) {
      list.push({ userId, level: data.level, xp: data.xp });
    }
    list.sort((a, b) => (b.level !== a.level ? b.level - a.level : b.xp - a.xp));
    return list.slice(0, 10);
  }

  public static getRankEmbed(user: any): EmbedBuilder {
    this.load();
    const data = this.getUserData(user.id);
    const needed = this.getRequiredXp(data.level);
    const percent = Math.min(100, Math.round((data.xp / needed) * 100));

    const totalBars = 10;
    const filled = Math.round((percent / 100) * totalBars);
    const bar = '█'.repeat(filled) + '░'.repeat(totalBars - filled);

    // Mevcut hak edilen en yüksek rol
    const earnedRoles = LEVEL_REWARD_ROLES.filter((r) => data.level >= r.level);
    const currentRole = earnedRoles.length > 0 ? earnedRoles[earnedRoles.length - 1] : null;
    const currentBadge = currentRole
      ? `<@&${currentRole.roleId}>`
      : '`Başlangıç Seviyesi` (Hedef: Level 5)';

    // Bir sonraki hedef rol
    const nextRole = LEVEL_REWARD_ROLES.find((r) => data.level < r.level);
    const nextBadge = nextRole
      ? `<@&${nextRole.roleId}> (Level ${nextRole.level})`
      : '👑 `Maksimum Rol Açıldı!`';

    return new EmbedBuilder()
      .setTitle(`📊 ${user.displayName || user.username} • Seviye Kartı`)
      .setThumbnail(user.displayAvatarURL ? user.displayAvatarURL() : null)
      .setColor((currentRole?.color as any) || '#8B5CF6')
      .addFields(
        { name: '🎖️ Seviye', value: `\`Level ${data.level}\``, inline: true },
        { name: '⚡ Deneyim (XP)', value: `\`${data.xp} / ${needed} XP\``, inline: true },
        {
          name: '🎙️ Ses Süresi',
          value: `\`${Math.floor((data.voiceMinutes || 0) / 60)} sa ${(data.voiceMinutes || 0) % 60} dk\``,
          inline: true,
        },
        { name: '📈 İlerleme', value: `\`${bar} %${percent}\``, inline: false },
        { name: '🏅 Mevcut Rol', value: currentBadge, inline: true },
        { name: '🎯 Sıradaki Rol', value: nextBadge, inline: true }
      )
      .setFooter({ text: 'Nights Level Sistemi • Made by erencix' });
  }

  public static getLevelInfoEmbed(): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle('⭐ NIGHTS SEVİYE & ROL BİLGİLENDİRME SİSTEMİ 🏆')
      .setDescription(
        '**Nights** sunucumuzda metin kanallarında aktif oldukça otomatik olarak **XP** kazanır, seviyenizi yükseltir ve özel rol ödüllerinin kilidini açarsınız!\n\n' +
        '### 🎖️ Seviye Rolleri ve Ayrıcalıkları:\n' +
        '• 🥉 **Level 5:** <@&1568680202807156888>\n' +
        '  └ *Bronz isim rengi, görsel & bağlantı paylaşma ve harici emoji ayrıcalığı.*\n\n' +
        '• 🥈 **Level 10:** <@&1568680215872278680>\n' +
        '  └ *Gümüş isim rengi, aktif sohbetçi statüsü ve özel sunucu çekilişlerine katılım önceliği.*\n\n' +
        '• 🥇 **Level 20:** <@&1568680219450155129>\n' +
        '  └ *Altın sarısı parıldayan isim rengi, özel ses kanalı limit/bitrate kontrol avantajları.*\n\n' +
        '• 💎 **Level 30:** <@&1568680222495084746>\n' +
        '  └ *Elmas mavi isim rengi, VIP oda erişimleri ve özel ses etkinlik yetkisi.*\n\n' +
        '• 👑 **Level 50:** <@&1568680226324484167>\n' +
        '  └ *Efsane mor isim rengi, sunucunun en seçkin üyeleri arasına girme ve taht statüsü!*\n\n' +
        '### ⚡ Komutlar:\n' +
        '• `/rank` veya `!rank` — Kendi seviye kartınızı, mevcut XP ve ilerlemenizi görüntüler.\n' +
        '• `/top` veya `!top` — Sunucunun en aktif üyelerini listeleyen canlı Liderlik Tablosu.\n\n' +
        '> 💡 **Nasıl XP Kazanılır?**\n' +
        '> • 💬 **Yazılı Sohbet:** Metin kanallarında her 60 saniyede bir attığınız mesajlar size **15-25 XP** kazandırır.\n' +
        '> • 🎙️ **Sesli Kanallar:** Ses odalarında geçirdiğiniz toplam süre istatistik olarak profilinize işlenir.\n' +
        '> • *Spam, flood veya hileli mesajlar engellenir ve XP kazandırmaz.*'
      )
      .setColor('#6C5CE7')
      .setImage('https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif')
      .setFooter({ text: 'Nights Community Rewards • Made by erencix' });
  }
}
