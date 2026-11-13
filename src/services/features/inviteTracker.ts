import { Client, Guild, GuildMember, Invite, User } from 'discord.js';
import { PersistentStore } from '../storage/persistentStore';

export interface InviterResult {
  inviter: User | null;
  code: string | null;
  uses: number;
  isVanity: boolean;
}

interface StoredInviteCache {
  invites: Record<string, Record<string, number>>;
  vanity: Record<string, number>;
}

export class InviteTracker {
  // guildId -> (code -> uses)
  private static invitesCache = new Map<string, Map<string, number>>();
  // guildId -> vanity uses
  private static vanityCache = new Map<string, number>();
  private static loaded = false;

  public static load(): void {
    if (this.loaded) return;
    this.loaded = true;

    try {
      const data = PersistentStore.safeReadJson<StoredInviteCache>(
        'invite_tracker_cache.json',
        [],
        { invites: {}, vanity: {} }
      );

      this.invitesCache.clear();
      for (const [guildId, codeMap] of Object.entries(data.invites || {})) {
        const m = new Map<string, number>();
        for (const [code, uses] of Object.entries(codeMap)) {
          m.set(code, uses);
        }
        this.invitesCache.set(guildId, m);
      }

      this.vanityCache.clear();
      for (const [guildId, uses] of Object.entries(data.vanity || {})) {
        this.vanityCache.set(guildId, uses);
      }

      PersistentStore.registerFlushHandler('InviteTracker', () => {
        this.save();
      });

      console.log(`[InviteTracker] 📂 Davet kodları önbelleği diskten yüklendi (${this.invitesCache.size} sunucu).`);
    } catch (e: any) {
      console.warn('[InviteTracker] Önbellek yüklenemedi:', e.message);
    }
  }

  public static save(): void {
    try {
      const invitesObj: Record<string, Record<string, number>> = {};
      for (const [guildId, map] of this.invitesCache.entries()) {
        const codeObj: Record<string, number> = {};
        for (const [code, uses] of map.entries()) {
          codeObj[code] = uses;
        }
        invitesObj[guildId] = codeObj;
      }

      const vanityObj: Record<string, number> = {};
      for (const [guildId, uses] of this.vanityCache.entries()) {
        vanityObj[guildId] = uses;
      }

      PersistentStore.atomicSaveJson('invite_tracker_cache.json', {
        invites: invitesObj,
        vanity: vanityObj,
      });
    } catch (e: any) {
      console.warn('[InviteTracker] Önbellek kaydedilemedi:', e.message);
    }
  }

  public static async init(client: Client): Promise<void> {
    this.load();
    for (const guild of client.guilds.cache.values()) {
      await this.cacheGuildInvites(guild);
    }
    this.save();
    console.log('[InviteTracker] Sunucu davetleri başarıyla önbelleklendi ve diske kaydedildi.');
  }

  public static async cacheGuildInvites(guild: Guild): Promise<void> {
    try {
      const currentInvites = await guild.invites.fetch().catch(() => null);
      if (currentInvites) {
        const guildMap = new Map<string, number>();
        currentInvites.forEach((inv) => {
          guildMap.set(inv.code, inv.uses || 0);
        });
        this.invitesCache.set(guild.id, guildMap);
      }

      if (guild.vanityURLCode) {
        const vanityData = await guild.fetchVanityData().catch(() => null);
        if (vanityData) {
          this.vanityCache.set(guild.id, vanityData.uses);
        }
      }
      this.save();
    } catch (err: any) {
      console.warn(`[InviteTracker] ${guild.name} davetleri önbelleğe alınamadı:`, err.message);
    }
  }

  public static onInviteCreate(invite: Invite): void {
    if (!invite.guild) return;
    const guildId = invite.guild.id;
    let guildMap = this.invitesCache.get(guildId);
    if (!guildMap) {
      guildMap = new Map<string, number>();
      this.invitesCache.set(guildId, guildMap);
    }
    guildMap.set(invite.code, invite.uses || 0);
    this.save();
  }

  public static onInviteDelete(invite: Invite): void {
    if (!invite.guild) return;
    const guildMap = this.invitesCache.get(invite.guild.id);
    if (guildMap) {
      guildMap.delete(invite.code);
      this.save();
    }
  }

  public static async findInviter(member: GuildMember): Promise<InviterResult> {
    this.load();
    const guild = member.guild;
    const cachedInvites = this.invitesCache.get(guild.id);

    try {
      const currentInvites = await guild.invites.fetch().catch(() => null);

      if (currentInvites && cachedInvites) {
        // Kullanım sayısı artan davet kodunu tespit et
        const usedInvite = currentInvites.find((inv) => {
          const oldUses = cachedInvites.get(inv.code) || 0;
          return (inv.uses || 0) > oldUses;
        });

        // Önbelleği güncelle
        const updatedMap = new Map<string, number>();
        currentInvites.forEach((inv) => {
          updatedMap.set(inv.code, inv.uses || 0);
        });
        this.invitesCache.set(guild.id, updatedMap);
        this.save();

        if (usedInvite && usedInvite.inviter) {
          return {
            inviter: usedInvite.inviter,
            code: usedInvite.code,
            uses: usedInvite.uses || 1,
            isVanity: false,
          };
        }
      } else if (currentInvites) {
        // Önbellek boşsa ilk kez doldur
        const updatedMap = new Map<string, number>();
        currentInvites.forEach((inv) => {
          updatedMap.set(inv.code, inv.uses || 0);
        });
        this.invitesCache.set(guild.id, updatedMap);
        this.save();
      }

      // Vanity URL kontrolü
      if (guild.vanityURLCode) {
        const currentVanity = await guild.fetchVanityData().catch(() => null);
        const oldVanityUses = this.vanityCache.get(guild.id) || 0;
        if (currentVanity) {
          this.vanityCache.set(guild.id, currentVanity.uses);
          this.save();
          if (currentVanity.uses > oldVanityUses) {
            return {
              inviter: null,
              code: guild.vanityURLCode,
              uses: currentVanity.uses,
              isVanity: true,
            };
          }
        }
      }
    } catch (err: any) {
      console.warn('[InviteTracker] Davetçi tespit hatası:', err.message);
    }

    return {
      inviter: null,
      code: null,
      uses: 0,
      isVanity: false,
    };
  }
}

