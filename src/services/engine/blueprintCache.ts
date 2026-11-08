import { ServerBlueprint } from '../../types/blueprint';

export interface PendingBuild {
  id: string;
  userId: string;
  guildId: string;
  blueprint: ServerBlueprint;
  cleanSlate: boolean;
  applyLogo: boolean;
  createdAt: number;
  logoBuffer?: Buffer;
  logoDataUri?: string;
  isDemo?: boolean;
}

export class BlueprintCache {
  private static cache = new Map<string, PendingBuild>();

  public static set(pending: PendingBuild): void {
    this.cache.set(pending.id, pending);

    // Auto-expire after 15 minutes
    const timer = setTimeout(() => {
      this.cache.delete(pending.id);
    }, 15 * 60 * 1000);
    if (timer && typeof timer.unref === 'function') {
      timer.unref();
    }
  }

  public static get(id: string): PendingBuild | undefined {
    return this.cache.get(id);
  }

  public static getAll(): PendingBuild[] {
    return Array.from(this.cache.values());
  }

  public static getLatestByGuild(guildId: string): PendingBuild | undefined {
    let latest: PendingBuild | undefined;
    for (const item of this.cache.values()) {
      if (item.guildId === guildId) {
        if (!latest || item.createdAt > latest.createdAt) {
          latest = item;
        }
      }
    }
    return latest;
  }

  public static delete(id: string): boolean {
    return this.cache.delete(id);
  }
}
