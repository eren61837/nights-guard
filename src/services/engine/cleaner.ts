import { Guild, PermissionFlagsBits, ChannelType } from 'discord.js';
import { RateLimitQueue, QueueTask } from './rateLimitQueue';

export interface CleanStats {
  channelsDeleted: number;
  rolesDeleted: number;
  errors: string[];
}

export interface PurgeOptions {
  preserveChannelId?: string;
}

export class ServerCleaner {
  private queue: RateLimitQueue;

  constructor() {
    this.queue = new RateLimitQueue(400);
  }

  public async purgeServer(
    guild: Guild,
    options?: PurgeOptions | ((msg: string) => Promise<void> | void),
    onProgress?: (msg: string) => Promise<void> | void
  ): Promise<CleanStats> {
    const purgeOpts: PurgeOptions = typeof options === 'object' && options !== null ? options : {};
    const progressCallback = typeof options === 'function' ? options : onProgress;

    const stats: CleanStats = {
      channelsDeleted: 0,
      rolesDeleted: 0,
      errors: [],
    };

    const me = guild.members.me;
    if (!me?.permissions.has(PermissionFlagsBits.ManageChannels)) {
      throw new Error("Bot 'Kanalları Yönet' (ManageChannels) yetkisine sahip değil!");
    }

    // 1. Delete Channels & Categories
    const channels = await guild.channels.fetch();
    const channelTasks: QueueTask<void>[] = [];

    // Separate into non-categories first, then categories last so channels are gone before categories
    const nonCategories = channels.filter(
      (c) => c && !c.isDMBased() && c.type !== ChannelType.GuildCategory && c.id !== purgeOpts.preserveChannelId
    );
    const categories = channels.filter((c) => c && !c.isDMBased() && c.type === ChannelType.GuildCategory);

    for (const [id, ch] of nonCategories) {
      if (!ch) continue;
      channelTasks.push({
        id: `del_ch_${id}`,
        description: `Kanal siliniyor: #${ch.name}`,
        execute: async () => {
          try {
            await ch.delete('AI Architect: Temizleme işlemi');
            stats.channelsDeleted++;
          } catch (err: any) {
            stats.errors.push(`Kanal #${ch.name} silinemedi: ${err.message}`);
          }
        },
      });
    }

    for (const [id, cat] of categories) {
      if (!cat) continue;
      channelTasks.push({
        id: `del_cat_${id}`,
        description: `Kategori siliniyor: 📁 ${cat.name}`,
        execute: async () => {
          try {
            await cat.delete('AI Architect: Temizleme işlemi');
            stats.channelsDeleted++;
          } catch (err: any) {
            stats.errors.push(`Kategori ${cat.name} silinemedi: ${err.message}`);
          }
        },
      });
    }

    if (channelTasks.length > 0) {
      await this.queue.processAll(channelTasks, async (p) => {
        if (progressCallback) {
          await progressCallback(`🧹 Kanallar temizleniyor... [${p.current}/${p.total}] (${p.percent}%)`);
        }
      });
    }

    // 2. Delete Roles (if bot has ManageRoles)
    if (me.permissions.has(PermissionFlagsBits.ManageRoles)) {
      const roles = await guild.roles.fetch();
      const botHighestRolePos = me.roles.highest.position;
      const roleTasks: QueueTask<void>[] = [];

      for (const [id, role] of roles) {
        // Can't delete @everyone
        if (role.id === guild.id) continue;
        // Can't delete managed roles (bot roles, boosters, integrations)
        if (role.managed) continue;
        // Can't delete roles higher or equal to bot's role
        if (role.position >= botHighestRolePos) continue;

        roleTasks.push({
          id: `del_role_${id}`,
          description: `Rol siliniyor: @${role.name}`,
          execute: async () => {
            try {
              await role.delete('AI Architect: Temizleme işlemi');
              stats.rolesDeleted++;
            } catch (err: any) {
              stats.errors.push(`Rol @${role.name} silinemedi: ${err.message}`);
            }
          },
        });
      }

      if (roleTasks.length > 0) {
        await this.queue.processAll(roleTasks, async (p) => {
          if (progressCallback) {
            await progressCallback(`🧹 Roller temizleniyor... [${p.current}/${p.total}] (${p.percent}%)`);
          }
        });
      }
    }

    return stats;
  }
}
