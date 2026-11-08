"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CountingGameManager = void 0;
const discord_js_1 = require("discord.js");
class CountingGameManager {
    static currentNumber = 1;
    static lastUserId = null;
    static highestScore = 0;
    static async handleMessage(message) {
        if (message.author.bot || !message.guild)
            return;
        const channelName = message.channel.name || '';
        if (!channelName.includes('sayi-saymaca'))
            return;
        const text = message.content.trim();
        const num = parseInt(text, 10);
        // Sayı değilse veya geçersiz karakterler varsa sil
        if (isNaN(num) || text !== num.toString()) {
            await message.delete().catch(() => { });
            try {
                if ('send' in message.channel) {
                    const warn = await message.channel.send({
                        content: `⚠️ <@${message.author.id}>, burası sayı saymaca kanalıdır! Yalnızca sıradaki sayıyı (**${this.currentNumber}**) yazınız.`,
                    });
                    setTimeout(() => warn.delete().catch(() => { }), 3500);
                }
            }
            catch (e) { }
            return;
        }
        // Aynı kullanıcı art arda iki sayı yazamaz
        if (this.lastUserId === message.author.id) {
            await message.delete().catch(() => { });
            try {
                if ('send' in message.channel) {
                    const warn = await message.channel.send({
                        content: `⚠️ <@${message.author.id}>, art arda iki sayı yazamazsınız! Başka bir üyenin yazmasını bekleyin.`,
                    });
                    setTimeout(() => warn.delete().catch(() => { }), 3500);
                }
            }
            catch (e) { }
            return;
        }
        // Yanlış sayı girildi -> Seri Bozulur!
        if (num !== this.currentNumber) {
            const failedAt = this.currentNumber - 1;
            this.currentNumber = 1;
            this.lastUserId = null;
            await message.react('❌').catch(() => { });
            try {
                if ('send' in message.channel) {
                    const failEmbed = new discord_js_1.EmbedBuilder()
                        .setTitle('💥 EYVAH! SERİ BOZULDU! 💥')
                        .setDescription(`<@${message.author.id}> yanlış sayı girdi (**${num}** yerine **${failedAt + 1}** yazılmalıydı)!\n\n` +
                        `📊 **Ulaşılan Skor:** \`${failedAt}\` Sayı\n` +
                        `🏆 **Rekor:** \`${this.highestScore}\` Sayı\n\n` +
                        `🔄 *Oyun sıfırlandı! Sıradaki sayı: **1***`)
                        .setColor('#ED4245')
                        .setFooter({ text: 'Nights Sayı Saymaca Oyunu' });
                    await message.channel.send({ embeds: [failEmbed] });
                }
            }
            catch (e) { }
            return;
        }
        // Doğru Sayı Girildi!
        this.currentNumber++;
        this.lastUserId = message.author.id;
        if (num > this.highestScore)
            this.highestScore = num;
        await message.react('✅').catch(() => { });
        // Dönüm noktası kutlamaları (Örn: 25, 50, 100...)
        if (num % 25 === 0) {
            try {
                if ('send' in message.channel) {
                    const milestoneEmbed = new discord_js_1.EmbedBuilder()
                        .setTitle(`🎉 BÜYÜK BAŞARI: ${num}. SAYIYA ULAŞILDI! 🚀`)
                        .setDescription(`Tebrikler! Sunucu olarak harika bir takım çalışması sergiliyorsunuz.\n` +
                        `Şu anki seri: **${num}**\n` +
                        `Sıradaki hedef: **${num + 25}**`)
                        .setColor('#2ECC71')
                        .setFooter({ text: 'Nights Community Games' });
                    await message.channel.send({ embeds: [milestoneEmbed] });
                }
            }
            catch (e) { }
        }
    }
    static getInitialEmbed() {
        return new discord_js_1.EmbedBuilder()
            .setTitle('🔢 NIGHTS SAYI SAYMACA OYUNU BAŞLADI!')
            .setDescription('Sunucumuzun takım çalışması ve eğlence dolu sayı sayma oyunu aktif!\n\n' +
            '### 📌 Oyun Kuralları:\n' +
            '1️⃣ Sıradaki sayıyı eksiksiz olarak yazınız *(1, 2, 3...)*.\n' +
            '2️⃣ Aynı kişi **art arda iki sayı** yazamaz.\n' +
            '3️⃣ Yanlış bir sayı yazılırsa seri **sıfırlanır** ve 1\'den baştan başlar.\n' +
            '4️⃣ Sayı dışındaki sohbet mesajları otomatik temizlenir.\n\n' +
            `🏁 **Başlangıç:** Sıradaki Sayı: **1**\n\n` +
            '🔥 *Hadi ilk sayıyı yazarak rekor kırmaya başlayın!*')
            .setColor('#3498DB')
            .setFooter({ text: 'Nights Guard Oyun Motoru • Made by erencix' });
    }
}
exports.CountingGameManager = CountingGameManager;
