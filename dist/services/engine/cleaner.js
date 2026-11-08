"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerCleaner = void 0;
const discord_js_1 = require("discord.js");
const rateLimitQueue_1 = require("./rateLimitQueue");
class ServerCleaner {
    queue;
    constructor() {
        this.queue = new rateLimitQueue_1.RateLimitQueue(400);
    }
    async purgeServer(guild, options, onProgress) {
        const purgeOpts = typeof options === 'object' && options !== null ? options : {};
        const progressCallback = typeof options === 'function' ? options : onProgress;
        const stats = {
            channelsDeleted: 0,
            rolesDeleted: 0,
            errors: [],
        };
        const me = guild.members.me;
        if (!me?.permissions.has(discord_js_1.PermissionFlagsBits.ManageChannels)) {
            throw new Error("Bot 'Kanalları Yönet' (ManageChannels) yetkisine sahip değil!");
        }
        // 1. Delete Channels & Categories
        const channels = await guild.channels.fetch();
        const channelTasks = [];
        // Separate into non-categories first, then categories last so channels are gone before categories
        const nonCategories = channels.filter((c) => c && !c.isDMBased() && c.type !== discord_js_1.ChannelType.GuildCategory && c.id !== purgeOpts.preserveChannelId);
        const categories = channels.filter((c) => c && !c.isDMBased() && c.type === discord_js_1.ChannelType.GuildCategory);
        for (const [id, ch] of nonCategories) {
            if (!ch)
                continue;
            channelTasks.push({
                id: `del_ch_${id}`,
                description: `Kanal siliniyor: #${ch.name}`,
                execute: async () => {
                    try {
                        await ch.delete('AI Architect: Temizleme işlemi');
                        stats.channelsDeleted++;
                    }
                    catch (err) {
                        stats.errors.push(`Kanal #${ch.name} silinemedi: ${err.message}`);
                    }
                },
            });
        }
        for (const [id, cat] of categories) {
            if (!cat)
                continue;
            channelTasks.push({
                id: `del_cat_${id}`,
                description: `Kategori siliniyor: 📁 ${cat.name}`,
                execute: async () => {
                    try {
                        await cat.delete('AI Architect: Temizleme işlemi');
                        stats.channelsDeleted++;
                    }
                    catch (err) {
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
        if (me.permissions.has(discord_js_1.PermissionFlagsBits.ManageRoles)) {
            const roles = await guild.roles.fetch();
            const botHighestRolePos = me.roles.highest.position;
            const roleTasks = [];
            for (const [id, role] of roles) {
                // Can't delete @everyone
                if (role.id === guild.id)
                    continue;
                // Can't delete managed roles (bot roles, boosters, integrations)
                if (role.managed)
                    continue;
                // Can't delete roles higher or equal to bot's role
                if (role.position >= botHighestRolePos)
                    continue;
                roleTasks.push({
                    id: `del_role_${id}`,
                    description: `Rol siliniyor: @${role.name}`,
                    execute: async () => {
                        try {
                            await role.delete('AI Architect: Temizleme işlemi');
                            stats.rolesDeleted++;
                        }
                        catch (err) {
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
exports.ServerCleaner = ServerCleaner;
