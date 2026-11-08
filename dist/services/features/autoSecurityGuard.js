"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoSecurityGuard = void 0;
const discord_js_1 = require("discord.js");
class AutoSecurityGuard {
    // Reklam & Davet regexleri
    static inviteRegex = /(discord\.(gg|io|me|li)\/.+|discordapp\.com\/invite\/.+|discord\.com\/invite\/.+|t\.me\/.+|whatsapp\.com\/chat\/.+)/i;
    // Sahte Nitro, Phishing ve Dolandırıcılık linkleri
    static phishingRegex = /(steamcommunit[y|i]|steam-gift|free-nitro|discrod-nitro|discord-gift|dlscord|nitro-gift|airdrop.*crypto|gift-nitro|claim-nitro)/i;
    // Kullanıcı spam takip tablosu
    static spamTracker = new Map();
    /**
     * Sadece Ailevi (Anne, Bacı, Sülale) ve Şahsa Yönelik Ağır Hakaretleri Engelleyen Filtre
     * "amk", "siktir", "lan", "aq", "sg", "siktim" gibi genel sohbet argo/ünlemleri SERBESTTİR.
     */
    static isProfane(rawContent) {
        if (!rawContent)
            return false;
        const lower = rawContent.toLowerCase();
        // 1. Türkçe karakterleri ve leetspeak normalize et
        const normalized = lower
            .replace(/ı/g, 'i')
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .replace(/0/g, 'o')
            .replace(/1/g, 'i')
            .replace(/3/g, 'e')
            .replace(/4/g, 'a')
            .replace(/@/g, 'a')
            .replace(/\$/g, 's')
            .replace(/!/g, 'i');
        const collapsed = normalized.replace(/[^a-z]/g, '').replace(/(.)\1{2,}/g, '$1$1');
        const fullyCollapsed = normalized.replace(/[^a-z]/g, '').replace(/(.)\1+/g, '$1');
        // 1. Ailevi / Anneye Yönelik Küfürler (ananı, anana, ananın, anneni, annenin vb.)
        if (/(anani|anana|ananin|anneni|annenin|anaskm|anacini)/i.test(normalized) || /(anani|anana|ananin|anneni|annenin|anaskm|anacini)/i.test(collapsed)) {
            if (/(sik|am[iı]|sok|koy|avrat|baci|orospu|orosbu|kayayim|skm)/i.test(normalized) || /(sik|ami|sok|koy|avrat|baci|orospu|orosbu|kayayim|skm)/i.test(collapsed)) {
                return true;
            }
        }
        // 2. Doğrudan Ailevi / Ağır Şahsi Mutlak Kökler
        const severeTargetedRoots = [
            'orospu cocug',
            'orospu cocuk',
            'orospu evlad',
            'orosbu cocug',
            'orosbu cocuk',
            'orosbu evlad',
            'kahpe evlad',
            'kahbe evlad',
            'pic kurusu',
            'bacinisi',
            'bacini sik',
            'bacina sok',
            'sulalenisi',
            'sulaleni sik',
            'sulalene koy',
            'sulalene sok',
            'ecdadini',
            'ceddini sik',
            'allahini sik',
            'dinini sik',
            'kitabini sik',
            'seni sikerim',
            'seni sikeyim',
            'senin anani',
            'senin bacini',
            'senin sulaleni',
            'gotveren',
            'gotlek',
        ];
        for (const root of severeTargetedRoots) {
            const rootNorm = root
                .replace(/ı/g, 'i')
                .replace(/ğ/g, 'g')
                .replace(/ü/g, 'u')
                .replace(/ş/g, 's')
                .replace(/ö/g, 'o')
                .replace(/ç/g, 'c');
            const rootCollapsed = rootNorm.replace(/\s+/g, '');
            if (normalized.includes(rootNorm) || collapsed.includes(rootCollapsed) || fullyCollapsed.includes(rootCollapsed)) {
                return true;
            }
        }
        // 3. 'oç' ve varyasyonları (o.ç, o ç, oc)
        const words = normalized.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
        for (const w of words) {
            const dedup = w.replace(/(.)\1+/g, '$1');
            if (w === 'oc' || dedup === 'oc' || w === 'oç' || dedup === 'oç')
                return true;
        }
        if (/(?:^|\s|[^a-z0-9])o[\.\,\_\*\-\s]*c(?:$|\s|[^a-z0-9])/i.test(normalized)) {
            return true;
        }
        return false;
    }
    static async inspect(message) {
        if (message.author.bot || !message.guild)
            return false;
        if (!message.content && message.attachments.size === 0)
            return false;
        // Yetkili Kontrolü (Kurucu, Yönetici, Moderatör)
        const isStaff = Boolean(message.member?.permissions.has(discord_js_1.PermissionFlagsBits.Administrator) ||
            message.member?.permissions.has(discord_js_1.PermissionFlagsBits.ManageMessages) ||
            message.member?.permissions.has(discord_js_1.PermissionFlagsBits.ModerateMembers) ||
            message.guild.ownerId === message.author.id);
        const content = message.content ? message.content.trim() : '';
        const chName = message.channel.name || '';
        const chId = message.channel.id;
        const isMediaChannel = chName.includes('foto-medya') || chId === '1568644564590268641';
        const isTicketChannel = chName.startsWith('bilet-') || chName.startsWith('ticket-');
        // 0. Fotoğraf & Medya İhlali Koruması (#foto-medya haricinde dosya/resim engeli)
        const hasAttachments = message.attachments.size > 0;
        const hasImageLink = /(https?:\/\/[^\s]+(?:\.png|\.jpg|\.jpeg|\.webp|\.gif|\.bmp|\.svg)|cdn\.discordapp\.com\/attachments|media\.discordapp\.net\/attachments)/i.test(content);
        if (!isMediaChannel && !isTicketChannel && (hasAttachments || hasImageLink)) {
            if (!isStaff) {
                try {
                    await message.delete();
                }
                catch (e) { }
                try {
                    if ('send' in message.channel) {
                        const warn = await message.channel.send({
                            content: `📸 **${message.author.displayName}**, sunucumuzda fotoğraf ve görsel paylaşımları yalnızca <#1568644564590268641> kanalında serbesttir!`,
                        });
                        setTimeout(() => warn.delete().catch(() => { }), 5000);
                    }
                }
                catch (e) { }
                return true; // Engellendi
            }
        }
        const userId = message.author.id;
        let reason = '';
        let shouldTimeout = false;
        // 1. Küfür & Hakaret Koruması (Yetkililer için de deneme amaçlı denetlenir!)
        if (this.isProfane(content)) {
            reason = 'Küfür / Hakaret İçeriği';
            shouldTimeout = !isStaff; // Yetkiliye asla timeout verilmez, normal üyeye 1 dk timeout verilir
        }
        // Yetkililer küfür testi haricinde rutin işlemlerden (reklam, spam, caps) muaftır
        if (!reason && isStaff) {
            return false;
        }
        // 2. Phishing & Sahte Nitro Koruması
        if (!reason && this.phishingRegex.test(content)) {
            reason = 'Zararlı Bağlantı / Sahte Nitro & Phishing';
            shouldTimeout = true;
        }
        // 3. Reklam & Davet Link Koruması
        else if (!reason && this.inviteRegex.test(content)) {
            reason = 'İzinsiz Reklam / Discord Davet Linki';
        }
        // 4. Aşırı Mention (Toplu Etiket) Koruması (> 3 etiket)
        else if (!reason && message.mentions.users.size + message.mentions.roles.size > 3) {
            reason = 'Aşırı Etiket (Mass Mention) Koruması';
            shouldTimeout = true;
        }
        // 5. Aşırı Büyük Harf (Caps Lock) Koruması (> 15 karakter ve %85+ büyük harf)
        else if (!reason && content.length > 15) {
            const letters = content.replace(/[^a-zA-ZçğıöşüÇĞİÖŞÜ]/g, '');
            if (letters.length > 10) {
                const uppercaseCount = letters.replace(/[^A-ZÇĞİÖŞÜ]/g, '').length;
                if (uppercaseCount / letters.length > 0.85) {
                    reason = 'Aşırı Büyük Harf (Caps Lock) Kullanımı';
                }
            }
        }
        // 6. Spam & Flood Koruması (Oyun komutları ve oyun kanalları muaftır; abartı raid olmadığı sürece timeout verilmez)
        const isGameChannel = chName.includes('owo') ||
            chName.includes('oyun') ||
            chName.includes('kelime') ||
            chName.includes('bot-komut') ||
            chName.includes('kumar');
        const isGameCommand = /^(owo|w\b|wb|wbj|wh|s\b|c\b|cf|slot|!|\.|\/)/i.test(content.trim());
        if (!reason && !isGameChannel && !isGameCommand) {
            const now = Date.now();
            const userData = this.spamTracker.get(userId) || { timestamps: [], lastMessages: [] };
            userData.timestamps = userData.timestamps.filter((t) => now - t < 3000);
            userData.timestamps.push(now);
            userData.lastMessages.push(content.toLowerCase());
            if (userData.lastMessages.length > 10)
                userData.lastMessages.shift();
            const sameCount = userData.lastMessages.filter((m) => m === content.toLowerCase()).length;
            // Sadece abartı / raid boyutundaki saldırılarda timeout verilir
            if (userData.timestamps.length >= 8) {
                reason = 'Aşırı Hızlı Mesaj Saldırısı (Spam Raid)';
                shouldTimeout = true;
            }
            else if (sameCount >= 8) {
                reason = 'Aşırı Mesaj Tekrarlama (Flood Raid)';
                shouldTimeout = true;
            }
            else if (userData.timestamps.length >= 5) {
                // Hafif spam: Sadece mesajı sil, asla timeout verme
                reason = 'Hızlı Mesaj Gönderimi';
                shouldTimeout = false;
            }
            else if (sameCount >= 4) {
                // Hafif flood: Sadece mesajı sil, asla timeout verme
                reason = 'Mesaj Tekrarı';
                shouldTimeout = false;
            }
            this.spamTracker.set(userId, userData);
        }
        if (reason) {
            // Mesajı anında sil
            try {
                await message.delete();
            }
            catch (e) { }
            // Normal üyelere 1 dakikalık mola (Timeout) ver (Yetkililere ASLA verilmez)
            if (shouldTimeout && !isStaff && message.member) {
                try {
                    await message.member.timeout(60 * 1000, `Nights Guard: ${reason}`);
                }
                catch (e) { }
            }
            // Kullanıcıya uyarı mesajı gönder
            try {
                if ('send' in message.channel) {
                    if (isStaff) {
                        // Yetkiliye deneme amaçlı özel bilgilendirme uyarısı (Ceza uygulanmaz)
                        const warn = await message.channel.send({
                            content: `⚠️ **${message.author.displayName}** \`[YETKİLİ TEST UYARISI]\`\nMesajınızda **${reason}** tespit edildi!\n> 🛡️ *Yetkili olduğunuz için timeout/ceza uygulanmadı. Test amaçlı koruma uyarısıdır.*`,
                        });
                        setTimeout(() => warn.delete().catch(() => { }), 6000);
                    }
                    else {
                        // Normal üyeye standart uyarı
                        const timeoutText = shouldTimeout ? ' (1 Dakika Susturuldunuz)' : '';
                        const warn = await message.channel.send({
                            content: `🛡️ **${message.author.displayName}**, sunucumuzda **${reason}** engellendi!${timeoutText}`,
                        });
                        setTimeout(() => warn.delete().catch(() => { }), 4500);
                    }
                }
            }
            catch (e) { }
            // Mod-Log kanalına detaylı rapor ilet
            try {
                const logChannel = message.guild.channels.cache.find((c) => c.name.includes('mod-log') && c.isTextBased());
                if (logChannel) {
                    const logEmbed = new discord_js_1.EmbedBuilder()
                        .setTitle(isStaff ? '🧪 [Yetkili Testi] Güvenlik Filtresi Tetiklendi' : '🚨 Nights Guard: Güvenlik İhlali Engellendi')
                        .setColor(isStaff ? '#F1C40F' : (shouldTimeout ? '#992D22' : '#ED4245'))
                        .addFields({
                        name: '👤 Kullanıcı',
                        value: `<@${message.author.id}> (\`${message.author.tag}\`) ${isStaff ? '⭐ **(Yetkili / Muaf)**' : ''}`,
                        inline: true,
                    }, { name: '📁 Kanal', value: `<#${message.channel.id}>`, inline: true }, { name: '🛑 Sebep', value: `**${reason}**`, inline: true }, {
                        name: '⚖️ Alınan Tedbir',
                        value: isStaff
                            ? '⚠️ **Mesaj Silindi & Deneme Uyarısı Verildi** (Yetkili: Ceza Yok)'
                            : (shouldTimeout ? '🛑 **Mesaj Silindi + 1 Dk Timeout**' : '🗑️ **Mesaj Silindi & Uyarıldı**'),
                        inline: true,
                    }, { name: '💬 Mesaj İçeriği', value: `\`\`\`${content.slice(0, 750)}\`\`\``, inline: false })
                        .setFooter({ text: 'Nights Guard • Üst Düzey Güvenlik Kalkanı' })
                        .setTimestamp();
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
            catch (e) { }
            return true; // Mesaj engellendi
        }
        return false;
    }
}
exports.AutoSecurityGuard = AutoSecurityGuard;
