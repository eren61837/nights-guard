"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AfkManager = void 0;
const discord_js_1 = require("discord.js");
class AfkManager {
    static afkUsers = new Map();
    static setAfk(userId, reason) {
        this.afkUsers.set(userId, {
            userId,
            reason: reason || 'Belirtilmedi',
            timestamp: Date.now(),
        });
    }
    static isAfk(userId) {
        return this.afkUsers.has(userId);
    }
    static getAfk(userId) {
        return this.afkUsers.get(userId);
    }
    static removeAfk(userId) {
        const data = this.afkUsers.get(userId);
        if (data) {
            this.afkUsers.delete(userId);
        }
        return data;
    }
    /**
     * Mesaj atıldığında AFK kontrolü yapar:
     * 1. Mesajı atan kişi AFK ise AFK modunu kapatır ve bilgilendirir.
     * 2. Mesajda etiketlenen kişiler AFK ise neden AFK olduklarını bildirir.
     */
    static async handleMessage(message) {
        if (message.author.bot || !message.guild)
            return;
        // 1. Yazar AFK miydi?
        if (this.isAfk(message.author.id)) {
            const data = this.removeAfk(message.author.id);
            if (data) {
                const passedSeconds = Math.floor((Date.now() - data.timestamp) / 1000);
                const minutes = Math.floor(passedSeconds / 60);
                const timeText = minutes > 0 ? `${minutes} dakika` : `${passedSeconds} saniye`;
                const welcomeBackEmbed = new discord_js_1.EmbedBuilder()
                    .setDescription(`👋 **Tekrar hoş geldin <@${message.author.id}>!** AFK modundan çıktın. (*Süre: ${timeText}*)`)
                    .setColor('#2ECC71');
                message.reply({ embeds: [welcomeBackEmbed] }).catch(() => { });
            }
        }
        // 2. Etiketlenenler AFK mi?
        if (message.mentions.users.size > 0) {
            const mentionedAfkUsers = [];
            for (const [userId] of message.mentions.users) {
                if (userId === message.author.id)
                    continue;
                const afkData = this.getAfk(userId);
                if (afkData) {
                    mentionedAfkUsers.push(afkData);
                }
            }
            if (mentionedAfkUsers.length > 0) {
                for (const data of mentionedAfkUsers) {
                    const timestampSec = Math.floor(data.timestamp / 1000);
                    const afkEmbed = new discord_js_1.EmbedBuilder()
                        .setTitle('💤 Kullanıcı Şu Anda AFK')
                        .setDescription(`<@${data.userId}> şu anda AFK modunda!\n\n` +
                        `> 📌 **Sebep:** ${data.reason}\n` +
                        `> ⏰ **Ayrılış:** <t:${timestampSec}:R>`)
                        .setColor('#F1C40F');
                    await message.reply({ embeds: [afkEmbed] }).catch(() => { });
                }
            }
        }
    }
}
exports.AfkManager = AfkManager;
