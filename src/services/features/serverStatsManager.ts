import { Guild, ChannelType, PermissionFlagsBits } from 'discord.js';

export class ServerStatsManager {
  private static updatingGuilds = new Set<string>();
  private static lastUpdate = new Map<string, number>();

  /**
   * Sunucu istatistik kanallarını günceller veya yoksa otomatik oluşturur.
   * Discord kanal adı güncelleme sınırlamalarına (10 dakikada 2 kez) karşı otomatik korumalıdır.
   */
  public static async updateStats(guild: Guild, force = false): Promise<void> {
    if (!guild) return;

    if (this.updatingGuilds.has(guild.id)) {
      return;
    }

    const now = Date.now();
    const last = this.lastUpdate.get(guild.id) || 0;
    // 5 dakikada en fazla 1 kez güncelle (Discord 10 dk / 2 rename kuralı)
    if (!force && now - last < 300000) {
      return;
    }

    this.updatingGuilds.add(guild.id);

    try {
      await guild.members.fetch().catch(() => {});
      const members = guild.members.cache;
      const totalMembers = guild.memberCount || members.size;
      const onlineMembers = members.filter(
        (m) => m.presence?.status === 'online' || m.presence?.status === 'dnd' || m.presence?.status === 'idle'
      ).size;
      const voiceMembers = members.filter((m) => !!m.voice?.channelId).size;

      await guild.channels.fetch().catch(() => {});
      let category = guild.channels.cache.find(
        (c) => c && c.type === ChannelType.GuildCategory && c.name.includes('SUNUCU İSTATİSTİKLERİ')
      );

      const everyoneRole = guild.roles.everyone;

      if (!category) {
        category = await guild.channels.create({
          name: '📊 ┃ SUNUCU İSTATİSTİKLERİ',
          type: ChannelType.GuildCategory,
          position: 0,
          permissionOverwrites: [
            {
              id: everyoneRole.id,
              allow: [PermissionFlagsBits.ViewChannel],
              deny: [PermissionFlagsBits.Connect],
            },
          ],
        });
      }

      // 1. Toplam Üye Kanalı
      let chTotal = guild.channels.cache.find(
        (c) => c && c.parentId === category?.id && c.name.includes('Toplam Üye')
      );
      const totalName = `👥・Toplam Üye: ${totalMembers}`;
      if (!chTotal) {
        await guild.channels.create({
          name: totalName,
          type: ChannelType.GuildVoice,
          parent: category.id,
          permissionOverwrites: [
            { id: everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.Connect] },
          ],
        });
      } else if (chTotal.name !== totalName) {
        await chTotal.setName(totalName).catch(() => {});
      }

      // 2. Çevrimiçi / Aktif Kanalı
      let chOnline = guild.channels.cache.find(
        (c) => c && c.parentId === category?.id && (c.name.includes('Çevrimiçi') || c.name.includes('Aktif'))
      );
      const onlineDisplay = onlineMembers > 0 ? onlineMembers : totalMembers;
      const onlineName = `🟢・Aktif Üye: ${onlineDisplay}`;
      if (!chOnline) {
        await guild.channels.create({
          name: onlineName,
          type: ChannelType.GuildVoice,
          parent: category.id,
          permissionOverwrites: [
            { id: everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.Connect] },
          ],
        });
      } else if (chOnline.name !== onlineName) {
        await chOnline.setName(onlineName).catch(() => {});
      }

      // 3. Sesteki Üyeler Kanalı
      let chVoice = guild.channels.cache.find(
        (c) => c && c.parentId === category?.id && c.name.includes('Sesteki')
      );
      const voiceName = `🎙️・Sesteki Üyeler: ${voiceMembers}`;
      if (!chVoice) {
        await guild.channels.create({
          name: voiceName,
          type: ChannelType.GuildVoice,
          parent: category.id,
          permissionOverwrites: [
            { id: everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.Connect] },
          ],
        });
      } else if (chVoice.name !== voiceName) {
        await chVoice.setName(voiceName).catch(() => {});
      }

      // 4. Güvenlik Durumu Kanalı
      let chSecurity = guild.channels.cache.find(
        (c) => c && c.parentId === category?.id && c.name.includes('Güvenlik')
      );
      const secName = '🛡️・Güvenlik: %100 Aktif';
      if (!chSecurity) {
        await guild.channels.create({
          name: secName,
          type: ChannelType.GuildVoice,
          parent: category.id,
          permissionOverwrites: [
            { id: everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.Connect] },
          ],
        });
      }

      this.lastUpdate.set(guild.id, Date.now());
      console.log(`[ServerStatsManager] 📊 ${guild.name} istatistikleri güncellendi (Toplam: ${totalMembers}, Sesteki: ${voiceMembers})`);
    } catch (err: any) {
      console.warn('[ServerStatsManager] İstatistik kanalları güncellenirken hata:', err.message);
    } finally {
      this.updatingGuilds.delete(guild.id);
    }
  }
}

