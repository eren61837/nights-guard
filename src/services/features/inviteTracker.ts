import { Client, Guild, GuildMember, Invite, User } from 'discord.js';

export interface InviterResult {
  inviter: User | null;
  code: string | null;
  uses: number;
  isVanity: boolean;
}

export class InviteTracker {
  // guildId -> (code -> uses)
  private static invitesCache = new Map<string, Map<string, number>>();
  // guildId -> vanity uses
  private static vanityCache = new Map<string, number>();

  public static async init(client: Client): Promise<void> {
    for (const guild of client.guilds.cache.values()) {
      await this.cacheGuildInvites(guild);
    }
    console.log('[InviteTracker] Sunucu davetleri başarıyla önbelleklendi.');
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
  }

  public static onInviteDelete(invite: Invite): void {
    if (!invite.guild) return;
    const guildMap = this.invitesCache.get(invite.guild.id);
    if (guildMap) {
      guildMap.delete(invite.code);
    }
  }

  public static async findInviter(member: GuildMember): Promise<InviterResult> {
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
      }

      // Vanity URL kontrolü
      if (guild.vanityURLCode) {
        const currentVanity = await guild.fetchVanityData().catch(() => null);
        const oldVanityUses = this.vanityCache.get(guild.id) || 0;
        if (currentVanity) {
          this.vanityCache.set(guild.id, currentVanity.uses);
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
