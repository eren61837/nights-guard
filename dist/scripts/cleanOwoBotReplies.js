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
    console.log('🧹 OwO botunun "disabled" mesajları aranıyor ve siliniyor...');
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
                const messages = await ch.messages.fetch({ limit: 100 });
                for (const [, msg] of messages) {
                    const content = msg.content.toLowerCase();
                    const isOwo = msg.author.bot && (msg.author.username.toLowerCase().includes('owo') || msg.author.id === '408785106942164992');
                    // Check if OwO message mentions disabled or commands
                    if (isOwo && (content.includes('disable') || content.includes('command') || content.includes('disabled'))) {
                        try {
                            await msg.delete();
                            totalDeleted++;
                            console.log(`  🗑️ Silindi [#${ch.name}]: "${msg.content.slice(0, 50)}"`);
                            await new Promise((r) => setTimeout(r, 200));
                        }
                        catch (e) {
                            console.warn(`  ⚠️ Silinemedi [#${ch.name}]:`, e.message);
                        }
                    }
                }
            }
            catch (err) { }
        }
    }
    console.log(`\n✅ OwO mesajları temizliği tamamlandı! Toplam silinen mesaj: ${totalDeleted}`);
    client.destroy();
}
main().catch(console.error);
