"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIChatManager = void 0;
const generative_ai_1 = require("@google/generative-ai");
class AIChatManager {
    static geminiClient = null;
    static recentUsers = new Map();
    static initGemini() {
        const key = process.env.GEMINI_API_KEY;
        if (key && !this.geminiClient) {
            try {
                const genAI = new generative_ai_1.GoogleGenerativeAI(key);
                this.geminiClient = genAI.getGenerativeModel({
                    model: 'gemini-1.5-flash',
                    systemInstruction: 'Sen Nights Guard adlı Discord botusun. Yaratıcın Erencix (erengaliba42). ' +
                        '☊ Nights adlı Discord sunucusunun koruyucusu, eğlence ve sohbet arkadaşısın. ' +
                        'Üyelerle çok samimi, hafif esprili, zeki, Türkçe konuşan, havalı ve yardımsever bir dille sohbet et. ' +
                        'Discord markdown formatını ve emojileri dengeli kullan. Cevaplarını çok uzatmadan, doğrudan ve ilgi çekici ver.',
                });
            }
            catch (e) {
                this.geminiClient = null;
            }
        }
    }
    static async handleMessage(message, client) {
        if (message.author.bot || !message.guild)
            return false;
        const channelName = message.channel.name?.toLowerCase() || '';
        const isAiChannel = channelName.includes('ai-sohbet') ||
            channelName.includes('yapay-zeka') ||
            channelName.includes('bot-sohbet') ||
            channelName.includes('ai-chat');
        const botMentioned = client.user && message.mentions.has(client.user.id) && !message.mentions.everyone;
        if (!isAiChannel && !botMentioned) {
            return false;
        }
        // Rate-limit: Kullanıcı başına 2 saniye
        const lastTime = this.recentUsers.get(message.author.id) || 0;
        if (Date.now() - lastTime < 2000)
            return true;
        this.recentUsers.set(message.author.id, Date.now());
        // Bot etiketini mesajdan temizle
        let prompt = message.content;
        if (client.user) {
            prompt = prompt.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();
        }
        if (!prompt) {
            await message.reply('Efendim kral? Buradayım, bir şey mi soracaktın? 👋').catch(() => { });
            return true;
        }
        try {
            if ('sendTyping' in message.channel) {
                await message.channel.sendTyping().catch(() => { });
            }
            this.initGemini();
            let replyText = '';
            if (this.geminiClient) {
                try {
                    const result = await this.geminiClient.generateContent(prompt);
                    replyText = result.response.text();
                }
                catch {
                    replyText = this.getSmartFallbackResponse(prompt, message.author.displayName);
                }
            }
            else {
                replyText = this.getSmartFallbackResponse(prompt, message.author.displayName);
            }
            if (replyText.length > 2000) {
                replyText = replyText.slice(0, 1990) + '...';
            }
            await message.reply(replyText).catch(() => { });
            return true;
        }
        catch (err) {
            console.warn('[AIChatManager] Hata:', err.message);
            return false;
        }
    }
    static getSmartFallbackResponse(prompt, userName) {
        const p = prompt.toLowerCase();
        if (p.includes('nasılsın') || p.includes('naber')) {
            return `İyiyim ${userName}, sunucuyu 7/24 korumaya ve sizinle takılmaya devam ediyorum! Sen nasılsın, keyifler nasıl? ✨`;
        }
        if (p.includes('kimsin') || p.includes('nesin')) {
            return `Ben **Nights Guard**! 🛡️ **Erencix** tarafından geliştirilmiş, **☊ Nights** sunucusunun koruma, eğlence, ekonomi ve yapay zeka asistanıyım. Hizmetindeyim!`;
        }
        if (p.includes('sahibin') || p.includes('yapımcın') || p.includes('kurucun')) {
            return `Beni kodlayan ve tasarlayan kral **Erencix** (<@1138498666785677492>)! 👑`;
        }
        if (p.includes('yardım') || p.includes('komut')) {
            return `Bütün komutlarımı görmek için \`/yardim\` veya \`!yardim\` yazabilirsin kral! Seviyeden ekonomiye, güvenlikten eğlenceye her şey elimizin altında.`;
        }
        if (p.includes('seviyorum') || p.includes('adamsın') || p.includes('cansın')) {
            return `Eyvallah ${userName}, o senin krallığın! ☊ Nights ailesi olarak her zaman beraberiz! ❤️`;
        }
        if (p.includes('para') || p.includes('coin') || p.includes('kumar')) {
            return `Nights Coin kazanmak için \`!gunluk\`, \`!calis\` yapabilir veya \`!cf\` / \`!slot\` ile şansını deneyebilirsin! 🎰💰`;
        }
        const genericResponses = [
            `Haklısın ${userName}, tam olarak öyle! Başka ne düşünüyorsun bu konuda? 🤔`,
            `İlginç bir yaklaşım kral. ☊ Nights ortamında her fikre açığız! ☕`,
            `Bunu not aldım! Başka sormak veya konuşmak istediğin bir konu var mı? ✨`,
            `Haha kesinlikle katılıyorum ${userName}! Birlikte sunucuyu daha da coşturacağız. 🚀`,
        ];
        return genericResponses[Math.floor(Math.random() * genericResponses.length)];
    }
}
exports.AIChatManager = AIChatManager;
