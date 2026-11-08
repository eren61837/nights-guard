"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const discord_js_1 = require("discord.js");
const config_1 = require("../config");
const TARGET_GUILD_ID = '1568618183223414934';
async function main() {
    console.log('🧹 "owo disable all" mesajları aranıyor ve temizleniyor...');
    const client = new discord_js_1.Client({
        intents: [
            discord_js_1.GatewayIntentBits.Guilds,
            discord_js_1.GatewayIntentBits.GuildMessages,
            discord_js_1.GatewayIntentBits.MessageContent,
        ],
    });
    await client.login(config_1.config.discordToken);
    const guild = await client.guilds.fetch({ guild: TARGET_GUILD_ID, force: true });
    if (!guild) {
        console.error('Sunucu bulunamadı!');
        process.exit(1);
    }
    const channels = await guild.channels.fetch();
    let totalDeleted = 0;
    for (const [, ch] of channels) {
        if (ch && ch.isTextBased() && !ch.isVoiceBased()) {
            try {
                const messages = await ch.messages.fetch({ limit: 50 });
                for (const [, msg] of messages) {
                    const content = msg.content.toLowerCase().trim();
                    // Check for "owo disable all" or OwO bot's confirmation message
                    const isUserDisable = content.includes('owo disable all') || content === 'owo disable' || content.includes('disable all');
                    const isOwoBotReply = msg.author.bot && (content.includes('disabled all') || content.includes('disabled commands') || (msg.reference && messages.get(msg.reference.messageId || '')?.content.toLowerCase().includes('owo disable')));
                    if (isUserDisable || isOwoBotReply) {
                        try {
                            await msg.delete();
                            totalDeleted++;
                            console.log(`  🗑️ Silindi [#${ch.name}]: "${msg.content.slice(0, 40)}" (Yazar: ${msg.author.tag})`);
                            await new Promise((r) => setTimeout(r, 200));
                        }
                        catch (delErr) {
                            console.warn(`  ⚠️ Mesaj silinemedi [#${ch.name}]:`, delErr.message);
                        }
                    }
                }
            }
            catch (err) {
                // Channel might not have read history perm or empty
            }
        }
    }
    console.log(`\n✅ Temizlik tamamlandı! Toplam ${totalDeleted} adet mesaj başarıyla silindi.`);
    client.destroy();
}
main().catch(console.error);
