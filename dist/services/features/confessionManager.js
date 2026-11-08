"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfessionManager = void 0;
const discord_js_1 = require("discord.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const autoSecurityGuard_1 = require("./autoSecurityGuard");
class ConfessionManager {
    static filePath = path_1.default.resolve('assets/confessions.json');
    static store = {
        counter: 0,
        confessions: {},
    };
    static loaded = false;
    static load() {
        if (this.loaded)
            return;
        try {
            if (fs_1.default.existsSync(this.filePath)) {
                const raw = fs_1.default.readFileSync(this.filePath, 'utf-8');
                this.store = JSON.parse(raw);
            }
        }
        catch {
            this.store = { counter: 0, confessions: {} };
        }
        this.loaded = true;
    }
    static save() {
        try {
            const dir = path_1.default.dirname(this.filePath);
            if (!fs_1.default.existsSync(dir))
                fs_1.default.mkdirSync(dir, { recursive: true });
            fs_1.default.writeFileSync(this.filePath, JSON.stringify(this.store, null, 2), 'utf-8');
        }
        catch (e) {
            console.warn('[ConfessionManager] Kaydetme hatası:', e.message);
        }
    }
    static async getConfessionChannel(guild) {
        try {
            const channels = await guild.channels.fetch();
            let ch = channels.find((c) => c &&
                c.isTextBased() &&
                (c.name.includes('itiraf') || c.name.includes('anonim')));
            // Kanal bulunamazsa otomatik oluştur
            if (!ch) {
                const me = guild.members.me;
                if (me?.permissions.has(discord_js_1.PermissionFlagsBits.ManageChannels)) {
                    ch = await guild.channels.create({
                        name: '🤫・itiraf-duvarı',
                        type: discord_js_1.ChannelType.GuildText,
                        topic: 'Nights Topluluğu Anonim İtiraf Duvarı • /itiraf yazarak itirafta bulunabilirsiniz!',
                        permissionOverwrites: [
                            {
                                id: guild.id,
                                allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.ReadMessageHistory],
                                deny: [discord_js_1.PermissionFlagsBits.SendMessages], // Üyeler sadece butonlara tıklayabilir, itiraflar botla atılır
                            },
                        ],
                    });
                    console.log(`[ConfessionManager] #${ch.name} kanalı otomatik oluşturuldu.`);
                }
            }
            return ch || null;
        }
        catch {
            return null;
        }
    }
    static async submit(guild, user, text) {
        this.load();
        const cleanText = text.trim();
        if (cleanText.length < 5) {
            return { success: false, message: 'İtirafınız çok kısa! En az 5 karakter yazmalısınız.' };
        }
        if (cleanText.length > 1000) {
            return { success: false, message: 'İtirafınız 1000 karakter sınırını aşıyor!' };
        }
        // Küfür & Ağır Hakaret Filtresi
        if (autoSecurityGuard_1.AutoSecurityGuard.isProfane(cleanText)) {
            return {
                success: false,
                message: '❌ İtirafınız uygunsuz, ailevi veya ağır şahsi hakaret içerdiği için paylaşılamadı.',
            };
        }
        const channel = await this.getConfessionChannel(guild);
        if (!channel) {
            return {
                success: false,
                message: 'Sunucuda itiraf kanalı bulunamadı veya oluşturulamadı. Lütfen yöneticiye başvurun.',
            };
        }
        this.store.counter = (this.store.counter || 0) + 1;
        const confessionId = this.store.counter;
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(`🤫 GİZLİ İTİRAF #${confessionId}`)
            .setDescription(`\`\`\`\n"${cleanText}"\n\`\`\``)
            .setColor('#8A2BE2')
            .setThumbnail('https://media.giphy.com/media/l41lFw057lAJQMwg0/giphy.gif')
            .addFields({
            name: '🔒 Gizlilik Durumu',
            value: '`%100 Anonim` — Yazan kişinin kimliği sunucu üyelerine ve sohbete asla ifşa edilmez.',
            inline: true,
        }, {
            name: '📅 Gönderim Tarihi',
            value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
            inline: true,
        })
            .setFooter({ text: 'Nights İtiraf Duvarı • Sen de itirafta bulunmak için: /itiraf' })
            .setTimestamp();
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`confess_love:${confessionId}`)
            .setLabel('❤️ 0')
            .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
            .setCustomId(`confess_dislike:${confessionId}`)
            .setLabel('💔 0')
            .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
            .setCustomId(`confess_shock:${confessionId}`)
            .setLabel('😱 0')
            .setStyle(discord_js_1.ButtonStyle.Secondary));
        try {
            const sentMsg = await channel.send({ embeds: [embed], components: [row] });
            this.store.confessions[sentMsg.id] = {
                id: confessionId,
                messageId: sentMsg.id,
                reactions: {
                    love: [],
                    dislike: [],
                    shock: [],
                },
            };
            this.save();
            return {
                success: true,
                message: `✅ İtirafınız gizli olarak <#${channel.id}> kanalına başarıyla iletildi! Kimliğiniz tamamen korunmaktadır.`,
                channelId: channel.id,
            };
        }
        catch (err) {
            return { success: false, message: `İtiraf gönderilirken hata oluştu: ${err.message}` };
        }
    }
    static async handleButton(interaction) {
        if (!interaction.customId.startsWith('confess_'))
            return false;
        this.load();
        const parts = interaction.customId.split(':');
        const action = parts[0]; // confess_love, confess_dislike, confess_shock
        const msgId = interaction.message.id;
        const userId = interaction.user.id;
        let conf = this.store.confessions[msgId];
        if (!conf) {
            // Mesaj ID bulunamadıysa yeni nesne aç
            const confId = parseInt(parts[1], 10) || 1;
            conf = {
                id: confId,
                messageId: msgId,
                reactions: { love: [], dislike: [], shock: [] },
            };
            this.store.confessions[msgId] = conf;
        }
        const type = action === 'confess_love' ? 'love' : action === 'confess_dislike' ? 'dislike' : 'shock';
        const list = conf.reactions[type];
        const existingIdx = list.indexOf(userId);
        if (existingIdx !== -1) {
            // Tepkiyi geri al (Toggle)
            list.splice(existingIdx, 1);
        }
        else {
            // Diğer tepkilerden sil (tek oy hakkı)
            conf.reactions.love = conf.reactions.love.filter((id) => id !== userId);
            conf.reactions.dislike = conf.reactions.dislike.filter((id) => id !== userId);
            conf.reactions.shock = conf.reactions.shock.filter((id) => id !== userId);
            conf.reactions[type].push(userId);
        }
        this.save();
        const loveCount = conf.reactions.love.length;
        const dislikeCount = conf.reactions.dislike.length;
        const shockCount = conf.reactions.shock.length;
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`confess_love:${conf.id}`)
            .setLabel(`❤️ ${loveCount}`)
            .setStyle(conf.reactions.love.includes(userId) ? discord_js_1.ButtonStyle.Success : discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
            .setCustomId(`confess_dislike:${conf.id}`)
            .setLabel(`💔 ${dislikeCount}`)
            .setStyle(conf.reactions.dislike.includes(userId) ? discord_js_1.ButtonStyle.Danger : discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
            .setCustomId(`confess_shock:${conf.id}`)
            .setLabel(`😱 ${shockCount}`)
            .setStyle(conf.reactions.shock.includes(userId) ? discord_js_1.ButtonStyle.Primary : discord_js_1.ButtonStyle.Secondary));
        await interaction.update({ components: [row] }).catch(() => { });
        return true;
    }
}
exports.ConfessionManager = ConfessionManager;
