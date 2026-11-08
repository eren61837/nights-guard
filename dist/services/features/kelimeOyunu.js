"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KelimeOyunuManager = void 0;
const discord_js_1 = require("discord.js");
const autoSecurityGuard_1 = require("./autoSecurityGuard");
class KelimeOyunuManager {
    static state = {
        lastWord: 'ELMA',
        lastUserId: null,
        usedWords: new Set(['elma']),
        streak: 1,
        channelId: null,
    };
    static getState() {
        return this.state;
    }
    static setChannelId(channelId) {
        this.state.channelId = channelId;
    }
    static async sendTempWarning(message, content, delayMs = 3500) {
        try {
            if ('send' in message.channel) {
                const warn = await message.channel.send({ content });
                setTimeout(() => {
                    warn.delete().catch(() => { });
                }, delayMs);
            }
        }
        catch (e) { }
    }
    static async handleMessage(message) {
        if (message.author.bot || !message.guild)
            return;
        const channelName = message.channel.name || '';
        if (!channelName.includes('kelime-oyunu'))
            return;
        const text = message.content.trim();
        // 0. Küfür & Argo Koruması
        if (autoSecurityGuard_1.AutoSecurityGuard.isProfane(text)) {
            await message.delete().catch(() => { });
            await this.sendTempWarning(message, `🚫 <@${message.author.id}>, küfür, hakaret veya argo içeren kelimeler kelime türetmece oyununda kullanılamaz!`, 4000);
            return;
        }
        // 1. Geçersiz Format Kontrolü (Boşluk, sayı, özel karakter veya < 2 harf)
        const turkishWordRegex = /^[a-zA-ZçğıöşüÇĞİÖŞÜ]+$/;
        if (text.startsWith('/') || text.startsWith('!') || text.includes(' ') || text.length < 2 || !turkishWordRegex.test(text)) {
            await message.delete().catch(() => { });
            await this.sendTempWarning(message, `⚠️ <@${message.author.id}>, burası kelime türetme kanalıdır! Yalnızca tek bir geçerli kelime yazabilirsiniz.`);
            return;
        }
        const wordLower = text.toLocaleLowerCase('tr-TR');
        const wordUpper = text.toLocaleUpperCase('tr-TR');
        // 1. Aynı kullanıcı art arda yazamaz
        if (this.state.lastUserId === message.author.id) {
            await message.delete().catch(() => { });
            await this.sendTempWarning(message, `⚠️ <@${message.author.id}>, art arda iki kelime yazamazsınız! Lütfen başka bir üyenin kelime türetmesini bekleyin.`);
            return;
        }
        // 2. İlk harf, önceki kelimenin son harfiyle eşleşmelidir
        const expectedLetter = this.state.lastWord.slice(-1).toLocaleLowerCase('tr-TR');
        const currentFirstLetter = wordLower[0];
        if (currentFirstLetter !== expectedLetter) {
            await message.delete().catch(() => { });
            await this.sendTempWarning(message, `❌ <@${message.author.id}>, yazdığın kelime '**${expectedLetter.toLocaleUpperCase('tr-TR')}**' harfiyle başlamalı! (Son kelime: **${this.state.lastWord}**)`);
            return;
        }
        // 3. Daha önce kullanılan kelime tekrar kullanılamaz
        if (this.state.usedWords.has(wordLower)) {
            await message.delete().catch(() => { });
            await this.sendTempWarning(message, `⚠️ <@${message.author.id}>, '**${wordUpper}**' kelimesi bu oyunda daha önce kullanıldı! Lütfen başka bir kelime türetin.`);
            return;
        }
        // 4. Kelime Başarılı ve Onaylandı!
        this.state.usedWords.add(wordLower);
        this.state.lastWord = wordUpper;
        this.state.lastUserId = message.author.id;
        this.state.streak++;
        // Onaylanmış reaksiyon ekle
        try {
            await message.react('✅');
        }
        catch (e) { }
        // Streak Dönüm Noktası Duyurusu (Her 10 kelimede bir)
        if (this.state.streak % 10 === 0) {
            const nextLetter = this.state.lastWord.slice(-1).toLocaleUpperCase('tr-TR');
            const milestoneEmbed = new discord_js_1.EmbedBuilder()
                .setTitle(`🔥 KELİME TÜRETME SERİSİ: ${this.state.streak} KELİME! 🔥`)
                .setDescription(`Harika gidiyorsunuz! Toplam **${this.state.streak}** kelime türetildi!\n` +
                `Son Kelime: **${this.state.lastWord}**\n` +
                `Sıradaki Kelime '**${nextLetter}**' harfiyle başlamalı!`)
                .setColor('#F1C40F')
                .setFooter({ text: 'Nights Kelime Oyunu • Made by erencix' });
            if ('send' in message.channel) {
                await message.channel.send({ embeds: [milestoneEmbed] });
            }
        }
    }
    static getInitialEmbed() {
        const nextLetter = this.state.lastWord.slice(-1).toLocaleUpperCase('tr-TR');
        return new discord_js_1.EmbedBuilder()
            .setTitle('🧩 NIGHTS KELİME TÜRETMECE OYUNU BAŞLADI!')
            .setDescription('Sunucumuzun otomatik kelime türetme oyunu aktif!\n\n' +
            '### 📌 Oyun Kuralları:\n' +
            '1️⃣ Yazdığınız kelime, bir önceki kelimenin **son harfiyle** başlamalıdır.\n' +
            '2️⃣ Geçersiz, hatalı veya tekrarlanan kelimeler **otomatik silinir** ve uyarılırsınız.\n' +
            '3️⃣ Doğru kelimelere bot tarafından **✅ onay emojisi** bırakılır.\n' +
            '4️⃣ Aynı kişi art arda iki kelime yazamaz, sırayla oynanmalıdır.\n' +
            '5️⃣ Sadece tek bir kelime yazınız (sohbet veya cümle yazmayınız).\n\n' +
            `🏁 **Başlangıç Kelimesi:** **${this.state.lastWord}**\n` +
            `👉 **Sıradaki Kelime:** '**${nextLetter}**' harfiyle başlamalıdır!\n\n` +
            '🔥 *Hadi ilk kelimeyi yazarak seriyi başlatın!*')
            .setColor('#38BDF8')
            .setFooter({ text: 'Nights Guard Otomatik Oyun Motoru' });
    }
}
exports.KelimeOyunuManager = KelimeOyunuManager;
