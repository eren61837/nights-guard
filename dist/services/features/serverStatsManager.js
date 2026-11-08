"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerStatsManager = void 0;
const discord_js_1 = require("discord.js");
class ServerStatsManager {
    static async updateStats(guild) {
        try {
            const members = await guild.members.fetch();
            const totalMembers = members.size;
            const onlineMembers = members.filter((m) => m.presence?.status === 'online' || m.presence?.status === 'dnd' || m.presence?.status === 'idle').size;
            const voiceMembers = members.filter((m) => !!m.voice.channelId).size;
            const channels = await guild.channels.fetch();
            let category = channels.find((c) => c && c.type === discord_js_1.ChannelType.GuildCategory && c.name.includes('SUNUCU İSTATİSTİKLERİ'));
            const everyoneRole = guild.roles.everyone;
            if (!category) {
                category = await guild.channels.create({
                    name: '📊 ┃ SUNUCU İSTATİSTİKLERİ',
                    type: discord_js_1.ChannelType.GuildCategory,
                    position: 0,
                    permissionOverwrites: [
                        {
                            id: everyoneRole.id,
                            allow: [discord_js_1.PermissionFlagsBits.ViewChannel],
                            deny: [discord_js_1.PermissionFlagsBits.Connect],
                        },
                    ],
                });
            }
            // 1. Toplam Üye Kanalı
            let chTotal = channels.find((c) => c && c.parentId === category?.id && c.name.includes('Toplam Üye'));
            const totalName = `👥・Toplam Üye: ${totalMembers}`;
            if (!chTotal) {
                await guild.channels.create({
                    name: totalName,
                    type: discord_js_1.ChannelType.GuildVoice,
                    parent: category.id,
                    permissionOverwrites: [
                        { id: everyoneRole.id, allow: [discord_js_1.PermissionFlagsBits.ViewChannel], deny: [discord_js_1.PermissionFlagsBits.Connect] },
                    ],
                });
            }
            else if (chTotal.name !== totalName) {
                await chTotal.setName(totalName);
            }
            // 2. Çevrimiçi / Aktif Kanalı
            let chOnline = channels.find((c) => c && c.parentId === category?.id && (c.name.includes('Çevrimiçi') || c.name.includes('Aktif')));
            const onlineName = `🟢・Aktif Üye: ${onlineMembers > 0 ? onlineMembers : totalMembers}`;
            if (!chOnline) {
                await guild.channels.create({
                    name: onlineName,
                    type: discord_js_1.ChannelType.GuildVoice,
                    parent: category.id,
                    permissionOverwrites: [
                        { id: everyoneRole.id, allow: [discord_js_1.PermissionFlagsBits.ViewChannel], deny: [discord_js_1.PermissionFlagsBits.Connect] },
                    ],
                });
            }
            else if (chOnline.name !== onlineName) {
                await chOnline.setName(onlineName);
            }
            // 3. Sesteki Üyeler Kanalı
            let chVoice = channels.find((c) => c && c.parentId === category?.id && c.name.includes('Sesteki'));
            const voiceName = `🎙️・Sesteki Üyeler: ${voiceMembers}`;
            if (!chVoice) {
                await guild.channels.create({
                    name: voiceName,
                    type: discord_js_1.ChannelType.GuildVoice,
                    parent: category.id,
                    permissionOverwrites: [
                        { id: everyoneRole.id, allow: [discord_js_1.PermissionFlagsBits.ViewChannel], deny: [discord_js_1.PermissionFlagsBits.Connect] },
                    ],
                });
            }
            else if (chVoice.name !== voiceName) {
                await chVoice.setName(voiceName);
            }
            // 4. Güvenlik Durumu Kanalı
            let chSecurity = channels.find((c) => c && c.parentId === category?.id && c.name.includes('Güvenlik'));
            const secName = '🛡️・Güvenlik: %100 Aktif';
            if (!chSecurity) {
                await guild.channels.create({
                    name: secName,
                    type: discord_js_1.ChannelType.GuildVoice,
                    parent: category.id,
                    permissionOverwrites: [
                        { id: everyoneRole.id, allow: [discord_js_1.PermissionFlagsBits.ViewChannel], deny: [discord_js_1.PermissionFlagsBits.Connect] },
                    ],
                });
            }
        }
        catch (err) {
            console.warn('[ServerStatsManager] İstatistik kanalları güncellenirken hata:', err.message);
        }
    }
}
exports.ServerStatsManager = ServerStatsManager;
